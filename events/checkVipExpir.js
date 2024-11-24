const Discord = require("discord.js");
const clr = require("../resources/color_codes");
const dbClient = require('../database');
const schedule = require("node-schedule");
const config = require("../config");

module.exports = {
	name: Discord.Events.ClientReady,	// Triggers when the bot is connected
	once: true,	// Triggers only once.
	async execute(bot) {

		const timeSetting = 60 * 60 * 24 * 1000; // days in milliseconds
						//  60 * 60 * 1000          hours in milliseconds
						//  60 * 1000               minutes in milliseconds


		// Schedulejob every day at noon, that gets all VIP users from the vip_users table and
		// checks if their expiration_time is less than the current time. If it is,
		// remove them from the database and remove the vip role.
		schedule.scheduleJob('0 12 * * *', async () => {
			const currentTime = Date.now();
			const vipUsers = await dbClient.query(`SELECT * FROM vip_users`);

			vipUsers.rows.forEach(async vipUser => {
				const user = await bot.users.fetch(vipUser.user_id);
				const guild = await bot.guilds.cache.get(config.VIPGuildId);
				const member = await guild.members.cache.get(user.id);
				const vipRole = guild.roles.cache.get("1304450331727495251");

				if (vipUser.expiration_time < currentTime) {
					await member.roles.remove(vipRole);
					await dbClient.query(`DELETE FROM vip_users WHERE user_id = $1`, [user.id]);
					await user.send(`Votre statut VIP DEVZONE a expiré.`);
					console.log(`${clr.cya}[VIP]	${clr.red}${user.username} ${clr.whi}has lost their VIP DEVZONE status.${clr.stop}`);
				}
				// if expiration time is less than 3 days, notify the user
				else if  (vipUser.expiration_time - 3 * timeSetting < currentTime && !vipUser.notified) {
					await dbClient.query(`UPDATE vip_users SET notified = TRUE WHERE user_id = $1`, [user.id]);
					await user.send(`Votre statut VIP DEVZONE va expirer dans 3 jours.`);
					console.log(`${clr.cya}[VIP]	${clr.blu}${user.username} ${clr.whi}has been notified that their VIP DEVZONE status will expire in 3 days.${clr.stop}`);
				}
			});
		});
		console.log(`${clr.cya}[VIP]	${clr.grn}OK ${clr.blu}VIP expiration checks scheduled${clr.stop}`);
	},
};