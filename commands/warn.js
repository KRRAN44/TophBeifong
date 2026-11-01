const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../JSON/warns.json');
const MAX_WARNS = 4;

module.exports = {
    name: 'warn',
    aliases: ['w'],
    async execute({ sock, message, jid }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text:  `> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._*`
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
                text: `> *_[ 🍤 ] ERROR! Solo los administradores pueden usar este comando..._*`
            });
        }

        const mentioned =
            message?.message?.extendedTextMessage?.contextInfo?.mentionedJid;

        if (!mentioned || mentioned.length === 0) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! Debes mencionar a un usuario para advertirlo..._*`
            });
        }

        const userToWarn = mentioned[0];

        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }

        if (!config.warns) config.warns = {};
        if (!config.warns[jid]) config.warns[jid] = {};

        const nuevo = (config.warns[jid][userToWarn] || 0) + 1;
        const llegoAlLimite = nuevo >= MAX_WARNS;

        if (llegoAlLimite) {
            delete config.warns[jid][userToWarn];
        } else {
            config.warns[jid][userToWarn] = nuevo;
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        if (!llegoAlLimite) {
            console.log(`        [ 🗺️ ] Comando Warn ejecutado con éxito, se añadió una advertencia`);
            return sock.sendMessage(jid, {
                text: `═════════════════
*🪵            WARN *
> _el usuario fue añadido a la lista de warns, el usuario va en *${nuevo}* de *${MAX_WARNS}* permitidas.._
═════════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
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
                text: `> *_[ 🍤 ] El usuario llego al limite pero el bot no tiene permisos de administrador..._*`
            });
        }

        try {
            await sock.groupParticipantsUpdate(jid, [userToWarn], 'remove');

            await sock.sendMessage(jid, {
                text: `═════════════════
*🪵            WARN *
> _el usuario fue expulsado por llegar al limite de warns..._
═════════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });
        } catch (error) {
            console.error('Error al expulsar por warns:', error);

            await sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] Usuario al limite pero el bot tuvo un error al expulsarlo..._*`
            });
        }
    }
};