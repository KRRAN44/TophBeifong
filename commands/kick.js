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
            text: `> *_[ 🍤 ] ERROR! Solo los administradores pueden usar este comando..._*`
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

    // Usuarios mencionados (puede haber 1 o varios con !kick @user1 @user2 ...)
    const mentioned =
        message?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    // Si no hay mención, revisamos si se citó (respondió) un mensaje
    const citado =
        message?.message?.extendedTextMessage?.contextInfo?.participant;

    // Prioridad: si mencionaron a alguien, se usan las menciones.
    // Si no, se usa el autor del mensaje citado.
    let usersToKick = mentioned.length > 0
        ? mentioned
        : (citado ? [citado] : []);

    usersToKick = [...new Set(usersToKick)]; // por si citan y mencionan a la misma persona

    if (usersToKick.length === 0) {
        return await sock.sendMessage(jid, {
            text: `> *_[ 🍤 ] ERROR! Menciona a alguien o responde su mensaje con !kick..._*`
        });
    }

    // Separar quién sí se puede expulsar y quién no (admins protegidos)
    const protegidos = [];
    const expulsables = [];

    for (const userId of usersToKick) {
        const targetData = participants.find(p => p.id === userId);
        const esAdmin =
            targetData?.admin === 'admin' ||
            targetData?.admin === 'superadmin';

        if (esAdmin) {
            protegidos.push(userId);
        } else {
            expulsables.push(userId);
        }
    }

    if (expulsables.length === 0) {
        return await sock.sendMessage(jid, {
            text: `> *_[ 🍤 ] ERROR! No puedes expulsar a otro administrador..._*`
        });
    }

    try {
        await sock.groupParticipantsUpdate(
            jid,
            expulsables,
            'remove'
        );

        const lista = expulsables
            .map(id => `• @${id.split('@')[0]}`)
            .join('\n');

        const avisoAdmins = protegidos.length > 0
            ? `\n⚠️ No se expulsó a ${protegidos.length} administrador(es).`
            : '';

        await sock.sendMessage(jid, {
            text: `═════════════════
*🪵            KICK*
${lista}
> _usuario(s) expulsado(s) con exito_${avisoAdmins}
═════════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`,
            mentions: expulsables
        });

    } catch (error) {
        console.error('Error en kick:', error);

        await sock.sendMessage(jid, {
            text: `> *_[ 🍤 ] error al expulsar..._*`
        });
    }
}
};
