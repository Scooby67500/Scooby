const Discord = require("discord.js");
const clr = require("../resources/color_codes");

module.exports = {
    name: Discord.Events.ClientReady,    // Triggers when the bot is connected
    once: true,    // Triggers only once.
    async execute(bot) {

        bot.user.setPresence({    // Sets status to 'online' (could be 'afk' or 'dnd')
            status: 'online',
        })
        bot.user.setActivity({    // Sets the activity
            name: "scoobyLand",    // Name of the game/stream/music etc
            type: Discord.ActivityType.Playing,    // Type of activity (streaming, playing, listening to, competing etc)
            //url: ""    // 'url' property only works with streaming type
        })

        const guildsNbr = bot.guilds.cache.size;  // Stores the numbers of server the bot is in
        console.log(`${clr.cya}[Ready]    ${clr.blu}${bot.user.username} is present in ${guildsNbr} servers${clr.stop}`);

        console.log(`${clr.cya}[Ready]    ${clr.blu}${bot.user.username} ${clr.grn}is online${clr.stop}`);

       
        

    },
};