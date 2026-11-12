const fs = require('fs');
const path = require('path');

const activosPath = path.join(__dirname, '../JSON/activos.json');
const estadisticasPath = path.join(__dirname, '../JSON/estadisticas.json');
const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const RESET = '\x1b[0m';

function leerJson(ruta, predeterminado) {
    if (!fs.existsSync(ruta)) return predeterminado;
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

function antiguedad(a, b) {
    const fechaA = a.joinedAt != null && Number.isFinite(Number(a.joinedAt)) ? Number(a.joinedAt) : null;
    const fechaB = b.joinedAt != null && Number.isFinite(Number(b.joinedAt)) ? Number(b.joinedAt) : null;

    if (fechaA !== null && fechaB !== null && fechaA !== fechaB) return fechaA - fechaB;
    // Para miembros anteriores al registro no existe fecha histórica; se conserva el orden de metadata.
    return a.orden - b.orden;
}

module.exports = {
    name: 'estadisticas',

    async execute({ sock, jid }) {
        if (!jid.endsWith('@g.us')) {
            console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando ESTADISTICAS${RESET}`);
            return sock.sendMessage(jid, {
                text: '> *_[ 🌻 ] ERROR! Este comando solo está permitido en grupos..._*'
            });
        }

        try {
            const [activos, registro, metadata] = await Promise.all([
                Promise.resolve(leerJson(activosPath, {})),
                Promise.resolve(leerJson(estadisticasPath, { grupos: {} })),
                sock.groupMetadata(jid)
            ]);

            const datosMensajes = activos[jid] || {};
            const mensajes = Object.values(datosMensajes)
                .reduce((total, cantidad) => total + (Number(cantidad) || 0), 0);
            const statsGrupo = registro.grupos?.[jid] || {};
            const miembrosRegistrados = statsGrupo.miembros || {};

            const miembros = (metadata.participants || [])
                .map((participante, orden) => ({
                    id: participante.id,
                    // MISMO identificador para el texto y para la mención (si no, WhatsApp no la reconoce)
                    numero: String(participante.id || '').split('@')[0].split(':')[0],
                    orden,
                    joinedAt: miembrosRegistrados[participante.id]?.joinedAt,
                    mensajes: Number(datosMensajes[participante.id]) || 0
                }))
                .filter(miembro => miembro.id);

            const porActividadDesc = [...miembros].sort((a, b) =>
                b.mensajes - a.mensajes || antiguedad(a, b)
            );
            const porActividadAsc = [...miembros].sort((a, b) =>
                a.mensajes - b.mensajes || antiguedad(a, b)
            );

            const activo = porActividadDesc[0];
            const inactivo = porActividadAsc[0];
            const mostrarMiembro = miembro => miembro
                ? `@${miembro.numero} (${miembro.mensajes} mensajes)`
                : 'Sin miembros';
            const lista = `• Personas que se han unido: *${Number(statsGrupo.uniones) || 0}*\n` +
                `• Personas que han salido: *${Number(statsGrupo.salidas) || 0}*\n` +
                `• Mensajes enviados al grupo: *${mensajes}*\n` +
                `• Miembro más activo: *${mostrarMiembro(activo)}*\n` +
                `• Miembro más inactivo: *${mostrarMiembro(inactivo)}*`;

            await sock.sendMessage(jid, {
                text: `═════════════
🪵            *ESTADISTICAS*
> _estadísticas de actividad del grupo_

═════════════

${lista}

═════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱`,
                // Set: si el más activo y el más inactivo son la misma persona, no se repite
                mentions: [...new Set([activo?.id, inactivo?.id].filter(Boolean))]
            });

            console.log(`${VERDE}          [ 🍃 ] Comando ESTADISTICAS ejecutado con éxito, se envió el resumen del grupo${RESET}`);
        } catch (error) {
            console.error(`${ROJO}          [ 🍤 ] error al ejecutar comando ESTADISTICAS${RESET}`);
            await sock.sendMessage(jid, {
                text: '> *_[ 🍤 ] ERROR! No se pudieron leer las estadísticas del grupo..._*'
            });
        }
    }
};
