const { Telegraf, Markup } = require("telegraf");
const config = require('./config')
const Invoice = require('./invoice')

const bot = new Telegraf(config.telegram.token);
const invoiceApp = new Invoice()

async function start(ctx) {
    const message = `Demo Store is a demo merchant integrated with SwapPay API, showcasing the future of global convenient crypto payments. Tap the button below and make a test purchase to try out the payment flow.`
    await ctx.reply(message, {
        parse_mode: 'markdown',
        ...Markup.inlineKeyboard([
            Markup.button.callback('Show Item', 'show-item'),
        ])
    })
}
bot.start(start)
bot.action('main-menu', start)

bot.action('show-item', async (ctx) => {
    let message = `*Demo Item*`
    message += `\n\n`

    message += `*Price:* 0.01 USD`
    message += `\n\n`

    message += `*Warning!* The pay feature is in production and will result in your wallet being charged.`

    await ctx.replyWithPhoto({ source: 'src/static/example.png'}, {
        parse_mode: 'markdown',
        caption: message,
        ...Markup.inlineKeyboard([
            [Markup.button.callback('👛 Pay via Crypto', 'pay-via-crypto')],
            [Markup.button.callback('💳 Pay via Credit Card', 'pay-via-card')],
            [Markup.button.callback('‹ Back', 'main-menu')]
        ])
    })
})

bot.action('pay-via-card', async (ctx) => {
    ctx.answerCbQuery('Not available!', {show_alert: true})
})

bot.action('pay-via-crypto', async (ctx) => {
    const userId = ctx.update.callback_query.from.id
    const invoice = await invoiceApp.createInvoiceForUser(userId, "0.01")

    let message = `*Crypto Payment*`
    message += `\n\n`

    message += `please send _exactly_ specified amount on TRON network to the following address:`
    message += `\n\n`

    message += `Address: `
    message += `\`${invoice.walletAddress}\``
    message += `\n`

    message += 'Amount: '
    message += `\`${invoice.amount.number}\` TRX` // it's better to use invoice returned amount, in case of rounding issues
    message += `\n\n`

    message += `This payment will be expired in 1 hour. Please pay before then`
    message += `\n\n`

    message += `SupportCode: \`${invoice.supportCode}\``
    message += `\n\n`

    message += `*Warning!* Only send TRX in TRON network to this address. Sending other coins will result in loss of funds`
    message += '\n\n'

    message += `_⚡️Also you can pay your invoice by click on the following links:_`

    await ctx.reply(message, {
        parse_mode: 'markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.url('SwapWallet', invoice.paymentLinks.swapWallet)],
            [Markup.button.url('TrustWallet', invoice.paymentLinks.trustWallet)],
        ])
    })
})

module.exports = {
    async start() {
        await bot.launch()
    }
}
