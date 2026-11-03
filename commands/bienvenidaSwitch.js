const fs = require('fs')
const path = require('path')

const configPath = path.join(__dirname, '../JSON/bienvenida.json')

module.exports = {
    name: '#bienvenida',
    aliases: ['#Bienvenida'],

    async execute({ sock, jid }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._*`
            })
        }

        let config = {}

        if (fs.existsSync(configPath)) {
            config = JSON.parse(
                fs.readFileSync(configPath, 'utf8')
            )
        }

        if (!config.bienvenidas) {
            config.bienvenidas = {}
        }

        const actual = config.bienvenidas[jid]

        if (!actual) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! No hay una bienvenida configurada para este grupo..._*`
            })
        }

        actual.enabled = !actual.enabled

        fs.writeFileSync(
            configPath,
            JSON.stringify(config, null, 2)
        )

        await sock.sendMessage(jid, {
            text: actual.enabled
                ? `═════════════
*🪵            BIENVENIDA*
> _bienvenida *activada*, los nuevos miembros recibirán el mensaje_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
                : `═════════════
*🪵            BIENVENIDA*
> _bienvenida *desactivada*, los nuevos miembros no recibirán el mensaje_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
        })
    }
}