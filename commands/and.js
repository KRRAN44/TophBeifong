const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../JSON/warns.json');
const MAX_WARNS = 4;

module.exports = {
    name: 'and',

    async execute({ sock, message, jid }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._' });
        }

        const metadata = await sock.groupMetadata(jid);
        const participants = metadata.participants;

        // ¿Quien lo manda es admin?
        const sender = message?.key?.participant || message?.key?.remoteJid;
        const senderData = participants.find(p => p.id === sender);
        const isAdmin = senderData?.admin === 'admin' || senderData?.admin === 'superadmin';

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: '> *_[ 🍤 ] ERROR! Este comando solo lo ejecutan administradores..._' });
        }

        // ¿El bot es admin? (sin eso no puede borrar ni expulsar)
        const botNumber = sock.user.id.split(':')[0].split('@')[0];
        const botData = participants.find(p => {
            const idNumber = p.id?.split('@')[0];
            const phoneNumber = p.phoneNumber?.split('@')[0];
            return idNumber === botNumber || phoneNumber === botNumber;
        });
        const botIsAdmin = botData?.admin === 'admin' || botData?.admin === 'superadmin';

        if (!botIsAdmin) {
            return sock.sendMessage(jid, { text: '> *_[ 🍤 ] ERROR! El bot no tiene permisos de administrador..._*' });
        }
        const contextInfo = message.message?.extendedTextMessage?.contextInfo;
        const stanzaId = contextInfo?.stanzaId;          // ID del mensaje citado
        const autorCitado = contextInfo?.participant;    // quién lo escribió

        if (!stanzaId || !autorCitado) {
            return sock.sendMessage(jid, { text: '> *_[ 🍤 ] ERROR! Debes citar el mensaje que quieres borrar..._*' });
        }
        // 1) Borrar el mensaje
        try {
            await sock.sendMessage(jid, {
                delete: { remoteJid: jid, id: stanzaId, participant: autorCitado, fromMe: false }
            });
        } catch (error) {
            console.error('Error al borrar en !and:', error);
        }

        // 2) Sumar el warn
        let config = {};
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        if (!config.warns) config.warns = {};
        if (!config.warns[jid]) config.warns[jid] = {};

        const nuevo = (config.warns[jid][autorCitado] || 0) + 1;
        const llegoAlLimite = nuevo >= MAX_WARNS;

        if (llegoAlLimite) {
            delete config.warns[jid][autorCitado];
        } else {
            config.warns[jid][autorCitado] = nuevo;
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        // 3) Avisar, o expulsar si ya llegó al límite
      if (!llegoAlLimite) {
        console.log(`        [ 🗺️ ] Comando and ejecutado con éxito, se borro y añadio un warn`);
            return sock.sendMessage(jid, {
                text: `═════════════════
*🪵            DELETE AND WARN *
> _listo, el mensaje fue eliminado y @${autorCitado.split('@')[0]} tiene ${nuevo}/${MAX_WARNS} Advertencias...._
═════════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`,
                mentions: [autorCitado]
            });
        }

        try {
            await sock.groupParticipantsUpdate(jid, [autorCitado], 'remove');
            await sock.sendMessage(jid, { text: `═════════════════
*🪵            KICK*
> _el usuario llego a 4 advertencias y fue expulsado del grupo_
═════════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱` });
        } catch (error) {
            console.error('Error al expulsar en !and:', error);
        }
    }
};