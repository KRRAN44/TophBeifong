module.exports = {
    name: 'ship',
    aliases: ['♥'],

    async execute({ sock, message, jid }) {
        // Solo funciona en grupos
        if (!jid.endsWith('@g.us')) {
            return await sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._*`
            });
        }

        // Obtener metadata del grupo
        const metadata = await sock.groupMetadata(jid);
        const participants = metadata.participants;

        // Filtrar al bot de la lista
        const botNumber = sock.user.id.split(':')[0].split('@')[0];
        const personasDisponibles = participants.filter(p => {
            const idNumber = p.id?.split('@')[0];
            return idNumber !== botNumber;
        });

        // Verificar que hay al menos 2 personas
        if (personasDisponibles.length < 2) {
            return await sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] Necesitas al menos 2 personas en el grupo para usar este comando..._*`
            });
        }

        // Función para elegir al azar
        const elegirAleatorio = (array) => array[Math.floor(Math.random() * array.length)];

        // Elegir dos personas diferentes
        let persona1 = elegirAleatorio(personasDisponibles);
        let persona2 = elegirAleatorio(personasDisponibles);

        while (persona2.id === persona1.id) {
            persona2 = elegirAleatorio(personasDisponibles);
        }

        // Array de mensajes románticos
        const mensajes = [
            "son novios, pero uno es infiel 😏",
            "deberian tener sexo salvaje 🔥",
            "Love is in the air ✨💫",
            "parecen una pareja de series de frutas hechas con IA 😍",
            "no se aman, se odian, deberian hacer pvp 😈",
        ];

        // Elegir un mensaje al azar
        const mensajeAleatorio = mensajes[Math.floor(Math.random() * mensajes.length)];

        // Extraer solo los números de los IDs para mostrar en el texto
        const numero1 = persona1.id.split('@')[0];
        const numero2 = persona2.id.split('@')[0];

        const mensajeFinal = `@${numero1} ❤️ @${numero2}\n${mensajeAleatorio}`;

        try { 
            console.log(`        [ 🗺️ ] Comando Ship ejecutado con éxito, se envió el mensaje al grupo`);
            await sock.sendMessage(jid, {
                text: mensajeFinal,
                mentions: [persona1.id, persona2.id]
            });
        } catch (error) {
            console.error('Error en ship:', error);
            
            await sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! Ocurrió un error al intentar ejecutar el comando..._*`
            });
        }
    }
};
