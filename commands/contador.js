const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'contador',
    aliases: ['activos', 'stats', 'count'],

    async execute({ sock, message, jid }) {
        // Solo funciona en grupos
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._*`
            });
        }

        try {
            // Cargar el archivo de activos
            const activosPath = path.join(__dirname, '../JSON/activos.json');
            let activos = {};
            
            if (fs.existsSync(activosPath)) {
                activos = JSON.parse(fs.readFileSync(activosPath, 'utf8'));
            }

            // Combinar los mensajes registrados con todos los miembros actuales.
            // Quienes todavía no tienen mensajes en activos.json empiezan en 0.
            const metadata = await sock.groupMetadata(jid);
            const datosGrupo = activos[jid] || {};
            const usuarios = (metadata.participants || [])
                .map(participante => participante.id)
                .filter(Boolean)
                .map(usuario => [usuario, Number(datosGrupo[usuario]) || 0])
                .sort((a, b) => b[1] - a[1]);

            if (usuarios.length === 0) {
                return await sock.sendMessage(jid, {
                    text: `> *_[ 🍤 ] no hay miembros en este grupo...._*`
                });
            }

            const LIMITE = 30;
            let mensaje = `═════════════════
*🪵            CONTADOR DE MENSAJES*
> _Cantidad minima de mensajes:_ *${LIMITE}*\n> _Cantidad de miembros:_ *${usuarios.length}*\n═════════════════ 

`;
            
            console.log(`        [ 🗺️ ] Comando Contador ejecutado con éxito, se envió el conteo al grupo`);

            const mentions = [];
            
            for (const [usuario, cantidad] of usuarios) {
                const advertencia = cantidad < LIMITE ? ' ⚠️' : '';
                mensaje += `@${usuario.split('@')[0]} • ${cantidad}${advertencia}\n`;
                mentions.push(usuario);
            }

            mensaje += `\n𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`;

            await sock.sendMessage(jid, {
                text: mensaje,
                mentions: mentions
            });

        } catch (error) {
            console.error('Error en contador:', error);
            
            await sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] error al intentar eliminar.._*`
            });
        }
    }
};
