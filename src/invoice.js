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
		// Retry notifications for invoices that were paid but not yet messaged
		// (e.g. a previous Telegram send failed).
		const pendingNotifications = await InvoiceModel.find({
			status: { $in: ["PAID", "SETTLED"] },
			sentMessageToUser: false,
		});
		for (const invoice of pendingNotifications) {
			await this.notifyPaid(invoice);
		}

		// Poll still-active invoices for a status change.
		const activeInvoices = await InvoiceModel.find({ status: "ACTIVE" });
		for (const invoice of activeInvoices) {
			const info = await this.swapPay.getInvoiceById(invoice.swapPayId);
			if (info.status === "ACTIVE") continue;

			invoice.status = info.status;
			invoice.customData = info.customData ?? invoice.customData;

			if (info.status === "PAID" || info.status === "SETTLED") {
				invoice.paidAt = info.paidAt;
				invoice.paidAmount = info.paidAmount?.number ?? null;
				invoice.paidToken = info.paidAmount?.unit ?? null;
				await invoice.save();
				await this.notifyPaid(invoice);
			} else {
				// CANCELED / EXPIRED — just persist so we stop polling it.
				await invoice.save();
			}
		}
	}

	// Notify the buyer that their invoice was paid. In a real service you would
	// also deliver the purchased product here.
	async notifyPaid(invoice) {
		const name = this.productName(invoice.customData);
		try {
			await this.bot.telegram.sendMessage(
				invoice.userId,
				`سفارش «${name ?? "شما"}» با موفقیت پرداخت شد! 🎉`,
			);
			invoice.sentMessageToUser = true;
			await invoice.save();
		} catch (e) {
			console.error(`cannot send message to telegram ${e}`);
		}
	}

	productName(customData) {
		try {
			return customData ? JSON.parse(customData).name : null;
		} catch {
			return null;
		}
	}

	async getInvoiceWalletAddressFromBackend({
		amount,
		token,
		allowedToken,
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

		// Ensure ttl is within valid range (300-21600 seconds)
		const validTtl = Math.max(300, Math.min(21600, ttl));

		// Use the SwapPay service method to create direct invoice
		const invoiceRes = await this.swapPay.newDirectInvoice(
			formattedAmount,
			allowedToken,
			network,
			validTtl,
			orderId,
			customData,
		);

		const newInvoice = new InvoiceModel({
			userId,
			swapPayId: invoiceRes.id,
			amount,
			token,
			shouldPayAmount: invoiceRes.amount.amount.number,
			shouldPayToken: invoiceRes.amount.amount.unit,
			network,
		});
		await newInvoice.save();

		return invoiceRes;
	}

	async getResidFromBackend({
		amount,
		userId,
		ttl = 3600,
		orderId = null,
		customData = null,
	}) {
		// Format amount as expected by the API
		const formattedAmount = {
			number: amount,
			unit: "IRT",
		};

		// Ensure ttl is within valid range (300-21600 seconds)
		const validTtl = Math.max(300, Math.min(21600, ttl));

		// Use the SwapPay service method to create direct invoice
		const residRes = await this.swapPay.newResid(
			formattedAmount,
			validTtl,
			orderId,
			customData,
		);

		const newResid = new InvoiceModel({
			userId,
			swapPayId: residRes.id,
			amount,
			token: "IRT",
			shouldPayAmount: amount,
			shouldPayToken: "IRT",
			network: "BSC",
		});
		await newResid.save();

		return residRes;
	}
}

module.exports = Invoice;
