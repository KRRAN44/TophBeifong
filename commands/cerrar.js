module.exports = {
    name: 'c',
    aliases: ['cerrar'],

    async execute({ sock, message, jid }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._*' });
        }

        const metadata = await sock.groupMetadata(jid);
        const participants = metadata.participants;

        // ¿Quien lo manda es admin?
        const sender = message?.key?.participant || message?.key?.remoteJid;
        const senderData = participants.find(p => p.id === sender);
        const isAdmin = senderData?.admin === 'admin' || senderData?.admin === 'superadmin';

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: '> *_[ 🍤 ] ERROR! Solo admins pueden usar este comando..._*' });
        }

        // ¿El bot es admin? (sin eso no puede cambiar la configuración del grupo)
        const botNumber = sock.user.id.split(':')[0].split('@')[0];
        const botData = participants.find(p => {
            const idNumber = p.id?.split('@')[0];
            const phoneNumber = p.phoneNumber?.split('@')[0];
            return idNumber === botNumber || phoneNumber === botNumber;
        });
        const botIsAdmin = botData?.admin === 'admin' || botData?.admin === 'superadmin';

        if (!botIsAdmin) {
            return sock.sendMessage(jid, { text: '> *_[ 🍤 ] Error, el bot no tiene permisos de administrador..._*' });
        }
        try {
            await sock.groupSettingUpdate(jid, 'announcement');
            console.log(`        [ 🗺️ ] Comando Cerrar ejecutado con éxito, se cerró el grupo`);
            await sock.sendMessage(jid, {
                text: `═════════════════
*🪵            GRUPO CERRADO*
> _el grupo fue cerrado, solo los admins pueden enviar mensajes_
═════════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });
        } catch (error) {
            console.error('Error al cerrar el grupo:', error);

            await sock.sendMessage(jid, { text: '> *_[ 🍤 ] Error al intentar cerrar el grupo..._*' });
        }
    }
};