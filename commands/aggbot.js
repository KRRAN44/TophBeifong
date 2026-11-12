module.exports = {
    name: 'aggbot',

    async execute({ sock, jid, args }) {
        let inviteCode

        try {
            const inviteUrl = new URL(args.trim())
            const pathParts = inviteUrl.pathname.split('/').filter(Boolean)

            if (
                inviteUrl.protocol !== 'https:' ||
                inviteUrl.hostname !== 'chat.whatsapp.com' ||
                pathParts.length !== 1
            ) {
                throw new Error('Enlace de invitación no válido')
            }

            inviteCode = pathParts[0]
        } catch {
            return sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! Usa el comando con un enlace válido: !aggbot https://chat.whatsapp.com/código_*'
            })
        }

        try {
            const groupJid = await sock.groupAcceptInvite(inviteCode)

            if (!groupJid) {
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] No pude entrar al grupo. Revisa que el enlace siga activo..._*'
                })
            }

            await sock.sendMessage(jid, {
                text: `═════════════
*🪵            AGGBOT*
> _el bot entro al grupo con exito_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            })
            console.log(`        [ 🗺️ ] Comando Aggbot ejecutado con éxito, se unió a ${groupJid}`)
        } catch (error) {
            console.error('Error al unirse al grupo:', error)

            await sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] No pude entrar al grupo. El enlace puede haber expirado o WhatsApp rechazó la invitación..._*'
            })
        }
    }
}