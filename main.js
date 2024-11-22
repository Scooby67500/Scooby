const Discord = require("discord.js");
const config = require("./config");
const fs = require('node:fs');
const clr = require("./resources/color_codes.js");

/* crée le bot et lui donne les permission */
const intents = new Discord.IntentsBitField(3276799);
const bot = new Discord.Client({
    intents: intents,
});

/* passe le token */
const rest = new Discord.REST({ version: '10' }).setToken(config.token);

/* Loading/Updating commands */
bot.commands = new Discord.Collection();// Creates a discord.collection and an array inside the bot
bot.commandArray = [];
const regularCommandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js")) // Reads the ./commands directory, and retrieve all files ending with .js
if (regularCommandFiles.length > 0) {
    regularCommandFiles.forEach(file => {// For each file, require it, push it in the collection and in the array.
        const command = require(`./commands/${file}`);
        bot.commands.set(command.data.name, command);
        bot.commandArray.push(command.data.toJSON());
        console.log(`${clr.cya}[Main]${clr.yel}${file.slice(0, file.length - 3)} ${clr.whi}OK${clr.stop}`);
    });
    (async () => {// Once all commands are loaded in the bot, give the commandArray and the bot's Id to the discord REST API, to update them
        try {
            const data = await rest.put(
                Discord.Routes.applicationCommands(config.clientId),// applicationCommands means the commands are stored for the bot, and so, accessible in any discord server where the bot is in.
                { body: bot.commandArray },
            );
            console.log(`${clr.cya}[Main]${clr.blu}Successfully updated ${data.length} application commands${clr.stop}`);
        } catch (error) {
            console.error(error);
        }
    })();
}


/*Loads every event handling files */
fs.readdirSync("./events").filter(files => files.endsWith(".js")).forEach(file => {// Reads the ./events directory, and retrieve all files ending with .js
    const event = require(`./events/${file}`);// require the files, and setup the listeners on each events.
    if (event.one)
        bot.once(event.name, (...args) => event.execute(...args));// bot.once : Listener for events marked as 'one time event', executes only once (like Discord.Event.ClientReady)
    else
        bot.on(event.name, (...args) => event.execute(...args));// bot.on : Listener for any other events, executing when triggered.
}
);

/* Uncomment to delete ALL application commands*/
// rest.put(Discord.Routes.applicationCommands(config.clientId),
// { body: [] },
// );
// console.log(`${clr.red}[Admin]${clr.red}Deleted all application commands.${clr.stop}`);


/* Uncomment to delete ALL admin commands*/
// rest.put(Discord.Routes.applicationGuildCommands(config.clientId, config.adminGuildId),
// { body: [] },
// );
// console.log(`${clr.red}[Admin]${clr.red}Deleted all admin commands.${clr.stop}`);

bot.login(config.token); // Connects the bot. Triggers the Discord.Event.ClientReady event