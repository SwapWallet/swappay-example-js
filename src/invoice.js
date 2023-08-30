const {Telegraf} = require("telegraf");
const config = require("./config");
const SwapPay = require('./swapPay')
const InvoiceModel = require('./models/invoice')

class Invoice {
    constructor() {
        this.checkInvoices()
        setInterval(() => this.checkInvoices, 30 * 1000) // check invoices every minute
        this.bot = new Telegraf(config.telegram.token);
        this.swapPay = new SwapPay(config.swapPay.apiKey)
    }

    // in production, you should use some lock mechanism to prevent multiple invoice checks (concurrency issues)
    async checkInvoices() {
        // fetch invoices that are active yet
        const activeInvoices = await InvoiceModel.find({status: 'ACTIVE'})

        for (const invoice of activeInvoices) {
            // check invoice status with SwapPay API
            const invoiceStatus = await this.swapPay.getInvoiceStatus(invoice.swapPayId)

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


    async createInvoiceForUser(userId, amount) {
        // first, we create an invoice with SwapPay API
        const invoiceRes = await this.swapPay.createInvoice(
            amount,
            'TRX',
            3600,
        )

        // then, we store the invoice into our database
        const newInvoice = new InvoiceModel({
            userId, // you can store other references like order/basket model based on your service
            swapPayId: invoiceRes.id, // we store swappay invoice_id into the database for future checks
            type: 'FIXED-AMOUNT',
            amount,
            token: 'TRX',
        })
        await newInvoice.save()

        return invoiceRes
    }
}

module.exports = Invoice
