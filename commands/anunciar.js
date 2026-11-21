const NUMEROS_AUTORIZADOS = new Set(['527531448430', '4915124477722']);
const fs = require('fs');
const path = require('path');
const gruposNoIncluidosPath = path.join(__dirname, '../JSON/no-incluir.json');

function cargarGruposNoIncluidos() {
    if (!fs.existsSync(gruposNoIncluidosPath)) return {};
    const config = JSON.parse(fs.readFileSync(gruposNoIncluidosPath, 'utf8') || '{}');
    return config.grupos && typeof config.grupos === 'object' ? config.grupos : {};
}

function soloDigitos(jid) {
    return String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

function textoDelMensaje(contenido = {}) {
    let actual = contenido;
    while (actual) {
        if (actual.conversation) return actual.conversation;
        if (actual.extendedTextMessage?.text) return actual.extendedTextMessage.text;
        if (actual.imageMessage?.caption) return actual.imageMessage.caption;
        if (actual.videoMessage?.caption) return actual.videoMessage.caption;
        if (actual.documentMessage?.caption) return actual.documentMessage.caption;
        if (actual.audioMessage?.caption) return actual.audioMessage.caption;

        const envoltura = actual.ephemeralMessage || actual.viewOnceMessage ||
            actual.viewOnceMessageV2 || actual.viewOnceMessageV2Extension ||
            actual.documentWithCaptionMessage || actual.editedMessage;
        if (!envoltura?.message) return '';
        actual = envoltura.message;
    }
    return '';
}

function contieneMedia(contenido = {}) {
    let actual = contenido;
    while (actual) {
        if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].some(tipo => actual[tipo])) {
            return true;
        }
        const envoltura = actual.ephemeralMessage || actual.viewOnceMessage ||
            actual.viewOnceMessageV2 || actual.viewOnceMessageV2Extension ||
            actual.documentWithCaptionMessage || actual.editedMessage;
        actual = envoltura?.message;
    }
    return false;
}

async function obtenerNumeroRemitente(sock, message, jid) {
    const key = message?.key || {};
    const candidatos = key.fromMe
        ? [sock.user?.id, sock.user?.lid]
        : [key.participantAlt, key.remoteJidAlt, key.participant, key.remoteJid];

    // En Baileys v7 participantAlt/remoteJidAlt suelen traer el número PN
    // cuando el identificador principal es un LID.
    for (const candidato of candidatos) {
        if (typeof candidato !== 'string') continue;
        if (candidato.endsWith('@s.whatsapp.net')) return soloDigitos(candidato);
    }

    for (const candidato of candidatos) {
        if (typeof candidato !== 'string' || !candidato.endsWith('@lid')) continue;
        try {
            const numero = await sock.signalRepository?.lidMapping?.getPNForLID(candidato);
            if (numero) return soloDigitos(numero);
        } catch (error) {
            console.error('No se pudo resolver el número del remitente LID:', error);
        }
    }

    if (jid.endsWith('@g.us') && candidatos.some(candidato => typeof candidato === 'string')) {
        try {
            const metadata = await sock.groupMetadata(jid);
            const participante = metadata.participants?.find(persona =>
                candidatos.includes(persona.id) || candidatos.includes(persona.phoneNumber)
            );
            if (participante?.phoneNumber) return soloDigitos(participante.phoneNumber);
            if (participante?.id?.endsWith('@s.whatsapp.net')) return soloDigitos(participante.id);
        } catch (error) {
            console.error('No se pudo consultar el número del remitente en el grupo:', error);
        }
    }

    return '';
}

module.exports = {
    name: 'anunciar',

    async execute({ sock, message, jid, args }) {
        try {
            const numeroRemitente = await obtenerNumeroRemitente(sock, message, jid);
            if (!NUMEROS_AUTORIZADOS.has(numeroRemitente)) {
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] No tienes permiso para ejecutar este comando..._*'
                });
            }

            const contextInfo = message?.message?.extendedTextMessage?.contextInfo;
            const mensajeCitado = contextInfo?.quotedMessage;
            const mediaCitado = mensajeCitado && contieneMedia(mensajeCitado);
            let mensaje = String(args || '').trim();
            if (!mensaje && mensajeCitado) mensaje = textoDelMensaje(mensajeCitado).trim();
            if (!mensaje && mediaCitado) mensaje = '[Contenido multimedia]';
            if (!mensaje) {
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] Escribe el mensaje o responde al mensaje que quieres anunciar..._*'
                });
            }

            const grupos = await sock.groupFetchAllParticipating();
            const idsGrupos = Object.keys(grupos || {}).filter(id => id.endsWith('@g.us'));
            const noIncluidosConfig = cargarGruposNoIncluidos();
            const idsNoIncluidos = idsGrupos.filter(id => noIncluidosConfig[id]);
            const nombresNoIncluidos = idsNoIncluidos.map(id =>
                grupos[id]?.subject || noIncluidosConfig[id] || id
            );
            const gruposEnviados = [];
            const gruposFallidos = [];

            for (const grupoId of idsGrupos) {
                if (noIncluidosConfig[grupoId]) continue;

                try {
                    const metadata = await sock.groupMetadata(grupoId);
                    const menciones = [...new Set(
                        (metadata.participants || []).map(persona => persona.id).filter(Boolean)
                    )];
                    const texto = `_*[🫟] @KRRAN @TophBot*_\n> *${mensaje}*`;

                    await sock.sendMessage(grupoId, { text: texto, mentions: menciones });

                    if (mediaCitado) {
                        await sock.sendMessage(grupoId, {
                            forward: {
                                key: {
                                    remoteJid: jid,
                                    id: contextInfo.stanzaId,
                                    participant: contextInfo.participant || message?.key?.participant,
                                    fromMe: false
                                },
                                message: mensajeCitado
                            },
                            force: true
                        });
                    }

                    gruposEnviados.push(metadata.subject || grupos[grupoId]?.subject || grupoId);
                } catch (error) {
                    console.error(`No se pudo anunciar en ${grupoId}:`, error);
                    gruposFallidos.push(grupos[grupoId]?.subject || grupoId);
                }
            }

            const lista = (titulo, nombres) => nombres.length
                ? `\n${titulo} (${nombres.length}):\n${nombres.map(nombre => `• ${nombre}`).join('\n')}`
                : `\n${titulo} (0)`;
            await sock.sendMessage(jid, {
                text: `Anuncio completado.${lista('Enviados', gruposEnviados)}${lista('No incluidos', nombresNoIncluidos)}${lista('Fallidos', gruposFallidos)}`
            });
        } catch (error) {
            console.error('Error en anunciar:', error);
            await sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] No se pudo completar el anuncio..._*'
            });
        }
    }
};
