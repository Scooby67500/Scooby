const { Client } = require('pg');
const config = require('./config');
const clr = require('./resources/color_codes');

const dbClient = new Client({
	user: config.DBuser,
	host: config.DBhost,
	database: config.DBname,
	password: config.DBpassword,
	port: config.DBport,
});

dbClient.connect()
    .then(async () => {
		console.log(`${clr.cya}[PG]	${clr.grn}Connexion à PostgreSQL (${config.DBname}) établie${clr.stop}`);
		try {
			await dbClient.query(`
				CREATE TABLE IF NOT EXISTS vip_users (
					user_id VARCHAR(50) PRIMARY KEY,
					expiration_time BIGINT NOT NULL,
					notified BOOLEAN DEFAULT FALSE
				);
			`);
			console.log(`${clr.cya}[PG]	${clr.grn}OK ${clr.blu}TABLE vip_users${clr.stop}`);
		} catch (err) {
			console.error(`${clr.red}[PG]	Erreur lors de la création de la table vip_users${clr.stop}`, err);
		}
	})
	.catch(err => console.error(`${clr.red}[PG]	Erreur de connexion à PostgreSQL${clr.stop}`, err));

module.exports = dbClient;