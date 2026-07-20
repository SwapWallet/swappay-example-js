require("dotenv").config({ path: `${__dirname}/../.env` });

const mongoUser = process.env.MONGODB_USER;
const mongoPass = process.env.MONGODB_PASS;
const mongoHost = process.env.MONGODB_HOST;
const mongoPort = process.env.MONGODB_PORT;

const config = {
	telegram: {
		token: process.env.TELEGRAM_TOKEN,
		proxyUrl: process.env.PROXY_URL,
	},
	swapPay: {
		baseUrl: process.env.SWAP_PAY_BASE_URL,
		apiKey: process.env.SWAP_PAY_API_KEY,
		application: process.env.SWAP_PAY_APPLICATION,
	},
	db: {
		uri: `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:${mongoPort}/?directConnection=true`,
	},
};

module.exports = config;
