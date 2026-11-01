const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../JSON/warns.json');

module.exports = {
    name: 'unwarn',

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
                text: `> *_[ 🍤 ] ERROR! Debes mencionar a un usuario para quitarle una advertencia..._*`
            });
        }

        const userToUnwarn = mentioned[0];

        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }

        const actual = config?.warns?.[jid]?.[userToUnwarn] || 0;

        if (actual <= 0) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! El usuario no tiene advertencias para quitar..._*`
            });
        }

        const nuevo = actual - 1;

        if (nuevo === 0) {
            delete config.warns[jid][userToUnwarn];
        } else {
            config.warns[jid][userToUnwarn] = nuevo;
        }

        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        console.log(`        [ 🗺️ ] Comando Unwarn ejecutado con éxito, se removio una advertencia`);
        await sock.sendMessage(jid, {
            text: `═════════════════
*🪵            UNWARN*
> _la advertencia se removio... tiene *${nuevo}* de *4* permitidos.._
═════════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`

        });
    }
};