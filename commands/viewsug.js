const fs = require('fs');
const path = require('path');

const sugerenciasPath = path.join(__dirname, '../JSON/sugerencias.json');
const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const RESET = '\x1b[0m';

module.exports = {
    name: 'viewsug',

    async execute({ sock, jid }) {
        try {
            const sugerencias = fs.existsSync(sugerenciasPath)
                ? JSON.parse(fs.readFileSync(sugerenciasPath, 'utf8'))
                : [];

            if (!Array.isArray(sugerencias)) {
                throw new Error('El contenido de sugerencias.json no es una lista');
            }

            const lista = sugerencias.length > 0
                ? JSON.stringify(sugerencias, null, 2)
                : 'No hay sugerencias guardadas.';

            await sock.sendMessage(jid, {
                text: `═════════════
🪵            *VIEWSUG*
> _contenido completo de sugerencias.json_

═════════════

${lista}

═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });

            console.log(`${VERDE}          [ 🍃 ] Comando VIEWSUG ejecutado con éxito, se envió el contenido completo de sugerencias.json${RESET}`);
        } catch (error) {
            console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando VIEWSUG${RESET}`);
            await sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! No se pudo leer el contenido de sugerencias.json..._*'
            });
        }
    }
};
