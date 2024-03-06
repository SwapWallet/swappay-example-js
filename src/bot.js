const {Telegraf, Markup} = require("telegraf");
const config = require('./config')
const Invoice = require('./invoice')

const bot = new Telegraf(config.telegram.token);
const invoiceApp = new Invoice()

async function start(ctx) {
  // we check all invoices in every bot starts! but maybe you want to check specific invoice based on webhook or returnUrl params
  invoiceApp.checkInvoices()

  let message = `Demo Store is a demo merchant integrated with [SwapPay API](https://docs.swapwallet.app/#swappay), showcasing the future of global convenient crypto payments. Tap the button below and make a test purchase to try out the payment flow.`
  message += '\n\n'

  message += 'You can find the source code for this demo at [github.com/SwapWallet](https://github.com/SwapWallet/swappay-example-js).'

  await ctx.reply(message, {
    parse_mode: 'markdown',
    disable_web_page_preview: true,
    ...Markup.inlineKeyboard([
      Markup.button.callback('Show Item', 'show-item'),
    ])
  })
}

bot.start(start)
bot.action('main-menu', start)

bot.action('show-item', async (ctx) => {
  const userId = ctx.update.callback_query.from.id
  const invoice = await invoiceApp.createInvoiceForUser(userId, "0.01")

  let message = `*Demo Item*`
  message += `\n\n`

  message += `*Price:* 0.01 USD`
  message += `\n\n`

  message += `*Warning!* The pay feature is in production and will result in your wallet being charged.`

  await ctx.replyWithPhoto({source: 'src/static/example.png'}, {
    parse_mode: 'markdown',
    caption: message,
    ...Markup.inlineKeyboard([
      [Markup.button.url('⚡ Direct Pay', invoice.paymentLinks.find(i => i.type === 'TELEGRAM_WEBAPP').url)],
      [Markup.button.url('🤖Bot Payment', invoice.paymentLinks.find(i => i.type === 'TELEGRAM_BOT').url)],
      [Markup.button.url('🌐Website Payment', invoice.paymentLinks.find(i => i.type === 'WEBSITE').url)],
      [Markup.button.callback('‹ Back', 'main-menu')]
    ])
  })
})

module.exports = {
  async start() {
    await bot.launch()
  }
}
