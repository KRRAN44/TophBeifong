const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../JSON/warns.json');

module.exports = {
    name: 'warnlist',
    aliases: ['Warnlist'],

    async execute({ sock, jid }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._*`
            });
        }

        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }

        const warns = config?.warns?.[jid] || {};
        const usuarios = Object.keys(warns);

        if (usuarios.length === 0) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] No hay usuarios con advertencias..._*`
            });
        }

        const lista = usuarios
            .map(id => `• @${id.split('@')[0]} — ${warns[id]}/4`)
            .join('\n');
        
            console.log(`        [ 🗺️ ] Comando Warnlist ejecutado con éxito, se envió la lista de warns`);
        await sock.sendMessage(jid, {
            text: `═════════════════
*🪵            WARN LIST*
> _advertencias disponibles:_ \n\n*${lista}*
═════════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`,
            mentions: usuarios
        });
    }
};