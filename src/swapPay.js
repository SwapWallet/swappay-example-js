const axios = require("axios");

class SwapPay {
	constructor(swapWalletToken, username) {
		this.username = username;
		this.axios = axios.create({
			baseURL: "https://swapwallet.app/api",
			timeout: 30 * 1000,
			headers: {
				Authorization: `Apikey ${swapWalletToken}`,
			},
		});
	}

	async newInvoice(
		valueInDollar,
		autoConversionToken,
		ttl,
		externalId,
		description,
		customData,
		returnUrl,
	) {
		try {
			const r = await this.axios.post(`/v1/payment/${this.username}/invoice`, {
				amount: {
					number: valueInDollar.toString(),
					unit: "USD",
				},
				autoConversionToken,
				ttl,
				externalId,
				description,
				customData,
				returnUrl,
			});
			return r.data.result;
		} catch (error) {
			console.error("ERROR CREATE INVOICE", error);
			throw error;
		}
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
					customData,
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
			const r = await this.axios.get(
				`/v1/payment/${this.username}/invoice/${invoiceId}`,
			);
			return r.data.result;
		} catch (error) {
			console.error("ERROR CHECK INVOICE", error);
			throw error;
		}
	}
}

module.exports = SwapPay;
