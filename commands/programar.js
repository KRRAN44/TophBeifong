const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../JSON/msg-programados.json');
const INTERVALO = 60 * 60 * 1000;
const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const RESET = '\x1b[0m';

function cargarConfig() {
    if (!fs.existsSync(configPath)) return { grupos: {} };

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!config.grupos || typeof config.grupos !== 'object' || Array.isArray(config.grupos)) {
        config.grupos = {};
    }
    return config;
}

function guardarConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

function registrarError() {
    console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando PROGRAMAR${RESET}`);
}

module.exports = {
    name: 'programar',

    async execute({ sock, jid, args }) {
        if (!jid.endsWith('@g.us')) {
            registrarError();
            return sock.sendMessage(jid, {
                text: '> *_[ 🌻 ] ERROR! Este comando solo está permitido en grupos..._*'
            });
        }

        const texto = args.trim();
        if (!texto) {
            registrarError();
            return sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! Escribe el texto que quieres programar. Ejemplo: !programar texto..._*'
            });
        }

        try {
            const config = cargarConfig();
            config.grupos[jid] = {
                text: texto,
                enabled: true,
                nextSendAt: Date.now() + INTERVALO
            };
            guardarConfig(config);

            await sock.sendMessage(jid, {
                text: `═════════════
🪵            *PROGRAMAR*
> _el mensaje quedó guardado y se enviará cada hora_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });
            console.log(`${VERDE}          [ 🍀 ] Comando PROGRAMAR ejecutado con éxito, se guardó el mensaje para enviarlo cada hora${RESET}`);
        } catch (error) {
            registrarError();
            return sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! No se pudo guardar el mensaje programado..._*'
            });
        }
    },

    async toggle({ sock, jid }) {
        if (!jid.endsWith('@g.us')) {
            registrarError();
            return sock.sendMessage(jid, {
                text: '> *_[ 🌻 ] ERROR! Este comando solo está permitido en grupos..._*'
            });
        }

        try {
            const config = cargarConfig();
            const programacion = config.grupos[jid];
            if (!programacion?.text) {
                registrarError();
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] ERROR! Este grupo todavía no tiene un mensaje programado..._*'
                });
            }

            programacion.enabled = !programacion.enabled;
            programacion.nextSendAt = programacion.enabled ? Date.now() + INTERVALO : null;
            guardarConfig(config);

            const estado = programacion.enabled ? 'activado' : 'desactivado';
            await sock.sendMessage(jid, {
                text: `═════════════
🪵            *PROGRAMAR*
> _el envío periódico quedó *${estado}*_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });
            console.log(`${VERDE}          [ 🐍 ] Comando PROGRAMAR ejecutado con éxito, se ${estado} el envío periódico del grupo${RESET}`);
        } catch (error) {
            registrarError();
            return sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! No se pudo cambiar el estado del mensaje programado..._*'
            });
        }
    },

    async enviarPendientes(sock) {
        let config;
        try {
            config = cargarConfig();
        } catch (error) {
            console.error('Error al leer JSON/msg-programados.json:', error);
            return;
        }

        let cambio = false;
        for (const [jid, programacion] of Object.entries(config.grupos)) {
            if (!programacion?.enabled || !programacion.text || Number(programacion.nextSendAt) > Date.now()) continue;

            try {
                await sock.sendMessage(jid, { text: programacion.text });
                programacion.nextSendAt = Date.now() + INTERVALO;
                cambio = true;
            } catch (error) {
                console.error(`Error al enviar mensaje programado a ${jid}:`, error);
            }
        }

        if (cambio) {
            try {
                guardarConfig(config);
            } catch (error) {
                console.error('Error al guardar la siguiente hora de envío:', error);
            }
        }
    }
};
