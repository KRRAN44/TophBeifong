const fs = require('fs')
const path = require('path')

const configPath = path.join(__dirname, '../JSON/antilink.json')

module.exports = {
    name: '#antilink',
    aliases: ['#Antilink', '#AntiLink'],

    async execute({ sock, message, jid }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._*`
            })
        }

        const metadata = await sock.groupMetadata(jid)
        const participants = metadata.participants

        const sender = message?.key?.participant || message?.key?.remoteJid
        const senderData = participants.find(p => p.id === sender)
        const isAdmin =
            senderData?.admin === 'admin' ||
            senderData?.admin === 'superadmin'

        if (!isAdmin) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] solo administradores pueden usar este comando..._*`
            })
        }

        let config = {}
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        }

        if (!config.antilink) config.antilink = {}
        if (!config.antilink[jid]) config.antilink[jid] = { enabled: false }

        config.antilink[jid].enabled = !config.antilink[jid].enabled

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
        console.log(`        [ 🗺️ ] Comando antilink ejecutado con éxito, antilink ${config.antilink[jid].enabled ? 'activado' : 'desactivado'}`)
        await sock.sendMessage(jid, {
            text: config.antilink[jid].enabled
                ? `═════════════
*🪵            antilink*
> _antilink *activado*, no se pueden enviar mas enlaces_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
                : `═════════════
*🪵            antilink*
> _antilink *desactivado*, se pueden enviar enlaces_
═════════════
𔑳࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
        })
    }
}