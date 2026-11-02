module.exports = { name: 'kick', aliases: ['a-chingar-a-su-madre', 'andate-al-pingo'],
async execute({ sock, message, jid }) {

    // Solo funciona en grupos
    if (!jid.endsWith('@g.us')) {
        return await sock.sendMessage(jid, {
            text: `> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._*`
        
        });
    }

    // Obtener metadata del grupo
    const metadata = await sock.groupMetadata(jid);
    const participants = metadata.participants;

    // Obtener quién ejecutó el comando
    const sender = message.key.participant || message.key.remoteJid;

    // Buscar al usuario que ejecutó el comando
    const senderData = participants.find(
        p => p.id === sender
    );

    // Comprobar si es admin
    const isAdmin =
        senderData?.admin === 'admin' ||
        senderData?.admin === 'superadmin';

    if (!isAdmin) {
        return await sock.sendMessage(jid, {
            text:  `> *_[ 🍤 ] ERROR! Solo los administradores pueden usar este comando..._*`
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
        return await sock.sendMessage(jid, {
            text: `> *_[ 🍤 ] El bot no es administrador..._*`
        });
    }

    // Obtener mencionados
    const mentioned =
        message?.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (!mentioned || mentioned.length === 0) {
        return await sock.sendMessage(jid, {
            text: `> *_[ 🍤 ] ERROR! Debes mencionar a un usuario para expulsarlo..._*`
        });
    }

    const userToKick = mentioned[0];

    // Evitar expulsar a otro administrador
    const targetData = participants.find(
        p => p.id === userToKick
    );

    if (
        targetData?.admin === 'admin' ||
        targetData?.admin === 'superadmin'
    ) {
        return await sock.sendMessage(jid, {
            text: `> *_[ 🍤 ] ERROR! No puedes expulsar a otro administrador..._*`
        });
    }

    try {
        await sock.groupParticipantsUpdate(
            jid,
            [userToKick],
            'remove'
        );

        await sock.sendMessage(jid, {
            text: `═════════════════
*🪵            KICK*
> _usuario expulsado con exito_
═════════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`

        });

    } catch (error) {
        console.error('Error en kick:', error);

        await sock.sendMessage(jid, {
            text: `> *_[ 🍤 ] error al expulsar..._*`

        });
    }
}
};