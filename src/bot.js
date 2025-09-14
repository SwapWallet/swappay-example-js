const { Telegraf, Markup } = require("telegraf");
const { HttpsProxyAgent } = require("https-proxy-agent");

const config = require("./config");
const Invoice = require("./invoice");

let botOptions = null;
if (process.env.USE_PROXY === "true") {
	botOptions = {
		telegram: {
			agent: new HttpsProxyAgent(config.telegram.proxyUrl),
		},
	};
}

const bot = new Telegraf(config.telegram.token, botOptions);
const invoiceApp = new Invoice();
const PRICE = "0.01";

async function start(ctx) {
	// Invoice checking is now handled by the periodic interval system in index.js

	let message = `فروشگاه گیم دمو یک فروشگاه آزمایشی است که با [SwapPay API](https://docs.swapwallet.app/#swappay) یکپارچه شده و آینده‌ی پرداخت‌های رمزارزی آسان و جهانی را به نمایش می‌گذارد.  روی دکمه‌ی زیر بزنید و یک خرید آزمایشی انجام دهید تا مسیر پرداخت را امتحان کنید.`;
	message += "\n\n";

	message +=
		"می‌توانید کد منبع این دموی پرداخت را در [github.com/SwapWallet](https://github.com/SwapWallet/swappay-example-js) پیدا کنید.";

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
	// const invoice = await invoiceApp.createInvoiceForUser(userId, "0.01")
	// const directInvoice = await invoiceApp.getInvoiceWalletAddressFromBackend(userId, "0.01")

	let message = `*Call of Duty (PS5)*`;
	message += `\n\n`;

	message += `*قیمت:* ${PRICE} دلار`;
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
	let message = `*Call of Duty (PS5)*`;
	message += `\n\n`;

	message += `*قیمت:* ${PRICE} دلار`;
	message += `\n\n`;

	// message += `*Warning!* The pay feature is in production and will result in your wallet being charged.`
	// message += `\n\n`

	message += `*انتخاب شبکه‌ای که می‌خواهید تتر را با آن پرداخت کنید:*`;

	await ctx.answerCbQuery(); // stop Telegram spinner
	await ctx.reply(message, {
		parse_mode: "markdown",
		...Markup.inlineKeyboard([
			[Markup.button.callback("BSC", "coin:usdt-bsc")],
			[Markup.button.callback("TON", "coin:usdt-ton")],
			[Markup.button.callback("TRON", "coin:usdt-tron")],
			[Markup.button.callback("‹ بازگشت", "show-item")],
		]),
	});
});

bot.action(/^coin:(?<token>[a-z]+)-(?<network>[a-z]+)$/i, async (ctx) => {
	const { token, network } = ctx.match.groups;
	const userId = ctx.update.callback_query.from.id;

	const directInvoice = await invoiceApp.getInvoiceWalletAddressFromBackend({
		amount: PRICE,
		token: token.toUpperCase(),
		network: network.toUpperCase(),
		userId,
		customData: `{ "name": "Call of Duty (PS5)" }`,
	});
	const expiredAt = new Intl.DateTimeFormat("fa-IR", {
		dateStyle: "short",
		timeStyle: "short",
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
	}).format(new Date(directInvoice.expiredAt));
	const links = directInvoice.links;
	const amount = directInvoice.amount.amount.number;

	const message = `
  لطفا دقیقا مبلغ ${amount} ${token.toUpperCase()} را به ادرس ولت زیر ارسال کنید:
  \`${directInvoice.walletAddress}\`
  
  این رسید در ${expiredAt} منقضی خواهد شد.
  `;

  const linkFaNames = {
  	"SWAP_WALLET": "SwapWallet",
  	"TRUST_WALLET": "Trust Wallet",
  	"TON_KEEPER": "Tonkeeper",
  	"TONHUB": "Tonhub",
  	"MYTONWALLET": "MyTonWallet"
  };
	const buttons = links.map((link) => [Markup.button.url(linkFaNames[link.name], link.url)]);

	await ctx.answerCbQuery(); // stop Telegram spinner
	await ctx.reply(message, {
		parse_mode: "markdown",
		...Markup.inlineKeyboard(buttons),
	});
});

module.exports = {
	async start() {
		// Launch bot with polling enabled (default behavior)
		await bot.launch({
			polling: {
				timeout: 30, // Polling timeout in seconds
				limit: 100, // Maximum number of updates to fetch at once
			},
		});

		console.log("Bot started with polling enabled");

		// Enable graceful stop
		process.once("SIGINT", () => bot.stop("SIGINT"));
		process.once("SIGTERM", () => bot.stop("SIGTERM"));
	},

	// Method to stop the bot gracefully
	async stop() {
		await bot.stop();
	},
};
