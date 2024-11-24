const Discord = require("discord.js");
const clr = require("../resources/color_codes");

module.exports = {
    name: Discord.Events.ClientReady,    // Triggers when the bot is connected
    once: true,    // Triggers only once.
    async execute(bot) {

		bot.user.setUsername("DevZone");    // Sets the bot's username
        bot.user.setPresence({    // Sets status to 'online' (could be 'afk' or 'dnd')
            status: 'online',
        })
        bot.user.setActivity({    // Sets the activity
            name: "🔥 DevZone 🔥",    // Name of the game/stream/music etc
            type: Discord.ActivityType.play,    // Type of activity (streaming, playing, listening to, competing etc)
            //url: ""    // 'url' property only works with streaming type
        })

        const guildsNbr = bot.guilds.cache.size;  // Stores the numbers of server the bot is in
		console.log(`${clr.cya}[Ready]	${clr.red}${bot.user.username}${clr.grn} is ONLINE. Present in ${guildsNbr} servers${clr.stop}`);

    },
};