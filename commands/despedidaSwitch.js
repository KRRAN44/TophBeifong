const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../JSON/despedidas.json');

module.exports = {
    name: '#despedida',
    aliases: ['#Despedida'],

    async execute({ sock, jid }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._*`
            
            });
        }

        let config = {};

        if (fs.existsSync(configPath)) {
            config = JSON.parse(
                fs.readFileSync(configPath, 'utf8')
            );
        }

        if (!config.despedidas) {
            config.despedidas = {};
        }

        const actual = config.despedidas[jid];

        if (!actual) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! No hay despedida configurada para este grupo..._*`
            });
        }

        actual.enabled = !actual.enabled;

        fs.writeFileSync(
            configPath,
            JSON.stringify(config, null, 2)
        );
        console.log(`        [ 🗺️ ] Comando Despedida ejecutado con éxito, se configuró la despedida`);
        await sock.sendMessage(jid, {
            text: actual.enabled
                ? `═════════════
*🪵            DESPEDIDA*
> _despedida *activada*, los miembros que salgan recibirán el mensaje_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
                : `═════════════
*🪵            DESPEDIDA*
> _despedida *desactivada*, los miembros que salgan no recibirán mensaje_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
        });
    }
};