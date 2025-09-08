require("dotenv").config();

const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoHost = process.env.MONGO_HOST;
const mongoPort = process.env.MONGO_PORT;
const mongoDb = process.env.MONGO_DB;

const config = {
	telegram: {
		token: process.env.TELEGRAM_TOKEN,
	},
	swapPay: {
		apiKey: process.env.SWAP_PAY_API_KEY,
		application: process.env.SWAP_PAY_APPLICATION,
	},
	db: {
		uri: `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:${mongoPort}/${mongoDb}?directConnection=true`,
	},
};

module.exports = config;
