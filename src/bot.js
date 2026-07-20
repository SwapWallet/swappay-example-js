const { Telegraf, Markup } = require("telegraf");
const { HttpsProxyAgent } = require("https-proxy-agent");

const config = require("./config");
const Invoice = require("./invoice");

// ── Bot setup ────────────────────────────────────────────────────────────────
const botOptions =
	process.env.USE_PROXY === "true"
		? { telegram: { agent: new HttpsProxyAgent(config.telegram.proxyUrl) } }
		: undefined;

const bot = new Telegraf(config.telegram.token, botOptions);
const invoiceApp = new Invoice();

// ── Demo product ─────────────────────────────────────────────────────────────
// A single fake product the user "buys" to exercise the SwapPay payment flow.
const PRODUCT = {
	name: "Call of Duty (PS5)",
	image: "src/static/example.png",
	priceUsd: "0.01", // price for crypto (temporary-wallet) payments
	priceIrt: "100000", // price for the rial "resid" payment, in Toman
};

// Crypto payment options: which token to pay with, on which network.
const CRYPTO_OPTIONS = {
	"usdt-bsc": { label: "USDT · BSC", token: "USDT", network: "BSC" },
	"usdt-ton": { label: "USDT · TON", token: "USDT", network: "TON" },
	"usdt-tron": { label: "USDT · TRON", token: "USDT", network: "TRON" },
	"ton-ton": { label: "TON", token: "TON", network: "TON" },
	"trx-tron": { label: "TRX", token: "TRX", network: "TRON" },
};

// Friendly button labels for the wallet links the API returns.
// Keyed by DeepLinkDto.name (crypto) or InvoicePaymentLinkDto.type (resid).
const WALLET_LABELS = {
	SWAP_WALLET: "SwapWallet App",
	SWAP_WALLET_WEBSITE: "SwapWallet Website",
	TRUST_WALLET: "Trust Wallet",
	TON_KEEPER: "Tonkeeper",
	TONHUB: "Tonhub",
	MYTONWALLET: "MyTonWallet",
	TELEGRAM_WEBAPP: "SwapWallet App",
	WEBSITE: "SwapWallet Website",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const reply = (ctx, text, buttons) =>
	ctx.reply(text, {
		parse_mode: "markdown",
		disable_web_page_preview: true,
		...Markup.inlineKeyboard(buttons),
	});

// Short Tehran-local time string, e.g. "۱۴۰۳/۴/۱۸، ۱۲:۳۰".
const formatExpiry = (date) =>
	new Intl.DateTimeFormat("fa-IR", {
		dateStyle: "short",
		timeStyle: "short",
		timeZone: "Asia/Tehran",
	}).format(new Date(date));

// Turn API wallet links into Telegram URL buttons (one per row).
const linkButtons = (links) =>
	(links ?? [])
		.filter((link) => link?.url?.trim())
		.map((link) => [
			Markup.button.url(
				WALLET_LABELS[link.name ?? link.type] ??
					link.textFa ??
					"باز کردن کیف پول",
				link.url.trim(),
			),
		]);

const customData = () => JSON.stringify({ name: PRODUCT.name });

// ── Screens ──────────────────────────────────────────────────────────────────

// /start – intro + entry to the demo store.
async function start(ctx) {
	const message =
		"فروشگاه گیم دمو یک فروشگاه آزمایشی است که با [SwapPay API](https://docs.swapwallet.app/#swappay) یکپارچه شده و آینده‌ی پرداخت‌های رمزارزی آسان و جهانی را به نمایش می‌گذارد. روی دکمه‌ی زیر بزنید و یک خرید آزمایشی انجام دهید تا مسیر پرداخت را امتحان کنید." +
		"\n\n" +
		"می‌توانید کد منبع این دموی پرداخت را در [github.com/SwapWallet](https://github.com/SwapWallet/swappay-example-js) پیدا کنید.";

	await reply(ctx, message, [
		Markup.button.callback("نمایش محصول", "show-item"),
	]);
}

bot.start(start);
bot.action("main-menu", async (ctx) => {
	await ctx.answerCbQuery();
	await start(ctx);
});

// Product page – pick a payment method.
bot.action("show-item", async (ctx) => {
	await ctx.answerCbQuery();
	await ctx.replyWithPhoto(
		{ source: PRODUCT.image },
		{
			parse_mode: "markdown",
			caption:
				`*${PRODUCT.name}*\n\n` +
				`*قیمت:* ${PRODUCT.priceUsd} دلار\n\n` +
				"*روش پرداخت را انتخاب کنید:*",
			...Markup.inlineKeyboard([
				[Markup.button.callback("پرداخت ریالی (رسید)", "pay-resid")],
				[Markup.button.callback("پرداخت با ارز دیجیتال", "show-crypto")],
				[Markup.button.callback("‹ بازگشت", "main-menu")],
			]),
		},
	);
});

// Crypto submenu – pick token + network.
bot.action("show-crypto", async (ctx) => {
	const buttons = Object.entries(CRYPTO_OPTIONS).map(([key, opt]) => [
		Markup.button.callback(opt.label, `pay-crypto:${key}`),
	]);
	buttons.push([Markup.button.callback("‹ بازگشت", "show-item")]);

	await ctx.answerCbQuery();
	await reply(ctx, "*ارز و شبکه‌ی مورد نظر خود را انتخاب کنید:*", buttons);
});

// Rial "resid" payment – POST /v1/merchants/resid.
bot.action("pay-resid", async (ctx) => {
	await ctx.answerCbQuery();

	const resid = await invoiceApp.getResidFromBackend({
		amount: PRODUCT.priceIrt,
		userId: ctx.from.id,
		customData: customData(),
	});

	const amount = Number(PRODUCT.priceIrt).toLocaleString("fa-IR");
	const message =
		`رسید پرداخت به مبلغ *${amount} تومان* ایجاد شد. برای پرداخت روی یکی از دکمه‌های زیر بزنید:\n\n` +
		`این رسید در ${formatExpiry(resid.expiredAt)} به وقت تهران منقضی می‌شود.`;

	await reply(ctx, message, linkButtons(resid.paymentLinks));
});

// Crypto payment via a temporary wallet – POST /v1/merchants/invoices/temporary-wallet.
bot.action(/^pay-crypto:(?<key>[a-z-]+)$/, async (ctx) => {
	await ctx.answerCbQuery();

	const option = CRYPTO_OPTIONS[ctx.match.groups.key];
	if (!option) return;

	const invoice = await invoiceApp.getInvoiceWalletAddressFromBackend({
		amount: PRODUCT.priceUsd,
		token: "USDT", // product is priced in USD(T)
		allowedToken: option.token,
		network: option.network,
		userId: ctx.from.id,
		customData: customData(),
	});

	const payAmount = invoice.amount.amount.number;
	const message =
		`لطفاً دقیقاً مبلغ *${payAmount} ${option.token}* را روی شبکه‌ی *${option.network}* به آدرس زیر ارسال کنید:\n` +
		`\`${invoice.walletAddress}\`\n\n` +
		`این فاکتور در ${formatExpiry(invoice.expiredAt)} به وقت تهران منقضی می‌شود.`;

	const buttons = [
		...linkButtons(invoice.links),
		[
			Markup.button.url(
				"درگاه پرداخت SwapPay",
				`https://swapwallet.app/swap-pay?invoiceId=${invoice.id}`,
			),
		],
	];

	await reply(ctx, message, buttons);
});

// ── Lifecycle ────────────────────────────────────────────────────────────────
module.exports = {
	async start() {
		await bot.launch({ polling: { timeout: 30, limit: 100 } });
		console.log("Bot started with polling enabled");

		process.once("SIGINT", () => bot.stop("SIGINT"));
		process.once("SIGTERM", () => bot.stop("SIGTERM"));
	},

	async stop() {
		await bot.stop();
	},
};
