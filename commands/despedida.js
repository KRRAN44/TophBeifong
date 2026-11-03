const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../JSON/despedidas.json');

module.exports = {
    name: 'despedida',
    aliases: ['Despedida','bye'],

    async execute({ sock, jid, args }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._*`
            });
        }

        const texto = args.trim();

        if (!texto) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! Debes proporcionar un texto para la despedida..._*`
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

        config.despedidas[jid] = {
            text: texto,
            enabled: true
        };

        fs.writeFileSync(
            configPath,
            JSON.stringify(config, null, 2)
        );
        console.log(`        [ 🗺️ ] Comando Despedida ejecutado con éxito, se configuró la despedida`);
        await sock.sendMessage(jid, {
            text: `═════════════
*🪵            DESPEDIDA*
> _la despedida ha sido configurada con exito para este grupo_
═════════════

*${texto}*

═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
        });
    }
};