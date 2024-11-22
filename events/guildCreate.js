const Discord = require("discord.js");
const fs = require('fs');
const clr = require("../resources/color_codes");

module.exports = {
    name: Discord.Events.GuildCreate,    // Triggers when the bot is added to a discord server
    execute(guild) {

		console.log(`${clr.cya}[gld+]	${clr.red}${guild.client.user.username}${clr.grn} joined ${clr.blu}${guild.name}${clr.stop}`);
    },
};