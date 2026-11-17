const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const carpetaBot = path.join(__dirname, '..');   // la carpeta del bot (donde está TophBeifong.js)
const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const AMARILLO = '\x1b[33m';
const RESET = '\x1b[0m';

const NO_DISPONIBLE = 'No disponible';

// ─────────────────────────────────────────────────────────────
// Herramientas
// ─────────────────────────────────────────────────────────────

// Corre un programa y regresa lo que imprimió (o null si falló o tardó de más). Nunca truena.
function ejecutar(comando, args = [], timeout = 4000) {
    return new Promise(resolve => {
        let terminado = false;
        const terminar = valor => {
            if (terminado) return;
            terminado = true;
            clearTimeout(reloj);
            resolve(valor);
        };
        // Seguro extra: aunque el programa se quede colgado, aquí se corta
        const reloj = setTimeout(() => terminar(null), timeout + 500);
        try {
            cp.execFile(
                comando,
                args,
                { timeout, killSignal: 'SIGKILL', windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
                (error, salida) => terminar(error ? null : String(salida))
            );
        } catch {
            terminar(null);
        }
    });
}

// Guarda el resultado un rato para que, si mandan !info varias veces seguidas,
// no se vuelva a ejecutar todo (y si dos llegan a la vez, comparten el mismo cálculo).
// Solo se guarda lo que salió bien: si falló, se vuelve a intentar la próxima.
function conCache(duracionMs, funcion) {
    let valor = null;
    let vence = 0;
    let enCurso = null;
    return () => {
        if (valor !== null && Date.now() < vence) return Promise.resolve(valor);
        if (!enCurso) {
            enCurso = funcion()
                .then(resultado => {
                    if (resultado !== null && resultado !== undefined) {
                        valor = resultado;
                        vence = Date.now() + duracionMs;
                    }
                    return resultado;
                })
                .finally(() => { enCurso = null; });
        }
        return enCurso;
    };
}

function formatearBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return NO_DISPONIBLE;
    const unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
    let valor = bytes;
    let i = 0;
    while (valor >= 1024 && i < unidades.length - 1) {
        valor /= 1024;
        i++;
    }
    return `${valor.toFixed(i === 0 ? 0 : 1)} ${unidades[i]}`;
}

const capitalizar = texto => (texto && texto === texto.toLowerCase() ? texto[0].toUpperCase() + texto.slice(1) : texto);

// ─────────────────────────────────────────────────────────────
// ¿Dónde está corriendo el bot?
// ─────────────────────────────────────────────────────────────

const esTermux = () =>
    Boolean(process.env.TERMUX_VERSION) ||
    String(process.env.PREFIX || '').includes('com.termux') ||
    fs.existsSync('/data/data/com.termux');

const esAndroid = () => process.platform === 'android' || esTermux();

function appDondeCorre() {
    const env = process.env;

    let app;
    const detalles = [];
    if (esTermux()) {
        app = 'Termux';
    } else if (process.platform === 'android') {
        app = 'Terminal de Android';
    } else if (process.platform === 'win32') {
        app = env.PROMPT ? 'CMD' : 'PowerShell';   // solo CMD define la variable PROMPT
    } else {
        app = 'Terminal';
        detalles.push(process.platform === 'darwin' ? 'macOS' : 'Linux');
    }

    if (env.TERM_PROGRAM === 'vscode') detalles.push('VS Code');
    else if (env.WT_SESSION) detalles.push('Windows Terminal');
    if (env.SSH_CONNECTION || env.SSH_TTY) detalles.push('por SSH');
    if (env.TMUX) detalles.push('tmux');
    if (env.pm_id !== undefined || env.NODE_APP_INSTANCE !== undefined) detalles.push('pm2');

    return detalles.length ? `${app} (${detalles.join(', ')})` : app;
}

// ─────────────────────────────────────────────────────────────
// Teléfono / equipo y procesador (no cambian mientras el bot está prendido)
// ─────────────────────────────────────────────────────────────

// Android: "getprop" imprime todas las propiedades del teléfono, una por línea: [llave]: [valor]
async function leerPropsAndroid() {
    const salida = (await ejecutar('getprop', [], 3000)) || (await ejecutar('/system/bin/getprop', [], 3000));
    if (!salida) return null;

    const props = {};
    for (const linea of salida.split('\n')) {
        const coincidencia = linea.match(/^\[(.+?)\]: \[(.*)\]\s*$/);
        if (coincidencia) props[coincidencia[1]] = coincidencia[2];
    }
    return Object.keys(props).length ? props : null;
}

function nombreTelefonoAndroid(p) {
    const marca = capitalizar(p['ro.product.manufacturer'] || p['ro.product.brand'] || '');
    const comercial = p['ro.product.marketname'] || p['ro.product.vendor.marketname'] ||
        p['ro.product.odm.marketname'] || p['ro.product.system.marketname'] ||
        p['ro.config.marketing_name'] || p['ro.vendor.oplus.market.name'] || '';
    const modelo = p['ro.product.model'] || p['ro.product.device'] || '';

    let nombre = comercial || modelo;
    if (!nombre) return null;
    if (marca && !nombre.toLowerCase().startsWith(marca.toLowerCase())) nombre = `${marca} ${nombre}`;
    if (comercial && modelo && comercial !== modelo) nombre += ` (${modelo})`;
    return nombre;
}

function procesadorAndroid(p) {
    const fabricante = p['ro.soc.manufacturer'] === 'QTI' ? 'Qualcomm' : p['ro.soc.manufacturer'];
    const chip = [fabricante, p['ro.soc.model']].filter(Boolean).join(' ');
    return chip || p['ro.hardware.chipname'] || p['ro.mediatek.platform'] || p['ro.board.platform'] || null;
}

// Linux (PC o Raspberry Pi): el nombre del equipo está en estos archivos
function equipoLinux() {
    const leer = ruta => {
        try {
            return fs.readFileSync(ruta, 'utf8').replace(/\0/g, '').trim();
        } catch {
            return '';
        }
    };
    const placa = leer('/proc/device-tree/model');
    if (placa) return placa;
    return [leer('/sys/devices/virtual/dmi/id/sys_vendor'), leer('/sys/devices/virtual/dmi/id/product_name')]
        .filter(Boolean).join(' ') || null;
}

async function nombreEquipoPC() {
    if (process.platform === 'win32') {
        const salida = await ejecutar('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-Command',
            'Get-CimInstance Win32_ComputerSystem | Select-Object -First 1 Manufacturer,Model | ConvertTo-Json -Compress'
        ], 10000);
        try {
            const datos = JSON.parse(salida);
            const nombre = [datos.Manufacturer, datos.Model].filter(Boolean).join(' ').trim();
            if (nombre) return nombre;
        } catch { /* sigue con el respaldo */ }
    } else {
        const nombre = equipoLinux();
        if (nombre) return nombre;
    }
    return os.hostname();
}

function nombreProcesador(props) {
    const deCpuinfo = () => {
        try {
            const coincidencia = fs.readFileSync('/proc/cpuinfo', 'utf8').match(/^(?:model name|Hardware)\s*:\s*(.+)$/m);
            return coincidencia ? coincidencia[1].trim() : null;
        } catch {
            return null;
        }
    };
    const deNode = () => {
        try {
            return os.cpus()[0]?.model || null;
        } catch {
            return null;
        }
    };
    const candidatos = [props && procesadorAndroid(props), deCpuinfo(), deNode()];
    return candidatos.find(nombre => nombre && nombre.toLowerCase() !== 'unknown') || null;
}

function cantidadNucleos() {
    try {
        return os.availableParallelism ? os.availableParallelism() : os.cpus().length;
    } catch {
        return 0;
    }
}

async function cargarEstaticos() {
    const android = esAndroid();
    const props = android ? await leerPropsAndroid() : null;

    let telefono = null;
    if (android) {
        if (props) {
            telefono = nombreTelefonoAndroid(props);
            if (telefono && props['ro.build.version.release']) telefono += ` · Android ${props['ro.build.version.release']}`;
        }
    } else {
        telefono = await nombreEquipoPC();
    }

    const nucleos = cantidadNucleos();
    const procesador = [
        nombreProcesador(props) || 'Procesador desconocido',
        nucleos ? `${nucleos} núcleos` : null,
        os.arch()
    ].filter(Boolean).join(' · ');

    return { android, telefono: telefono || NO_DISPONIBLE, procesador };
}

// ─────────────────────────────────────────────────────────────
// Batería
// ─────────────────────────────────────────────────────────────

const ESTADOS_BATERIA = {
    'charging': 'cargando ⚡',
    'discharging': 'descargando',
    'full': 'llena',
    'not charging': 'conectada, sin cargar'
};
const estadoBateria = texto => ESTADOS_BATERIA[String(texto || '').toLowerCase().replace(/[_-]/g, ' ').trim()] || null;

// Windows: códigos de BatteryStatus
const ESTADOS_WINDOWS = {
    1: 'descargando', 2: 'conectada', 3: 'llena', 4: 'descargando', 5: 'descargando',
    6: 'cargando ⚡', 7: 'cargando ⚡', 8: 'cargando ⚡', 9: 'cargando ⚡', 11: 'conectada'
};

// Linux y Android: la batería está en /sys/class/power_supply (si el sistema deja leerla)
function bateriaDesdeSys() {
    const base = '/sys/class/power_supply';
    try {
        const esBateriaPrincipal = nombre => /^(battery|BAT)/i.test(nombre);
        const nombres = fs.readdirSync(base)
            .sort((a, b) => Number(esBateriaPrincipal(b)) - Number(esBateriaPrincipal(a)));

        for (const nombre of nombres) {
            const leer = archivo => {
                try {
                    return fs.readFileSync(`${base}/${nombre}/${archivo}`, 'utf8').trim();
                } catch {
                    return '';
                }
            };
            if (leer('type').toLowerCase() !== 'battery') continue;
            if (leer('scope').toLowerCase() === 'device') continue;   // baterías de mouse, audífonos, etc.

            const capacidad = leer('capacity');
            const porcentaje = Number(capacidad);
            if (capacidad === '' || !Number.isFinite(porcentaje)) continue;
            return { porcentaje, estado: estadoBateria(leer('status')) };
        }
    } catch { /* sin acceso a /sys */ }
    return null;
}

// Termux: necesita la app Termux:API y el paquete termux-api
function bateriaDesdeTermuxApi(texto) {
    try {
        const datos = JSON.parse(texto);
        const porcentaje = Number(datos.percentage);
        if (!Number.isFinite(porcentaje)) return null;
        return { porcentaje, estado: estadoBateria(datos.status) };
    } catch {
        return null;
    }
}

function bateriaDesdeWindows(texto) {
    try {
        let datos = JSON.parse(texto);
        if (Array.isArray(datos)) datos = datos[0];
        if (datos?.EstimatedChargeRemaining == null) return null;
        const porcentaje = Number(datos.EstimatedChargeRemaining);
        if (!Number.isFinite(porcentaje)) return null;
        return { porcentaje, estado: ESTADOS_WINDOWS[datos.BatteryStatus] || null };
    } catch {
        return null;
    }
}

async function leerBateria() {
    let bateria = null;

    if (process.platform === 'win32') {
        bateria = bateriaDesdeWindows(await ejecutar('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-Command',
            'Get-CimInstance Win32_Battery | Select-Object -First 1 EstimatedChargeRemaining,BatteryStatus | ConvertTo-Json -Compress'
        ], 10000));
    } else {
        bateria = bateriaDesdeSys();
        if (!bateria && esTermux()) {
            bateria = bateriaDesdeTermuxApi(await ejecutar('termux-battery-status', [], 4000));
        }
    }

    if (!bateria) {
        const ayuda = esTermux() ? ' (para verla en Termux instala la app Termux:API y el paquete termux-api)' : '';
        console.error(`${AMARILLO}          [ 🍤 ] INFO: no pude leer la batería${ayuda}${RESET}`);
    }
    return bateria;
}

// ─────────────────────────────────────────────────────────────
// Almacenamiento y peso de la carpeta del bot
// ─────────────────────────────────────────────────────────────

function leerAlmacenamiento() {
    try {
        const datos = fs.statfsSync(carpetaBot);
        return {
            total: datos.blocks * datos.bsize,
            usado: (datos.blocks - datos.bfree) * datos.bsize,
            libre: datos.bavail * datos.bsize
        };
    } catch {
        return null;
    }
}

// Respaldo (Windows, o si "du" no existe): suma el tamaño de todos los archivos
async function sumarCarpeta(carpeta, limiteMs = 20000) {
    const limite = Date.now() + limiteMs;
    let total = 0;
    const pendientes = [carpeta];

    while (pendientes.length) {
        if (Date.now() > limite) return null;
        const actual = pendientes.pop();

        let entradas;
        try {
            entradas = await fs.promises.readdir(actual, { withFileTypes: true });
        } catch {
            continue;
        }
        await Promise.all(entradas.map(async entrada => {
            const ruta = path.join(actual, entrada.name);
            if (entrada.isDirectory()) {
                pendientes.push(ruta);
            } else if (entrada.isFile()) {
                try {
                    total += (await fs.promises.stat(ruta)).size;
                } catch { /* archivo que desapareció */ }
            }
        }));
    }
    return total;
}

async function calcularPeso(carpeta) {
    if (process.platform !== 'win32') {
        const salida = await ejecutar('du', ['-sk', carpeta], 15000);
        const kilobytes = Number(String(salida || '').trim().split(/\s+/)[0]);
        if (salida && Number.isFinite(kilobytes)) return kilobytes * 1024;
    }
    return sumarCarpeta(carpeta);
}

// ─────────────────────────────────────────────────────────────
// Lo que se guarda en memoria entre un !info y otro
// ─────────────────────────────────────────────────────────────
const leerEstaticos = conCache(Infinity, cargarEstaticos);          // teléfono y procesador: no cambian
const leerBateriaCache = conCache(15 * 1000, leerBateria);           // batería: se refresca cada 15 s
const leerPesoCache = conCache(5 * 60 * 1000, () => calcularPeso(carpetaBot));   // peso de la carpeta: cada 5 min

const linea = (emoji, titulo, valor) => `> _*[ ${emoji} ] ${titulo}:*_ *${valor}*`;

module.exports = {
    name: 'info',

    async execute({ sock, jid }) {
        try {
            const seguro = promesa => promesa.catch(() => null);
            const [estaticos, bateria, peso] = await Promise.all([
                seguro(leerEstaticos()),
                seguro(leerBateriaCache()),
                seguro(leerPesoCache())
            ]);

            const textoBateria = bateria
                ? `${bateria.porcentaje}%${bateria.estado ? ` (${bateria.estado})` : ''}`
                : NO_DISPONIBLE;

            const ramBot = process.memoryUsage().rss;
            const textoRam = `${formatearBytes(ramBot)} (de ${formatearBytes(os.totalmem())} del equipo, ${formatearBytes(os.freemem())} libres)`;

            const almacenamiento = leerAlmacenamiento();
            const textoAlmacenamiento = almacenamiento
                ? `${formatearBytes(almacenamiento.usado)} usados de ${formatearBytes(almacenamiento.total)} (${formatearBytes(almacenamiento.libre)} libres)`
                : NO_DISPONIBLE;

            const numeroBot = sock.user?.id ? String(sock.user.id).split('@')[0].split(':')[0] : null;

            const lineas = [
                linea('🫟', 'Batería', textoBateria),
                linea('🫟', estaticos?.android ? 'Teléfono' : 'Equipo', estaticos?.telefono || NO_DISPONIBLE),
                linea('🫟', 'RAM del bot', textoRam),
                linea('🫟', 'Almacenamiento', textoAlmacenamiento),
                linea('🫟', 'Peso del bot', peso == null ? NO_DISPONIBLE : formatearBytes(peso)),
                linea('🫟', 'Procesador', estaticos?.procesador || NO_DISPONIBLE),
                linea('🫟', 'Número del bot', numeroBot ? `+${numeroBot}` : NO_DISPONIBLE),
                linea('🫟', 'Corriendo en', appDondeCorre())
            ];

            await sock.sendMessage(jid, {
                text: `═════════════
🪵            *INFO*
> _información del equipo donde corre el bot_
═════════════

${lineas.join('\n')}

═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });

            console.log(`${VERDE}          [ 🍀 ] Comando INFO ejecutado con éxito, se envió la información del equipo${RESET}`);
        } catch (error) {
            console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando INFO: ${error.message}${RESET}`);
            await sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! No se pudo leer la información del equipo..._*'
            });
        }
    }
};
