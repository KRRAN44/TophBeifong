const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../JSON/adm-notificaciones.json');
const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const RESET = '\x1b[0m';

function textoDelMensaje(contenido = {}) {
    let actual = contenido;
    while (actual) {
        if (actual.conversation) return actual.conversation;
        if (actual.extendedTextMessage?.text) return actual.extendedTextMessage.text;
        if (actual.imageMessage?.caption) return actual.imageMessage.caption;
        if (actual.videoMessage?.caption) return actual.videoMessage.caption;
        if (actual.documentMessage?.caption) return actual.documentMessage.caption;

        const envoltura = actual.ephemeralMessage || actual.viewOnceMessage ||
            actual.viewOnceMessageV2 || actual.viewOnceMessageV2Extension ||
            actual.documentWithCaptionMessage || actual.editedMessage;
        if (envoltura?.message) {
            actual = envoltura.message;
            continue;
        }

        const tipo = Object.keys(actual).find(key => key.endsWith('Message'));
        return tipo ? `[Contenido del mensaje: ${tipo.replace(/Message$/, '')}]` : '';
    }
    return '';
}

function contieneMultimedia(contenido = {}) {
    let actual = contenido;
    while (actual) {
        const tipo = Object.keys(actual).find(key => key.endsWith('Message'));
        if (tipo && ![
            'conversation', 'extendedTextMessage', 'protocolMessage', 'reactionMessage',
            'senderKeyDistributionMessage', 'messageContextInfo'
        ].includes(tipo)) return true;

        const envoltura = actual.ephemeralMessage || actual.viewOnceMessage ||
            actual.viewOnceMessageV2 || actual.viewOnceMessageV2Extension ||
            actual.documentWithCaptionMessage || actual.editedMessage;
        actual = envoltura?.message;
    }
    return false;
}

function errorLog() {
    console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando NOTIFYADM${RESET}`);
}

module.exports = {
    name: 'notifyAdm',
    aliases: ['n'],

    async execute({ sock, message, jid }) {
        try {
            if (!fs.existsSync(configPath)) {
                errorLog();
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] ERROR! Todavía no hay un grupo de notificaciones configurado..._*'
                });
            }

            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (!config.grupoId?.endsWith('@g.us')) {
                errorLog();
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] ERROR! El grupo de notificaciones guardado no es válido..._*'
                });
            }

            const contextInfo = message?.message?.extendedTextMessage?.contextInfo;
            if (!contextInfo?.quotedMessage || !contextInfo?.participant) {
                errorLog();
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] ERROR! Responde al mensaje que quieres notificar con !notifyAdm..._*'
                });
            }

            const autorId = contextInfo.participant;
            const texto = textoDelMensaje(contextInfo.quotedMessage) || '[Mensaje sin texto]';
            let numero = autorId.split('@')[0].split(':')[0];
            let nombreGrupo = jid.endsWith('@g.us') ? jid : 'Chat privado';

            if (jid.endsWith('@g.us')) {
                try {
                    const metadata = await sock.groupMetadata(jid);
                    nombreGrupo = metadata.subject || jid;
                    const participante = metadata.participants.find(persona =>
                        persona.id === autorId || persona.phoneNumber === autorId
                    );
                    if (participante?.phoneNumber) {
                        numero = participante.phoneNumber.split('@')[0].split(':')[0];
                    } else if (participante?.id?.endsWith('@s.whatsapp.net')) {
                        numero = participante.id.split('@')[0].split(':')[0];
                    } else if (autorId.endsWith('@lid')) {
                        const numeroResuelto = await sock.signalRepository?.lidMapping?.getPNForLID(autorId);
                        if (numeroResuelto?.endsWith('@s.whatsapp.net')) {
                            numero = numeroResuelto.split('@')[0].split(':')[0];
                        }
                    }
                } catch (error) {
                    // El identificador sigue disponible aunque no se pueda consultar el nombre del grupo.
                }
            }

            const hora = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
            await sock.sendMessage(config.grupoId, {
                text: `═════════════
🪵            *NOTIFYADM*
> _Número del remitente:_ ${numero}
> _Mensaje del remitente:_
${texto}
> _Hora:_ ${hora}
> _Grupo:_ ${nombreGrupo}
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });

            if (contieneMultimedia(contextInfo.quotedMessage)) {
                await sock.sendMessage(config.grupoId, {
                    forward: {
                        key: {
                            remoteJid: jid,
                            id: contextInfo.stanzaId,
                            participant: autorId,
                            fromMe: false
                        },
                        message: contextInfo.quotedMessage
                    },
                    force: true
                });
            }

            await sock.sendMessage(jid, {
                text: `═════════════
🪵            *NOTIFYADM*
> _el mensaje fue enviado al grupo de notificaciones_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });
            console.log(`${VERDE}          [ 🐍 ] Comando NOTIFYADM ejecutado con éxito, se envió el mensaje al grupo de notificaciones${RESET}`);
        } catch (error) {
            errorLog();
            await sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! No se pudo enviar el mensaje al grupo de notificaciones..._*'
            });
        }
    }
};
