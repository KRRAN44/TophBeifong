const fs = require('fs');
const path = require('path');

module.exports = {
    name: '#contador',
    aliases: ['reiniciarcontador', 'resetearcontador'],

    async execute({ sock, message, jid }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._*'
            });
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const sender = message?.key?.participant || message?.key?.remoteJid;
            const senderData = metadata.participants.find(p => p.id === sender);
            const isAdmin = senderData?.admin === 'admin' || senderData?.admin === 'superadmin';

            if (!isAdmin) {
                return sock.sendMessage(jid, {
                    text: '> *_[ 🍤 ] ERROR! Solo los administradores pueden reiniciar el contador..._*'
                });
            }

            const activosPath = path.join(__dirname, '../JSON/activos.json');
            let activos = {};

            if (fs.existsSync(activosPath)) {
                activos = JSON.parse(fs.readFileSync(activosPath, 'utf8'));
            }

            // Reinicia solo el grupo donde se ejecuta el comando.
            activos[jid] = {};
            fs.writeFileSync(activosPath, JSON.stringify(activos, null, 2), 'utf8');
            console.log(`        [ 🗺️ ] Comando Reset Contador ejecutado con éxito, se reinició el contador`);
            return sock.sendMessage(jid, {
                text:  `═════════════════
*🪵            NUEVO CONTADOR*
> _el contador fue reiniciado, todos los miembros empiezan desde 0_
═════════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`
            });
        } catch (error) {
            console.error('Error al reiniciar el contador:', error);
            return sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! Ocurrió un error al intentar reiniciar el contador..._*'
            });
        }
    }
};
