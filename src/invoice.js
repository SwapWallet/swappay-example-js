const { Telegraf } = require("telegraf");
const { HttpsProxyAgent } = require("https-proxy-agent");
const config = require("./config");
const SwapPay = require("./swapPay");
const InvoiceModel = require("./models/invoice");

class Invoice {
	constructor() {
		let botOptions = null;
		if (process.env.USE_PROXY === "true") {
			botOptions = {
				telegram: {
					agent: new HttpsProxyAgent(config.telegram.proxyUrl),
				},
			};
		}

		this.bot = new Telegraf(config.telegram.token, botOptions);
		this.swapPay = new SwapPay(
			config.swapPay.apiKey,
			config.swapPay.application,
		);
	}

	// in production, you should use some lock mechanism to prevent multiple invoice checks (concurrency issues)
	async checkInvoices() {
		// fetch invoices that are active yet
		const activeInvoices = await InvoiceModel.find({ status: "ACTIVE" });
		const paidInvoices = await InvoiceModel.find({
			status: "PAID",
			sentMessageToUser: false,
		});
		// console.log(JSON.stringify(activeInvoices, null, 2))

		for (const paidInvoice in paidInvoices) {
			try {
				await this.bot.telegram.sendMessage(
					paidInvoice.userId,
					`رسید ${paidInvoice.customData} با موفقیت پرداخت شد! 🎉`,
				);
				paidInvoice.sentMessageToUser = true;
				await paidInvoice.save();
			} catch (e) {
				console.error(`cannot send message to telegram ${e}`);
			}
		}

		for (const invoice of activeInvoices) {
			// check invoice status with SwapPay API
			const invoiceInfo = await this.swapPay.getInvoiceById(invoice.swapPayId);
			const name =
				invoiceInfo.customData != null
					? JSON.parse(invoiceInfo.customData).name
					: null;

			if (invoiceInfo.status === "PAID") {
				// update invoice status in database, and notify user
				invoice.status = "PAID";
				invoice.paidAt = invoiceInfo.paidAt;
				invoice.paidAmount = invoiceInfo.paidAmount.number;
				invoice.paidToken = invoiceInfo.paidAmount.unit;
				invoice.customData = invoiceInfo.customData;
				await invoice.save();

				// you should do something else based on your service, like sending actual product to the user!
				try {
					await this.bot.telegram.sendMessage(
						invoice.userId,
						`رسید ${name} با موفقیت پرداخت شد! 🎉`,
					);
					invoice.sentMessageToUser = true;
					await invoice.save();
				} catch (e) {
					console.error(`cannot send message to telegram ${e}`);
				}
			} else if (invoiceInfo.status !== "ACTIVE") {
				// update invoice status in database to prevent future checks
				invoice.status = invoiceInfo.status;
				await invoice.save();
			}
		}
	}

	async getInvoiceWalletAddressFromBackend({
		requestedAmount,
		requestedToken,
		amount,
		token,
		network,
		userId,
		ttl = 3600,
		orderId = null,
		customData = null,
	}) {
		// Format amount as expected by the API
		const formattedAmount = {
			number: amount,
			unit: token,
		};

		const formattedRequestedAmount = {
			number: requestedAmount,
			unit: requestedToken,
		};

		// Ensure ttl is within valid range (300-21600 seconds)
		const validTtl = Math.max(300, Math.min(21600, ttl));

		// Use the SwapPay service method to create direct invoice
		const invoiceRes = await this.swapPay.newDirectInvoice(
			formattedRequestedAmount,
			formattedAmount,
			network,
			validTtl,
			orderId,
			customData,
		);

		const newInvoice = new InvoiceModel({
			userId,
			swapPayId: invoiceRes.id,
			requestedAmount,
			requestedToken,
			amount,
			token,
			network,
		});
		await newInvoice.save();

		return invoiceRes;
	}
}

module.exports = Invoice;
