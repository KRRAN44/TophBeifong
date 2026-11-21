// Obtiene el usuario objetivo de una mención o de una respuesta a su mensaje.
function getTargetUser(message, participants = []) {
    const contextInfo = message?.message?.extendedTextMessage?.contextInfo;
    const mentioned = contextInfo?.mentionedJid?.[0];
    const repliedTo = contextInfo?.quotedMessage && contextInfo?.participant
        ? contextInfo.participant
        : null;
    const target = mentioned || repliedTo;

    if (!target) return null;

    // Las acciones de grupo necesitan el id, que puede diferir de phoneNumber con LID.
    const participant = participants.find(person =>
        person.id === target || person.phoneNumber === target
    );
    return participant?.id || target;
}

module.exports = { getTargetUser };
