const { Telegraf } = require("telegraf");
const config = require("./config");
const SwapPay = require("./swapPay");
const InvoiceModel = require("./models/invoice");

class Invoice {
	constructor() {
		this.bot = new Telegraf(config.telegram.token);
		this.swapPay = new SwapPay(
			config.swapPay.apiKey,
			config.swapPay.application,
		);
	}

	// in production, you should use some lock mechanism to prevent multiple invoice checks (concurrency issues)
	async checkInvoices() {
		// fetch invoices that are active yet
		const activeInvoices = await InvoiceModel.find({ status: "ACTIVE" });

		for (const invoice of activeInvoices) {
			// check invoice status with SwapPay API
			const invoiceInfo = await this.swapPay.getInvoiceById(invoice.swapPayId);
			const name = invoiceInfo.customData.name;

			if (invoiceInfo.status === "PAID") {
				// update invoice status in database, and notify user
				invoice.status = "PAID";
				invoice.paidAt = invoiceInfo.paidAt;
				invoice.paidAmount = invoiceInfo.paidAmount.number;
				invoice.paidToken = invoiceInfo.paidAmount.unit;
				await invoice.save();

				// you should do something else based on your service, like sending actual product to the user!
				await this.bot.telegram.sendMessage(
					invoice.userId,
					`رسید ${name} با موفقیت پرداخت شد! 🎉`,
				);
			} else if (invoiceInfo.status !== "ACTIVE") {
				// update invoice status in database to prevent future checks
				invoice.status = invoiceInfo.status;
				await invoice.save();
			}
		}
	}

	async getInvoiceWalletAddressFromBackend({
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

		// Ensure ttl is within valid range (300-21600 seconds)
		const validTtl = Math.max(300, Math.min(21600, ttl));

		// Use the SwapPay service method to create direct invoice
		const invoiceRes = await this.swapPay.newDirectInvoice(
			formattedAmount,
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
		});
		await newInvoice.save();

		return invoiceRes;
	}
}

module.exports = Invoice;
