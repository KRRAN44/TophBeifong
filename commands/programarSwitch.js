const programar = require('./programar');

module.exports = {
    name: '#programar',
    aliases: ['#Programar'],

    async execute({ sock, jid }) {
        return programar.toggle({ sock, jid });
    }
};
