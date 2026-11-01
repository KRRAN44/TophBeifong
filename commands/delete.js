module.exports = {
    name: 'delete',
    aliases: ['DW', 'd'],

    async execute({ sock, message, jid }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text:  `> *_[ 🍤 ] error al ejecutar.._*`
            });
        }

        const metadata = await sock.groupMetadata(jid);
        const participants = metadata.participants;

        const sender = message?.key?.participant || message?.key?.remoteJid;
        const senderData = participants.find(p => p.id === sender);
        const isAdmin =
            senderData?.admin === 'admin' ||
            senderData?.admin === 'superadmin';

        if (!isAdmin) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] este comando solo se puede ejecutar por administradores_*`
            });
        }

        const botNumber = sock.user.id.split(':')[0].split('@')[0];
        const botData = participants.find(p => {
            const idNumber = p.id?.split('@')[0];
            const phoneNumber = p.phoneNumber?.split('@')[0];
            return idNumber === botNumber || phoneNumber === botNumber;
        });
        const botIsAdmin =
            botData?.admin === 'admin' ||
            botData?.admin === 'superadmin';

        if (!botIsAdmin) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] el bot no tiene permisos de administrador...._*`
            });
        }

        const contextInfo = message.message?.extendedTextMessage?.contextInfo;
        const stanzaId = contextInfo?.stanzaId;
        const participantCitado = contextInfo?.participant;

        if (!stanzaId) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] sin mensaje seleccionado para eliminar...._*`
            });
        }

        try {
            console.log(`        [ 🗺️ ] Comando Delete ejecutado con éxito, se eliminó el mensaje citado del grupo`);
            await sock.sendMessage(jid, {
                delete: {
                    remoteJid: jid,
                    id: stanzaId,
                    participant: participantCitado,
                    fromMe: false
                }
            });
        } catch (error) {
            console.error('Error al borrar mensaje:', error);

            await sock.sendMessage(jid, {
                text:  `> *_[ 🍤 ] error al ejecutar.._*`
            });
        }
    }
};