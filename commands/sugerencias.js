const fs = require('fs');
const path = require('path');

const sugPath = path.join(__dirname, '../JSON/sugerencias.json');

module.exports = {
    name: 'sug',

    async execute({ sock, message, jid, args }) {
        const texto = args.trim();
        
        console.log(`        [ 🗺️ ] Comando Sugerencias ejecutado con éxito, se envió la sugerencia al archivo JSON`);
        
        if (!texto) {
            return sock.sendMessage(jid, {
                text: 'Escribe tu sugerencia. Ejemplo: !sug Agreguen un comando de memes'
            });
        }
        const esGrupo = jid.endsWith('@g.us');
        const sender = message.key.participant || message.key.remoteJid;

        let numero = sender.split('@')[0];
        let grupo = 'Chat privado';

        if (esGrupo) {
            try {
                const metadata = await sock.groupMetadata(jid);
                grupo = metadata.subject;

                // Si el grupo usa LID, aquí buscamos el número real
                const persona = metadata.participants.find(p => p.id === sender);
                if (persona?.phoneNumber) numero = persona.phoneNumber.split('@')[0];
            } catch (error) {
                console.error('Error leyendo datos del grupo en !sug:', error);
            }
        }

        const hora = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
        let sugerencias = [];

        if (fs.existsSync(sugPath)) {
            try {
                sugerencias = JSON.parse(fs.readFileSync(sugPath, 'utf8'));
            } catch (error) {
                // Si el archivo se dañó, guardamos copia para no perder lo anterior
                fs.copyFileSync(sugPath, sugPath + '.bak');
                console.error('sugerencias.json estaba dañado, copia en .bak:', error);
            }
        }

        sugerencias.push({
            numero,
            grupo,
            grupoId: jid,
            hora,
            sugerencia: texto
        });

        fs.writeFileSync(sugPath, JSON.stringify(sugerencias, null, 2), 'utf8');
        await sock.sendMessage(jid, {
            text: `═════════════
*🪵            SUGERENCIAS*
> _tu *sugerencia* fue añadida, muchas gracias por comentar tus inquietudes_
═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱        `
}, { quoted: message });
    }
};