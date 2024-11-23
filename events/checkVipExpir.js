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

		const VIPguild = bot.guilds.cache.get(config.VIPGuildId);

		// Schedulejob every day at midnight, that gets all VIP users from the vip_users table and
		// checks if their expiration_time is less than the current time. If it is,
		// remove them from the database and remove the vip role.
		schedule.scheduleJob('0 12 * * *', async () => {
			const currentTime = Date.now();
			const vipUsers = await dbClient.query(`SELECT * FROM vip_users`);
			const vipRole = VIPguild.roles.cache.find(role => role.name === 'VIP');
			vipUsers.rows.forEach(async vipUser => {
				if (vipUser.expiration_time < currentTime) {
					const user = await bot.users.fetch(vipUser.user_id);
					const member = await VIPguild.members.fetch(user);
					const role = VIPguild.roles.cache.get("1304450331727495251");
					await dbClient.query(`DELETE FROM vip_users WHERE user_id = $1`, [user.id]);
					if (member.roles.cache.has(role.id)) {
						await member.roles.remove(role);
						await user.send(`Votre statut VIP DEVZONE a expirer.`);
						console.log(`${clr.cya}[VIP]	${clr.blu}${user.username} ${clr.whi}lost their VIP DEVZONE status. (expired)${clr.stop}`);
					}
				}
				// if expiration time is less than 3 days, notify the user
				else if  (vipUser.expiration_time - 3 * timeSetting < currentTime && !vipUser.notified) {
					const user = await bot.users.fetch(vipUser.user_id);
					await dbClient.query(`UPDATE vip_users SET notified = TRUE WHERE user_id = $1`, [user.id]);
					await user.send(`Votre statut VIP DEVZONE va expirer dans 3 jours.`);
					console.log(`${clr.cya}[VIP]	${clr.blu}${user.username} ${clr.whi}has been notified that their VIP DEVZONE status will expire in 3 days.${clr.stop}`);
				}
			});
		});
		console.log(`${clr.cya}[VIP]	${clr.grn}OK ${clr.blu}VIP expiration checks scheduled${clr.stop}`);
	},
};