const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'menu2',
    aliases: ['Menu2', 'm'],

    async execute({ sock, jid }) {
        
        console.log(`        [ 🗺️ ] Comando Menu ejecutado con éxito, se envió el menu para miembros del grupo`);

        const menuPath = path.join(__dirname, '../textos/menu2.txt');
        const imagePath = path.join(__dirname, '../img/menu2.jpeg');

        const menu = fs.readFileSync(menuPath, 'utf8');
        const image = fs.readFileSync(imagePath);

        await sock.sendMessage(jid, {
            image: image,
            caption: menu
        });
    }
};