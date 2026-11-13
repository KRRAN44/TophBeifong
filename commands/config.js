const fs = require('fs');
const path = require('path');

const jsonDir = path.join(__dirname, '../JSON');
const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const RESET = '\x1b[0m';

const tieneTexto = entrada =>
    typeof entrada?.text === 'string' && entrada.text.trim().length > 0;

const estadoConTexto = entrada => {
    if (!tieneTexto(entrada)) return 'No configurado';
    return entrada.enabled === false
        ? 'Configurado (desactivado)'
        : 'Configurado (activado)';
};

// ─────────────────────────────────────────────────────────────
// Las configuraciones que muestra !settings (en este orden).
//   nombre   → como se ve en el mensaje
//   archivos → archivos de la carpeta JSON donde puede estar guardada
//   llaves   → llave(s) dentro del JSON que tienen los grupos adentro
//   cuenta   → cuándo se considera "Configurado"
// Para agregar otra configuración, copia un bloque y cambia estos datos.
// ─────────────────────────────────────────────────────────────
const AJUSTES = [
    {
        // { "antilink": { "<grupo>": { "enabled": true|false } } }
        nombre: 'Antilink',
        archivos: ['antilink.json'],
        llaves: ['antilink'],
        estado: entrada => typeof entrada?.enabled === 'boolean'
            ? (entrada.enabled ? 'Configurado (activado)' : 'Configurado (desactivado)')
            : 'No configurado'
    },
    {
        // { "bienvenidas": { "<grupo>": { "text": "...", "enabled": true } } }
        nombre: 'Bienvenida',
        archivos: ['bienvenida.json'],
        llaves: ['bienvenidas'],
        estado: estadoConTexto
    },
    {
        // { "despedidas": { "<grupo>": { "text": "...", "enabled": true } } }
        nombre: 'Despedida',
        archivos: ['despedidas.json'],
        llaves: ['despedidas'],
        estado: estadoConTexto
    },
    {
        // { "grupos": { "<grupo>": { "text": "...", "enabled": true, "nextSendAt": 0 } } }
        nombre: 'Programar',
        archivos: ['msg-programados.json'],
        llaves: ['grupos'],
        estado: estadoConTexto
    },
    {
        // { "bienvenidas2": { "<grupo>": { "text": "...", "enabled": true } } }
        nombre: 'Bienvenida2',
        archivos: ['bienvenida.json'],
        llaves: ['bienvenidas2'],
        estado: estadoConTexto
    },
    {
        // { "parejas": { "<grupo remitente>": { "remitente": "...", "grupoId": "<grupo receptor>", "grupo": "..." } } }
        nombre: 'SetAdm',
        archivos: ['adm-notificaciones.json'],
        llaves: ['parejas'],
        estado: entrada => String(entrada?.grupoId || '').endsWith('@g.us')
            ? 'Configurado'
            : 'No configurado'
    }
];

// Lee cada archivo una sola vez por ejecución. Si falta, regresa null; si está dañado, avisa en consola
function crearLector() {
    const guardados = new Map();
    return archivo => {
        if (guardados.has(archivo)) return guardados.get(archivo);

        const ruta = path.join(jsonDir, archivo);
        let datos = null;
        if (fs.existsSync(ruta)) {
            try {
                datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
            } catch (error) {
                console.error(`${ROJO}          [ 🍤 ] SETTINGS no pudo leer ${archivo}: ${error.message}${RESET}`);
            }
        }
        guardados.set(archivo, datos);
        return datos;
    };
}

// Saca lo que hay anotado para ESTE grupo (si el JSON es un objeto por grupo, o una lista con el grupo adentro)
function entradaDelGrupo(valor, jid) {
    if (Array.isArray(valor)) {
        return valor.find(item => item && [item.jid, item.grupo, item.grupoId, item.groupId, item.id].includes(jid));
    }
    return valor?.[jid];
}

function estadoAjuste(ajuste, jid, leer) {
    for (const archivo of ajuste.archivos) {
        const datos = leer(archivo);
        if (!datos || typeof datos !== 'object') continue;

        for (const llave of ajuste.llaves) {
            const entrada = entradaDelGrupo(datos[llave], jid);
            if (entrada) {
                const estado = ajuste.estado(entrada);
                if (estado !== 'No configurado') return estado;
            }
        }
    }
    return 'No configurado';
}

// Línea separadora de tamaño al azar, por ejemplo: *——— —- -*
function separador() {
    const grupos = 2 + Math.floor(Math.random() * 3);              // entre 2 y 4 grupos
    const partes = [];
    for (let i = 0; i < grupos; i++) {
        const largo = 1 + Math.floor(Math.random() * 8);            // de 1 a 8 rayitas cada uno
        partes.push((Math.random() < 0.3 ? '-' : '—').repeat(largo));
    }
    return `*${partes.join(' ')}*`;
}

module.exports = {
    name: 'settings',

    async execute({ sock, jid }) {
        if (!jid.endsWith('@g.us')) {
            console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando SETTINGS${RESET}`);
            return sock.sendMessage(jid, {
                text: '> *_[ 🌻 ] ERROR! Este comando solo está permitido en grupos..._*'
            });
        }

        try {
            const leer = crearLector();

            const lineas = AJUSTES.map(ajuste => {
                const estado = estadoAjuste(ajuste, jid, leer);
                return `> _*[ 🐸 ] ${ajuste.nombre}: ${estado}*_`;
            });

            // Un separador distinto (de tamaño al azar) entre cada línea, no después de la última
            const lista = lineas
                .map((linea, i) => (i === 0 ? linea : `${separador()}\n${linea}`))
                .join('\n');

            await sock.sendMessage(jid, {
                text: `═════════════
🪵            *SETTINGS*
> _configuraciones de este grupo_
═════════════

${lista}

═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });

            console.log(`${VERDE}          [ 🐸 ] Comando SETTINGS ejecutado con éxito, se enviaron las configuraciones del grupo${RESET}`);
        } catch (error) {
            console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando SETTINGS: ${error.message}${RESET}`);
            await sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! No se pudieron leer las configuraciones del grupo..._*'
            });
        }
    }
};
