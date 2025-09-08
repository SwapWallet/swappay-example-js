const bot = require("./bot");
const db = require("./utils/db");
const Invoice = require("./invoice");

async function main() {
	await db.connectToDB();
	await bot.start();

	// Create invoice instance for periodic checking
	const invoiceApp = new Invoice();

	// Set up invoice checking every 2 minutes (120,000 milliseconds)
	const INVOICE_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds

	console.log("Starting invoice checker - will run every 2 minutes");

	// Run initial check
	try {
		await invoiceApp.checkInvoices();
		console.log("Initial invoice check completed");
	} catch (error) {
		console.error("Error in initial invoice check:", error);
	}

	// Set up periodic checking
	setInterval(async () => {
		try {
			console.log("Running periodic invoice check...");
			await invoiceApp.checkInvoices();
			console.log("Periodic invoice check completed");
		} catch (error) {
			console.error("Error in periodic invoice check:", error);
		}
	}, INVOICE_CHECK_INTERVAL);
}

main();
