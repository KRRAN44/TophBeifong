module.exports = {
    name: 'invite',

    async execute({ sock, message, jid, args }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] Este comando solo se puede usar en grupos..._*'
            });
        }

        const numero = String(args || '').replace(/\D/g, '');
        if (!/^\d{8,15}$/.test(numero)) {
            return sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] Escribe un número con código de país. Ejemplo: !invite 523311114444_*'
            });
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants || [];
            const botNumber = sock.user.id.split(':')[0].split('@')[0];
            const botData = participants.find(person =>
                person.id?.split('@')[0] === botNumber ||
                person.phoneNumber?.split('@')[0] === botNumber
            );
            const sender = message?.key?.participant || message?.key?.remoteJid;
            const senderData = message?.key?.fromMe
                ? botData
                : participants.find(person => person.id === sender || person.phoneNumber === sender);
            const isAdmin = senderData?.admin === 'admin' || senderData?.admin === 'superadmin';

            if (!isAdmin) {
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] Solo los administradores pueden usar este comando..._*'
                });
            }

            // Resuelve el teléfono al JID que WhatsApp conoce (PN o LID)
            // y evita confirmar el envío a números que no tienen WhatsApp.
            const contactos = await sock.onWhatsApp(numero);
            const contacto = contactos?.find(resultado => resultado.exists);
            if (!contacto?.jid) {
                return sock.sendMessage(jid, {
                    text: `> *_[ 🍤 ] No encontré una cuenta de WhatsApp para el número ${numero}..._*`
                });
            }

            const codigo = await sock.groupInviteCode(jid);
            if (!codigo) throw new Error('WhatsApp no regresó el código de invitación');

            const enlace = `https://chat.whatsapp.com/${codigo}`;
            let numeroEjecutor = message?.key?.fromMe
                ? sock.user.id
                : (senderData?.phoneNumber || senderData?.id || sender);
            if (typeof numeroEjecutor === 'string' && numeroEjecutor.endsWith('@lid')) {
                try {
                    numeroEjecutor = await sock.signalRepository?.lidMapping?.getPNForLID(numeroEjecutor) || numeroEjecutor;
                } catch (error) {
                    console.error('No se pudo resolver el número del administrador:', error);
                }
            }
            numeroEjecutor = String(numeroEjecutor || '').split('@')[0].split(':')[0];

            await sock.sendMessage(contacto.jid, {
                text: `═════════════
🪵            *INVITACIÓN AL GRUPO*
> _*te han invitado al grupo...*_
 "${metadata.subject || 'de WhatsApp'}" 
> _*de parte de ${numeroEjecutor}*_
> _unete : ${enlace}_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });

            await sock.sendMessage(jid, {
                text: `═════════════
🪵            *INVITE*
> _*WhatsApp aceptó el envío del enlace por privado a +${numero}*_
> _#: wa.me/${numero}?text=Toph_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });
            console.log(`        [ 🗺️ ] Comando INVITE ejecutado: se envió el enlace del grupo a ${numero}`);
        } catch (error) {
            console.error('Error en invite:', error);
            await sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! No pude obtener o enviar el enlace. Comprueba que el bot sea administrador y que el número pueda recibir mensajes..._*'
            });
        }
    }
};
