const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../JSON/adm-notificaciones.json');
const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const RESET = '\x1b[0m';

function errorLog() {
    console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando SETADM${RESET}`);
}

function cargarConfig() {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

module.exports = {
    name: 'SetAdm',

    async execute({ sock, message, jid, args }) {
        if (!jid.endsWith('@g.us')) {
            errorLog();
            return sock.sendMessage(jid, {
                text: '> *_[ 🌻 ] ERROR! Este comando solo está permitido para admins en grupos..._*'
            });
        }

        try {
            const metadataActual = await sock.groupMetadata(jid);
            const sender = message?.key?.participant || message?.key?.remoteJid;
            const senderData = metadataActual.participants.find(participant =>
                participant.id === sender || participant.phoneNumber === sender
            );
            const esAdmin = senderData?.admin === 'admin' || senderData?.admin === 'superadmin';

            if (!esAdmin) {
                errorLog();
                return sock.sendMessage(jid, {
                    text: '> *_[ 🌻 ] ERROR! Solo los administradores pueden usar este comando..._*'
                });
            }

            let url;
            try {
                url = new URL(args.trim());
            } catch {
                throw new Error('Enlace inválido');
            }

            const partes = url.pathname.split('/').filter(Boolean);
            if (
                url.protocol !== 'https:' ||
                url.hostname !== 'chat.whatsapp.com' ||
                url.port || url.username || url.password || url.search || url.hash ||
                partes.length !== 1
            ) {
                errorLog();
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] ERROR! Adjunta un enlace de invitación válido de un grupo de WhatsApp..._*'
                });
            }

            const invitacion = await sock.groupGetInviteInfo(partes[0]);
            const groupJid = invitacion?.id;
            if (!groupJid?.endsWith('@g.us')) {
                errorLog();
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] ERROR! El enlace no corresponde a un grupo de WhatsApp..._*'
                });
            }

            const gruposActivos = await sock.groupFetchAllParticipating();
            const yaEsMiembro = Boolean(gruposActivos[groupJid]);
            const idGuardado = yaEsMiembro ? groupJid : await sock.groupAcceptInvite(partes[0]);
            if (!idGuardado) throw new Error('No fue posible entrar al grupo');

            const grupoMetadata = yaEsMiembro ? gruposActivos[groupJid] : invitacion;
            const config = cargarConfig();
            config.grupoId = idGuardado;
            config.grupo = grupoMetadata.subject || invitacion.subject || idGuardado;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

            const descripcion = yaEsMiembro
                ? `se guardó ${config.grupo} como grupo de notificaciones`
                : `el bot entró y guardó ${config.grupo} como grupo de notificaciones`;
            await sock.sendMessage(jid, {
                text: `═════════════
🪵            *SETADM*
> _${descripcion}_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });
            console.log(`${VERDE}          [ 🍀 ] Comando SETADM ejecutado con éxito, se guardó el grupo de notificaciones${RESET}`);
        } catch (error) {
            errorLog();
            await sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! No se pudo validar, guardar o entrar al grupo del enlace..._*'
            });
        }
    }
};
