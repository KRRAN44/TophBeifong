module.exports = { name: 'demote', aliases: ['quitaradmin'], async execute({ sock, message, jid }) {
// Solo funciona en grupos
if (!jid.endsWith('@g.us')) {
    return await sock.sendMessage(jid, {
        text:  `> *_[ 🍤 ] este comando fue hecho para grupos....._*`
    });
}

// Obtener información del grupo
const metadata = await sock.groupMetadata(jid);
const participants = metadata.participants;

// Persona que ejecutó el comando
const sender = message?.key?.participant || message?.key?.remoteJid;

// Buscar al ejecutor
const senderData = participants.find(
    p => p.id === sender
);

// Comprobar si es administrador
const isAdmin =
    senderData?.admin === 'admin' ||
    senderData?.admin === 'superadmin';

if (!isAdmin) {
    return await sock.sendMessage(jid, {
        text: `> *_[ 🍤 ] solo administradores pueden usar este comando..._*`
    });
}

// Comprobar que el bot sea administrador
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
        text: `> *_[ 🍤 ] el bot no es administrador..._*`
    });
}

// Obtener persona mencionada
const mentioned =
    message?.message?.extendedTextMessage?.contextInfo?.mentionedJid;

if (!mentioned || mentioned.length === 0) {
    return await sock.sendMessage(jid, {
        text: `> *_[ 🍤 ] menciona a alguien para quitar el administrador...._*`
    });
}

const userToDemote = mentioned[0];

// Comprobar que sí sea admin (si no, no hay nada que quitar)
const targetData = participants.find(
    p => p.id === userToDemote
);

if (!targetData) {
    return await sock.sendMessage(jid, {
        text: `> *_[ 🍤 ] el usuario mencionado no está en el grupo..._*`
    });
}

if (
    targetData.admin !== 'admin' &&
    targetData.admin !== 'superadmin'
) {
    return await sock.sendMessage(jid, {
        text: `> *_[ 🍤 ] el usuario mencionado no es administrador..._*`
    });
}

try {

    await sock.groupParticipantsUpdate(
        jid,
        [userToDemote],
        'demote'
    );
    console.log(`        [ 🗺️ ] Comando Demote ejecutado con éxito, se degradó a miembro`);
    await sock.sendMessage(jid, {
        text: `═════════════
*🪵            demote*
> _usuario degradado a miembro con exito_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
    });

} catch (error) {
    console.error('Error en demote:', error);

    await sock.sendMessage(jid, {
        text:  `> *_[ 🍤 ] error al degradar al usuario..._*`
    });
}
} };