const {Telegraf} = require("telegraf");
const config = require("./config");
const SwapPay = require('./swapPay')
const InvoiceModel = require('./models/invoice')

class Invoice {
    constructor() {
        this.bot = new Telegraf(config.telegram.token);
        this.swapPay = new SwapPay(config.swapPay.apiKey, config.swapPay.application)
    }

    // in production, you should use some lock mechanism to prevent multiple invoice checks (concurrency issues)
    async checkInvoices() {
        // fetch invoices that are active yet
        const activeInvoices = await InvoiceModel.find({status: 'ACTIVE'})

        for (const invoice of activeInvoices) {
            // check invoice status with SwapPay API
            const invoiceStatus = await this.swapPay.getInvoiceById(invoice.swapPayId)

            if (invoiceStatus.status === 'PAID') {
                // update invoice status in database, and notify user
                invoice.status = 'PAID'
                invoice.paidAt = invoiceStatus.paidAt
                await invoice.save()

                // you should do something else based on your service, like sending actual product to the user!
                await this.bot.telegram.sendMessage(invoice.userId, `Your invoice has been paid! 🎉`)
            } else if (invoiceStatus.status !== 'ACTIVE') {
                // update invoice status in database to prevent future checks
                invoice.status = invoiceStatus.status
                await invoice.save()
            }
        }
    }

    // for simplicity, we create swap-pay invoice first and then create internal-invoice model, but maybe you want to create your invoice first and then create swap-pay invoice in production
    async createInvoiceForUser(userId, amount) {
        const token = 'USDT'

        // first, we create an invoice with SwapPay API
        const invoiceRes = await this.swapPay.newInvoice(
            amount,
            token, // user should pay invoice with USDT token (there is no network fee here!)
            3600,
            null, // you can pass your internal invoice model id as external-id, this should be unique and can prevent from duplicate invoices
            `invoice for fake product (userId: ${userId})`, // this can be used to found descriptions in payment panel
            `userId=${userId}`, // you can pass customData which will be returned when you want to check invoice
            `https://t.me/SwapwalletDemoBot?start=check-invoices`, // if return url starts with https://t.me/, it will return to telegram-bot with your predefined start param, you can use external-id as start params to check invoice status
        )

        // then, we store the invoice into our database
        const newInvoice = new InvoiceModel({
            userId, // you can store other references like order/basket model based on your service
            swapPayId: invoiceRes.id, // we store swap-pay invoice_id into the database for future checks
            amount,
            token,
        })
        await newInvoice.save()

        return invoiceRes
    }
}

module.exports = Invoice
