const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'menu1',
    aliases: ['adm', 'm1'],

    async execute({ sock, jid }) {
        
        console.log(`        [ 🗺️ ] Comando Menu ejecutado con éxito, se envió el menú para administradores del grupo`);

        const menuPath = path.join(__dirname, '../textos/menu1.txt');
        const imagePath = path.join(__dirname, '../img/menu1.jpeg');

        const menu = fs.readFileSync(menuPath, 'utf8');
        const image = fs.readFileSync(imagePath);

        await sock.sendMessage(jid, {
            image: image,
            caption: menu
        });
    }
};