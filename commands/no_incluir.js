const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../JSON/no-incluir.json');

module.exports = {
    name: 'No_incluir',
    aliases: ['no-incluir'],

    async execute({ sock, message, jid }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] Este comando solo se puede usar en grupos..._*'
            });
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const participantes = metadata.participants || [];
            const sender = message?.key?.participantAlt || message?.key?.participant || message?.key?.remoteJidAlt || message?.key?.remoteJid;
            const senderData = participantes.find(persona =>
                persona.id === sender || persona.phoneNumber === sender
            );
            const esAdmin = senderData?.admin === 'admin' || senderData?.admin === 'superadmin';

            if (!esAdmin) {
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] Solo los administradores del grupo pueden cambiar esta opción..._*'
                });
            }

            const config = fs.existsSync(configPath)
                ? JSON.parse(fs.readFileSync(configPath, 'utf8') || '{}')
                : {};
            if (!config.grupos || typeof config.grupos !== 'object' || Array.isArray(config.grupos)) {
                config.grupos = {};
            }

            const estabaExcluido = Boolean(config.grupos[jid]);
            if (estabaExcluido) {
                delete config.grupos[jid];
            } else {
                config.grupos[jid] = metadata.subject || jid;
            }

            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
            const estado = estabaExcluido ? 'incluido' : 'excluido';
            await sock.sendMessage(jid, {
                text: `═════════════
🪵            *NO INCLUIR*
> _este grupo quedó ${estado} de los anuncios masivos_
> _vuelve a ejecutar !No_incluir para cambiarlo_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });
        } catch (error) {
            console.error('Error en No_incluir:', error);
            await sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] No se pudo actualizar la lista de grupos no incluidos..._*'
            });
        }
    }
};
