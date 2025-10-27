const axios = require("axios");
const config = require("./config");

class SwapPay {
	constructor(swapWalletToken, username) {
		this.username = username;
		this.axios = axios.create({
			baseURL: config.swapPay.baseUrl,
			timeout: 30 * 1000,
			headers: {
				Authorization: `Apikey ${swapWalletToken}`,
			},
		});
	}

	async newDirectInvoice(
		amount,
		allowedToken,
		network,
		ttl,
		orderId,
		customData,
	) {
		try {
			const r = await this.axios.post(
				`/v2/payment/${this.username}/invoices/temporary-wallet`,
				{
					amount,
					allowedToken,
					network,
					ttl,
					orderId,
					underPaidCoveragePercent: null,
					customData: `${customData}`,
				},
			);
			return r.data.result;
		} catch (error) {
			console.error(
				"ERROR CREATE DIRECT INVOICE",
				JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
			);
			throw error;
		}
	}

	async getInvoiceById(invoiceId) {
		try {
			const r = await this.axios.get(
				`/v2/payment/${this.username}/invoices/${invoiceId}/info`,
			);
			return r.data.result;
		} catch (error) {
			console.error(
				"ERROR CHECK INVOICE",
				JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
			);
			throw error;
		}
	}
}

module.exports = SwapPay;
