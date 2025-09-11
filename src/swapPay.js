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

	async newDirectInvoice(amount, network, ttl, orderId, customData) {
		try {
			const r = await this.axios.post(
				`/v1/payment/${this.username}/invoice/direct`,
				{
					amount,
					network,
					ttl,
					orderId,
					customData: `${customData}`,
				},
			);
			return r.data.result;
		} catch (error) {
			console.error("ERROR CREATE DIRECT INVOICE", error);
			throw error;
		}
	}

	async getInvoiceById(invoiceId) {
		try {
			const r = await this.axios.get(`/v1/payment/invoice/${invoiceId}/info`);
			return r.data.result;
		} catch (error) {
			console.error("ERROR CHECK INVOICE", error);
			throw error;
		}
	}
}

module.exports = SwapPay;
