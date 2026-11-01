const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'menu',
    aliases: ['Menu', 'm'],

    async execute({ sock, jid }) {
        
        console.log(`        [ 🗺️ ] Comando Menu ejecutado con éxito, se envió el menú del bot`);

        const menuPath = path.join(__dirname, '../textos/menu.txt');
        const imagePath = path.join(__dirname, '../img/menu.jpeg');

        const menu = fs.readFileSync(menuPath, 'utf8');
        const image = fs.readFileSync(imagePath);

        await sock.sendMessage(jid, {
            image: image,
            caption: menu
        });
    }
};