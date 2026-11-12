const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../JSON/bienvenida.json');
const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const RESET = '\x1b[0m';

module.exports = {
    name: 'bienvenida2',

    async execute({ sock, jid, args }) {
        if (!jid.endsWith('@g.us')) {
            console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando BIENVENIDA2${RESET}`);
            return sock.sendMessage(jid, {
                text: '> *_[ 🌻 ] ERROR! Este comando solo está permitido en grupos..._*'
            });
        }

        const texto = args.trim();
        if (!texto) {
            console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando BIENVENIDA2${RESET}`);
            return sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! Debes proporcionar un segundo mensaje de bienvenida..._*'
            });
        }

        try {
            const config = fs.existsSync(configPath)
                ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
                : {};
            if (!config.bienvenidas2) config.bienvenidas2 = {};
            config.bienvenidas2[jid] = { text: texto, enabled: true };
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

            await sock.sendMessage(jid, {
                text: `═════════════
🪵            *BIENVENIDA2*
> _la segunda bienvenida quedó configurada para este grupo_
═════════════

${texto}

═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });
            console.log(`${VERDE}          [ 🍀 ] Comando BIENVENIDA2 ejecutado con éxito, se configuró la segunda bienvenida${RESET}`);
        } catch (error) {
            console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando BIENVENIDA2${RESET}`);
            await sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! No se pudo guardar la segunda bienvenida..._*'
            });
        }
    }
};
