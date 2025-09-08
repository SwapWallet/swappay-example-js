const { Telegraf, Markup } = require("telegraf");
const config = require("./config");
const Invoice = require("./invoice");

const bot = new Telegraf(config.telegram.token);
const invoiceApp = new Invoice();

async function start(ctx) {
	// we check all invoices in every bot starts! but maybe you want to check specific invoice based on webhook or returnUrl params
	invoiceApp.checkInvoices();

	let message = `فروشگاه نمایشی یک فروشنده‌ی آزمایشی است که با [SwapPay API](https://docs.swapwallet.app/#swappay) یکپارچه شده و آینده‌ی پرداخت‌های رمزارزی آسان و جهانی را به نمایش می‌گذارد.  روی دکمه‌ی زیر بزنید و یک خرید آزمایشی انجام دهید تا جریان پرداخت را امتحان کنید.`;
	message += "\n\n";

	message +=
		"می‌توانید کد منبع این دموی آزمایشی را در [github.com/SwapWallet](https://github.com/SwapWallet/swappay-example-js) پیدا کنید.";

	await ctx.reply(message, {
		parse_mode: "markdown",
		disable_web_page_preview: true,
		...Markup.inlineKeyboard([
			Markup.button.callback("نمایش محصول", "show-item"),
		]),
	});
}

bot.start(start);
bot.action("main-menu", start);

bot.action("show-item", async (ctx) => {
	const userId = ctx.update.callback_query.from.id;
	// const invoice = await invoiceApp.createInvoiceForUser(userId, "0.01")
	// const directInvoice = await invoiceApp.getInvoiceWalletAddressFromBackend(userId, "0.01")

	let message = `*محصول آزمایشی*`;
	message += `\n\n`;

	message += `*قیمت:* 1 دلار`;
	message += `\n\n`;

	// message += `*Warning!* The pay feature is in production and will result in your wallet being charged.`
	// message += `\n\n`

	message += `*انتخاب توکنی که می‌خواهید پرداخت را با آن انجام دهید:*`;

	await ctx.replyWithPhoto(
		{ source: "src/static/example.png" },
		{
			parse_mode: "markdown",
			caption: message,
			...Markup.inlineKeyboard([
				[Markup.button.callback("USDT", "token:usdt")],
				[Markup.button.callback("TON", "coin:ton-ton")],
				[Markup.button.callback("TRON", "coin:trx-tron")],
				// [Markup.button.url('⚡ Wallet Payment', invoice.paymentLinks.find(i => i.type === 'TELEGRAM_WEBAPP').url)],
				// [Markup.button.url('🤖Bot Payment', invoice.paymentLinks.find(i => i.type === 'TELEGRAM_BOT').url)],
				// [Markup.button.url('🌐Website Payment', invoice.paymentLinks.find(i => i.type === 'WEBSITE').url)],
				[Markup.button.callback("‹ بازگشت", "main-menu")],
			]),
		},
	);
});

bot.action("token:usdt", async (ctx) => {
	let message = `*محصول آزمایشی*`;
	message += `\n\n`;

	message += `*قیمت:* 1 دلار`;
	message += `\n\n`;

	// message += `*Warning!* The pay feature is in production and will result in your wallet being charged.`
	// message += `\n\n`

	message += `*انتخاب شبکه‌ای که می‌خواهید تتر را با آن پرداخت کنید:*`;

	await ctx.answerCbQuery(); // stop Telegram spinner
	await ctx.editMessageText(message, {
		parse_mode: "markdown",
		...Markup.inlineKeyboard([
			[Markup.button.callback("BSC", "coin:usdt-bsc")],
			[Markup.button.callback("TON", "coin:usdt-ton")],
			[Markup.button.callback("TRON", "coin:usdt-tron")],
			[Markup.button.callback("‹ Back", "show-item")],
		]),
	});
});

bot.action(/^coin:(?<token>[a-z]+)-(?<network>[a-z]+)$/i, async (ctx) => {
	const { token, network } = ctx.match.groups;
	const directInvoice = await invoiceApp.getInvoiceWalletAddressFromBackend(
		"1",
		token,
		network,
	);
	const expiredAt = new Intl.DateTimeFormat("fa-IR", {
		dateStyle: "full",
		timeStyle: "short",
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	}).format(new Date(directInvoice.expiredAt));
	const links = directInvoice.links;
	const amount = directInvoice.amount;

	const message = `
  لطفا دقیقا مبلغ ${amount} ${token.toUpperCase()} را به ادرس ولت زیر ارسال کنید:
  ${directInvoice.walletAddress}
  
  این رسید در ${expiredAt} منقضی خواهد شد.
  `;

	const buttons = links.map((link) => [Markup.button.url(link.name, link.url)]);

	await ctx.answerCbQuery(); // stop Telegram spinner
	await ctx.reply(message, {
		parse_mode: "markdown",
		...Markup.inlineKeyboard(buttons),
	});
});

module.exports = {
	async start() {
		await bot.launch();
	},
};
