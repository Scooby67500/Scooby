const Discord = require("discord.js");
const clr = require("../resources/color_codes");

module.exports = {
    name: Discord.Events.InteractionCreate,    // triggers when an interaction is made
    async execute(interaction) {

        if (!interaction.isChatInputCommand())    // Filter to only support chat commands
            return;
		if (!interaction.guild) {
			await interaction.reply({
				content: "❌ Les commandes slash ne peuvent pas être utilisées en messages privés.",
				ephemeral: true,
			});
			return;
		}

        const bot = interaction.client;
        let command = bot.commands.get(interaction.commandName); // Checks if the triggered command is in the 'commands' array

        if (!command)
            command = bot.adminCommands.get(interaction.commandName); // Checks if the triggered command is in the 'adminCommands' array

        try {
            await command.execute(interaction); // Tries to execute the command
        }
        catch (error) {    // Log an eventual error (Command not found...)
            console.error(error);
                await interaction.followUp({ content: `${clr.cya}[InteractionCreate]    ${clr.red}Error while executing ${clr.yel}${interaction.commandName}${clr.stop}`, ephemeral: true});
        }
    },
};