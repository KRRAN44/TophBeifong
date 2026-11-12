const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../JSON/adm-notificaciones.json');
const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const RESET = '\x1b[0m';

// Busca el código de invitación en CUALQUIER forma en que llegue el texto:
// "https://chat.whatsapp.com/CODIGO", con ?s=cl&p=i... al final, o con el nombre del comando antes
const REGEX_CODIGO = /chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/i;

function errorLog(motivo) {
    console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando SETADM${RESET}`);
    if (motivo) {
        const texto = motivo instanceof Error ? motivo.message : String(motivo);
        console.error(`${ROJO}          [ 🍤 ] motivo: ${texto}${RESET}`);
    }
}

function cargarConfig() {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Escribe en un archivo temporal y luego lo renombra: así nunca queda el JSON a medias
function guardarConfig(config) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    const temporal = configPath + '.tmp';
    fs.writeFileSync(temporal, JSON.stringify(config, null, 2), 'utf8');
    fs.renameSync(temporal, configPath);
}

// args puede llegar como texto o como arreglo: aquí se junta todo en un solo texto
function textoDeArgs(args) {
    return Array.isArray(args) ? args.join(' ') : String(args ?? '');
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
            const participantes = metadataActual.participants;

            // ¿Quien lo manda es admin? Si lo manda el propio número del bot, cuenta como el bot
            const botNumber = sock.user.id.split(':')[0].split('@')[0];
            const botData = participantes.find(p =>
                p.id?.split('@')[0] === botNumber || p.phoneNumber?.split('@')[0] === botNumber
            );
            const sender = message?.key?.participant || message?.key?.remoteJid;
            const senderData = message?.key?.fromMe
                ? botData
                : participantes.find(p => p.id === sender || p.phoneNumber === sender);
            const esAdmin = senderData?.admin === 'admin' || senderData?.admin === 'superadmin';

            if (!esAdmin) {
                errorLog();
                return sock.sendMessage(jid, {
                    text: '> *_[ 🌻 ] ERROR! Solo los administradores pueden usar este comando..._*'
                });
            }

            // 1) Sacar el código del enlace (lo que va después de chat.whatsapp.com/)
            const coincidencia = textoDeArgs(args).match(REGEX_CODIGO);
            if (!coincidencia) {
                errorLog('no encontré un enlace de chat.whatsapp.com');
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] ERROR! Adjunta un enlace de invitación válido de un grupo de WhatsApp..._*'
                });
            }
            const codigo = coincidencia[1];

            // 2) Leer el JSON ANTES de entrar a ningún grupo: si está dañado, no se mete al bot a ciegas
            let config;
            try {
                config = cargarConfig();
            } catch (error) {
                errorLog(error);
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] ERROR! El archivo JSON/adm-notificaciones.json está dañado. Arréglalo o bórralo para que se cree de nuevo..._*'
                });
            }

            // 3) ¿De qué grupo es el enlace? (todavía no entra)
            let invitacion;
            try {
                invitacion = await sock.groupGetInviteInfo(codigo);
            } catch (error) {
                errorLog(error);
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] ERROR! No pude leer ese enlace, puede que ya no sirva o que lo hayan restablecido..._*'
                });
            }

            const groupJid = invitacion?.id;
            if (!groupJid?.endsWith('@g.us')) {
                errorLog('el enlace no regresó un grupo válido');
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] ERROR! El enlace no corresponde a un grupo de WhatsApp..._*'
                });
            }

            // 4) ¿El bot ya está en ese grupo? Si no, entra con el enlace
            const gruposActivos = await sock.groupFetchAllParticipating();
            const yaEsMiembro = Boolean(gruposActivos[groupJid]);
            let idGuardado = groupJid;

            if (!yaEsMiembro) {
                try {
                    idGuardado = await sock.groupAcceptInvite(codigo);
                } catch (error) {
                    errorLog(error);
                    return sock.sendMessage(jid, {
                        text: '> *_[ 🍤 ] ERROR! No pude entrar al grupo con ese enlace. Puede que pidan aprobación para entrar o que el enlace ya no sirva..._*'
                    });
                }

                if (!idGuardado) {
                    errorLog('WhatsApp no regresó el grupo al entrar');
                    return sock.sendMessage(jid, {
                        text: '> *_[ 🍤 ] ERROR! No pude entrar al grupo con ese enlace. Puede que pidan aprobación para entrar o que el enlace ya no sirva..._*'
                    });
                }
            }

            // 5) Guardar el grupo de notificaciones (sin borrar otras llaves que ya tenga el JSON)
            const metadataGrupo = yaEsMiembro ? gruposActivos[groupJid] : invitacion;
            config.grupoId = idGuardado;
            config.grupo = metadataGrupo.subject || invitacion.subject || idGuardado;
            guardarConfig(config);

            // 6) Confirmar en el grupo donde se escribió el comando
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
            errorLog(error);
            await sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! No se pudo validar, guardar o entrar al grupo del enlace..._*'
            });
        }
    }
};
