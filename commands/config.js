const fs = require('fs');
const path = require('path');

const jsonDir = path.join(__dirname, '../JSON');
const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const RESET = '\x1b[0m';

// ¿La entrada del grupo cuenta como "activa"?
// Una lista con algo adentro, o un objeto que no esté apagado con enabled: false
const existe = entrada => Array.isArray(entrada)
    ? entrada.length > 0
    : Boolean(entrada) && entrada.enabled !== false;

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
        // { "antilink": { "<grupo>": { "enabled": true } } }
        nombre: 'Antilink',
        archivos: ['antilink.json'],
        llaves: ['antilink'],
        cuenta: entrada => entrada.enabled === true
    },
    {
        // { "bienvenidas": { "<grupo>": { "text": "...", "enabled": true } } }
        nombre: 'Bienvenida',
        archivos: ['bienvenida.json'],
        llaves: ['bienvenidas'],
        cuenta: entrada => entrada.enabled === true && Boolean(entrada.text)
    },
    {
        // { "despedidas": { "<grupo>": { "text": "...", "enabled": true } } }  (mismo archivo que bienvenida)
        nombre: 'Despedida',
        archivos: ['bienvenida.json'],
        llaves: ['despedidas'],
        cuenta: entrada => entrada.enabled === true && Boolean(entrada.text)
    },
    {
        // ⚠️ SUPUESTO: no he visto este comando, así que busco en los nombres más probables
        nombre: 'Programar',
        archivos: ['programar.json', 'programados.json', 'programaciones.json'],
        llaves: ['programar', 'programados', 'programaciones'],
        cuenta: existe
    },
    {
        // ⚠️ SUPUESTO: no he visto este comando, así que busco en los nombres más probables
        nombre: 'Bienvenida2',
        archivos: ['bienvenida2.json', 'bienvenida.json'],
        llaves: ['bienvenidas2', 'bienvenida2'],
        cuenta: existe
    },
    {
        // { "parejas": { "<grupo remitente>": { "remitente": "...", "grupoId": "<grupo receptor>", "grupo": "..." } } }
        nombre: 'SetAdm',
        archivos: ['adm-notificaciones.json'],
        llaves: ['parejas'],
        cuenta: entrada => String(entrada.grupoId || '').endsWith('@g.us')
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
        return valor.filter(item => item && [item.jid, item.grupo, item.grupoId, item.groupId, item.id].includes(jid));
    }
    return valor?.[jid];
}

function estaConfigurado(ajuste, jid, leer) {
    for (const archivo of ajuste.archivos) {
        const datos = leer(archivo);
        if (!datos || typeof datos !== 'object') continue;

        for (const llave of ajuste.llaves) {
            const entrada = entradaDelGrupo(datos[llave], jid);
            if (entrada && ajuste.cuenta(entrada)) return true;
        }
    }
    return false;
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
                const estado = estaConfigurado(ajuste, jid, leer) ? 'Configurado' : 'No configurado';
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
