const Discord = require('discord.js');
const config = require("../config");
const clr = require('../resources/color_codes')
const schedule = require('node-schedule');
const dbClient = require('../database')

module.exports = {
	data: new Discord.SlashCommandBuilder()
		.setName('vip')
		.setDescription('Gestion des VIP')
		.addUserOption(option =>
			option.setName('utilisateur')
				.setDescription('Cible de la commande')
				.setRequired(true)
		)
		.addStringOption(option =>
			option.setName('action')
				.setDescription('Action à effectuer')
				.setRequired(true)
				.addChoices(
					{ name: 'add', value: 'add' },
					{ name: 'remove', value: 'remove' },
					{ name: 'check', value: 'check' },
				)
		)
		.addIntegerOption(option =>
			option.setName('duree')
				.setDescription('Durée en jours, pour add/remove')
				.setRequired(false)
		),

	async execute(interaction) {
		const user = interaction.options.getUser('utilisateur');
		const action = interaction.options.getString('action');
		const duration = interaction.options.getInteger('duree');
		const member = interaction.guild.members.cache.get(user.id);
		const role = interaction.guild.roles.cache.get("1304450331727495251");
		const logChannel = interaction.guild.channels.cache.get("1304445062293229597");
		const currentTime = Date.now();

		// role or logchannel does not exist
		if (!role || !logChannel) {
			console.log(`${clr.red}[VIP]	Erreur dans la recuperation du role VIP ou du channel LOGS.${clr.stop}`);
			return interaction.reply({ content: "Impossible de recuperer le role VIP, ou le channel LOGS.", ephemeral: true });
		}
		// if duration is not specified for add/remove
		if (!duration && (action == 'add' || action == 'remove')) {
			logChannel.send(`L'utilisateur ${interaction.user.username} a tenté d'ajouter ou de retirer le statut VIP à ${user.username} sans spécifier de durée.`);
			console.log(`${clr.cya}[VIP]	${clr.blu}${interaction.user.username} ${clr.whi}a tenté d'ajouter ou de retirer le statut VIP à ${clr.blu}${user.username} ${clr.stop}sans spécifier de durée.`);
			return interaction.reply({ content: "Veuillez spécifier une durée (en jours) pour les actions add/remove.", ephemeral: true });
		}
		// if user is not an admin and is trying to add/remove VIP status
		if ((action === 'add' || action === 'remove') && !config.adminIds.includes(interaction.user.id)) {
			logChannel.send(`L'utilisateur ${interaction.user.username} a tenté d'ajouter ou de retirer le statut VIP à ${user.username} sans permission.`);
			console.log(`${clr.cya}[VIP]	${clr.mag}${interaction.user.username} ${clr.whi}a tenté d'ajouter ou de retirer le statut VIP à ${user.username} sans permission.${clr.stop}`);
			return interaction.reply({ content: "Vous n'avez pas la permission d'ajouter ou de retirer le statut VIP.", ephemeral: true });
		}

		const timeSetting = 60 * 60 * 24 * 1000; // days in milliseconds
		//  60 * 60 * 1000          hours in milliseconds
		//  60 * 1000               minutes in milliseconds

		// Get expiration time of user in the vip_users TABLE, or currentTime if user is not in the table
		let expirationTime;
		try {
			await dbClient.query(`SELECT * FROM vip_users WHERE user_id = $1`, [user.id])
				.then(res => {
					if (res.rows[0]) {
						expirationTime = res.rows[0].expiration_time;
						expirationTime = Number(expirationTime);
					}
					else {
						expirationTime = currentTime;
					}
				});
		} catch (err) {
			console.log(`${clr.red}[VIP]	Error while fetching VIP data from the database:${clr.stop} ${err}`);
			// send message to log channel
			logChannel.send(`Une erreur s'est produite lors de la récupération des données VIP pour ${user.username}.`);
			return interaction.reply({ content: "Une erreur s'est produite lors de la récupération des données VIP.", ephemeral: true });
		}


		if (action === 'add') {
			expirationTime = expirationTime + (duration * timeSetting);

			// Add the user to the vip_users TABLE
			try {
				await dbClient.query(
					`INSERT INTO vip_users (user_id, expiration_time, notified) VALUES ($1, $2, FALSE) ON CONFLICT (user_id) DO UPDATE SET expiration_time = $2, notified = FALSE`,
					[user.id, expirationTime]
				);
				if (!member.roles.cache.has(role.id)) {
					await user.send(`Vous êtes désormais VIP DEVZONE pour une durée de ${duration} jours.`);
					await member.roles.add(role);
					logChannel.send(`L'utilisateur ${user.username} a été ajouté à la liste des VIP pour une durée de ${duration} jours. (par ${interaction.user.username})`);
					console.log(`${clr.cya}[VIP]	${clr.blu}${user.username} ${clr.whi}a été ajouté à la liste des VIP pour une durée de ${duration} jours. (par ${clr.blu}${interaction.user.username}${clr.stop})`);
					interaction.reply({ content: `L'utilisateur ${user.username} a été ajouté à la liste des VIP pour une durée de ${duration} jours.`, ephemeral: true });
				}
				else {
					await user.send(`Votre statut VIP DEVZONE a été prolongé de ${duration} jours.`);
					logChannel.send(`La durée du statut VIP de ${user.username} a été prolongée de ${duration} jours. (par ${interaction.user.username})`);
					console.log(`${clr.cya}[VIP]	${clr.whi}La durée du statut VIP de ${clr.blu}${user.username}${clr.whi} a été prolongée de ${duration} jours. (par ${clr.blu}${interaction.user.username}${clr.stop})`);
					interaction.reply({ content: `La durée du statut VIP de ${user.username} a été prolongée de ${duration} jours.`, ephemeral: true });
				}
			} catch (err) {
				console.log(`${clr.red}[VIP]	Error while adding VIP data to the database:${clr.stop} ${err}`);
				logChannel.send(`Une erreur s'est produite lors de l'ajout des données VIP pour ${user.username}.`);
				return interaction.reply({ content: "Une erreur s'est produite lors de l'ajout des données VIP.", ephemeral: true });
			}
		}
		else if (action === 'remove') {
			try {
				if (expirationTime - currentTime <= duration * timeSetting) {
					// if time left is less than the duration, remove the role and delete from db
					await dbClient.query(`DELETE FROM vip_users WHERE user_id = $1`, [user.id]);
					if (member.roles.cache.has(role.id)) {
						await member.roles.remove(role);
					}
					await user.send(`Votre statut VIP DEVZONE vous a été retiré par un administrateur.`);
					logChannel.send(`L'utilisateur ${user.username} a été retiré de la liste des VIP. (par ${interaction.user.username})`);
					console.log(`${clr.cya}[VIP]	${clr.blu}${user.username}${clr.whi} a été retiré de la liste des VIP. (par ${clr.blu}${interaction.user.username}${clr.stop})`);
					interaction.reply({ content: `L'utilisateur ${user.username} a été retiré de la liste des VIP.`, ephemeral: true });
				}
				else {
					expirationTime -= duration * timeSetting;
					await dbClient.query(`UPDATE vip_users SET expiration_time = $1 WHERE user_id = $2`, [expirationTime, user.id]);
					timeLeft = Math.ceil((expirationTime - currentTime) / timeSetting);
					await user.send(`La durée de votre statut VIP DEVZONE a été réduite de ${duration} jours. Durée restante:	${timeLeft} jours.`);
					logChannel.send(`La durée du statut VIP de ${user.username} a été réduite de ${duration} jours. Reste: ${timeLeft}. (par ${interaction.user.username})`);
					console.log(`${clr.cya}[VIP]	${clr.whi}La durée du statut VIP de ${clr.blu}${user.username}${clr.whi} a été réduite de ${duration} jours. Reste: ${timeLeft}. (par ${clr.blu}${interaction.user.username}${clr.stop})`);
					interaction.reply({ content: `La durée du statut VIP de ${user.username} a été réduite de ${duration} jours. Reste: ${timeLeft}`, ephemeral: true });
				}
			} catch (err) {
				console.log(`${clr.red}[VIP]	Error while updating VIP data in the database:${clr.stop} ${err}`);
				logChannel.send(`Une erreur s'est produite lors de la mise à jour des données VIP pour ${user.username}.`);
				return interaction.reply({ content: "Une erreur s'est produite lors de la mise à jour des données VIP.", ephemeral: true });
			}
		}
		else if (action === 'check') {
			if (interaction.user.id !== user.id && !config.adminIds.includes(interaction.user.id)) { // if user is trying to check another user's VIP status and does not have permission
				logChannel.send(`L'utilisateur ${interaction.user.username} a tenté de vérifier le statut VIP de ${user.username}.`);
				console.log(`${clr.cya}[VIP]	${clr.mag}${interaction.user.username} a tenté de vérifier le statut VIP de ${user.username}.${clr.stop}`);
				return interaction.reply({ content: "Vous ne pouvez pas vérifier le detail du statut VIP DEVZONE d'un autre utilisateur.", ephemeral: true });
			}
			timeLeft = Math.ceil((expirationTime - currentTime) / timeSetting);
			logChannel.send(`L'utilisateur ${interaction.user.username} a vérifié son statut VIP de ${user.username}.`);
			console.log(`${clr.cya}[VIP]	${clr.blu}${interaction.user.username} ${clr.whi}a vérifié son statut VIP de ${clr.blu}${user.username}.${clr.stop}`);
			interaction.reply({ content: `L'utilisateur ${user.username} est VIP DEVZONE pour encore ${timeLeft} jours.`, ephemeral: true });
		}
	}
}