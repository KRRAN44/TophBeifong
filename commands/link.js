// !link -> saca el link de invitación del grupo donde se escribe y lo manda a ese mismo grupo.
// Solo LEE el link que el grupo ya tiene: no lo cambia (para cambiarlo existe groupRevokeInvite y aquí NO se usa).

// ⚙️ AJUSTE
const SOLO_ADMINS = true // true = solo los admins pueden pedir el link. Pon false si quieres que cualquier miembro pueda

// Mensaje con caja, en el mismo estilo de los demás comandos
function armarMensaje(lineas) {
    return `═════════════
*🪵     LINK DEL GRUPO*
${lineas.join('\n')}
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
}

function errorTexto(texto) {
    return `> *_[ 🍤 ] ERROR! ${texto}_*`
}

module.exports = {
    name: 'link',

    async execute({ sock, message, jid }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: errorTexto('Este comando fue hecho para usarse en grupos...') })
        }

        const metadata = await sock.groupMetadata(jid)
        const participants = metadata.participants

        // ¿El bot es admin? (WhatsApp solo le da el link a los admins)
        const botNumber = sock.user.id.split(':')[0].split('@')[0]
        const botData = participants.find(p => {
            const idNumber = p.id?.split('@')[0]
            const phoneNumber = p.phoneNumber?.split('@')[0]
            return idNumber === botNumber || phoneNumber === botNumber
        })
        const botIsAdmin = botData?.admin === 'admin' || botData?.admin === 'superadmin'

        if (SOLO_ADMINS) {
            // ¿Quien lo manda es admin? (si lo manda el propio número del bot, cuenta como el bot)
            const sender = message?.key?.participant || message?.key?.remoteJid
            const senderData = message?.key?.fromMe ? botData : participants.find(p => p.id === sender)
            const isAdmin = senderData?.admin === 'admin' || senderData?.admin === 'superadmin'

            if (!isAdmin) {
                return sock.sendMessage(jid, { text: errorTexto('Solo admins pueden usar este comando...') })
            }
        }

        // Baileys regresa solo el código (lo que va después de https://chat.whatsapp.com/)
        let codigo

        try {
            codigo = await sock.groupInviteCode(jid)
        } catch (error) {
            console.error('Error al sacar el link del grupo:', error)

            return sock.sendMessage(jid, {
                text: errorTexto(botIsAdmin
                    ? 'WhatsApp no me dejó sacar el link, intenta de nuevo en un ratito...'
                    : 'No pude sacar el link porque no soy admin del grupo...')
            })
        }

        if (!codigo) {
            return sock.sendMessage(jid, { text: errorTexto('WhatsApp no me dio el link de este grupo...') })
        }

        const lineas = []
        if (metadata.subject) lineas.push(`> ${metadata.subject}`)
        lineas.push(`https://chat.whatsapp.com/${codigo}`)

        await sock.sendMessage(jid, { text: armarMensaje(lineas) })

        console.log(`        [ 🗺️ ] Comando Link ejecutado con éxito, se envió el link del grupo`)
    }
}
