module.exports = {
    name: 'orgia',

    async execute({ sock, jid }) {
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! Este comando fue hecho para usarse en grupos..._*`
            });
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const botNumber = sock.user.id.split(':')[0].split('@')[0];
            const personasDisponibles = [...new Map(
                (metadata.participants || [])
                    .filter(persona => persona.id && persona.id.split('@')[0] !== botNumber)
                    .map(persona => [persona.id, persona])
            ).values()];

            if (personasDisponibles.length < 4) {
                return sock.sendMessage(jid, {
                    text: `> *_[ 🍤 ] Necesitas al menos 4 personas en el grupo para usar este comando..._*`
                });
            }

            // Mezclar la lista y tomar seis personas distintas.
            for (let i = personasDisponibles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [personasDisponibles[i], personasDisponibles[j]] =
                    [personasDisponibles[j], personasDisponibles[i]];
            }
            const cantidad = 4 + Math.floor(
                Math.random() * (Math.min(9, personasDisponibles.length) - 3)
            );
            const elegidos = personasDisponibles.slice(0, cantidad);

            const mensajes = [
                '..contrajeron sida😟',
                '..les contagiaron herpes🤯',
                '..todos se mojaron 🥵',
                '..todos eran trans🥵😳',
                '..quedaron llenos de leche 🙏🏻',
            ];

            const menciones = elegidos.map(persona => persona.id);
            const lista = menciones.map(id => `@${id.split('@')[0].split(':')[0]}`).join(' ❤️ ');
            const mensajeAleatorio = mensajes[Math.floor(Math.random() * mensajes.length)];

            await sock.sendMessage(jid, {
                text: `_*Todos ellos tuvieron una orgia ,y......*_\n${lista}\n${mensajeAleatorio}`,
                mentions: menciones
            });
            console.log(`        [ 🗺️ ] Comando Org ejecutado con éxito, se mencionaron ${cantidad} miembros del grupo`);
        } catch (error) {
            console.error('Error en org:', error);
            await sock.sendMessage(jid, {
                text: `> *_[ 🍤 ] ERROR! Ocurrió un error al intentar ejecutar el comando..._*`
            });
        }
    }
};
