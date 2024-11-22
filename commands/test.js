const Discord = require('discord.js');
const clr = require("../resources/color_codes");

module.exports = {
    data: new Discord.SlashCommandBuilder()
        .setName('test')    
        .setDescription('Je suis test'),

    async execute(interaction)    // Simply sends back a message
    {
        console.log(`${clr.cya}[comd]    ${clr.mag}/test ${clr.whi}was fired by ${clr.blu}${interaction.user.username}${clr.stop}`);

        interaction.reply('Je suis test.\nEn developpement par .scooby\nOui, cette commande est absolument inutile.');
    }
}