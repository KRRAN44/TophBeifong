   module.exports = {
    name: 'ping',
    aliases: ['p'],

    async execute({ sock, jid, message }) {
      const inicio = Date.now()
      
      console.log(`        [ 🗺️ ] Comando Ping ejecutado con éxito, se envió la velocidad del bot al grupo`);
      await sock.sendMessage(jid, {
        
        text: '> *_[ 🔥 ] TOPH BEIFONG Conectado correctamente.._*'
      })

      const ping = Date.now() - inicio

      await sock.sendMessage(jid, {
        text: `═════════════════
*🪵            PING*
> _la velocidad del bot esta en: *${ping} ms*_
═════════════════
𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱
 `
      }, {
        quoted: message
      })
    }
  }