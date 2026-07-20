const bot = require("./bot");
const db = require("./utils/db");
const Invoice = require("./invoice");

async function main() {
	try {
		await db.connectToDB();
		const invoiceApp = new Invoice();

		const INVOICE_CHECK_INTERVAL = 30 * 1000;

		console.log("Starting invoice checker - will run every 30 seconds");

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
		await bot.start();
	} catch (error) {
		console.error("Failed to start application:", error);
		process.exit(1);
	}

	// Create invoice instance for periodic checking

	// Graceful shutdown handling
	process.on("SIGINT", async () => {
		console.log("\nReceived SIGINT. Shutting down gracefully...");
		await bot.stop();
		process.exit(0);
	});

	process.on("SIGTERM", async () => {
		console.log("\nReceived SIGTERM. Shutting down gracefully...");
		await bot.stop();
		process.exit(0);
	});
}

main();
