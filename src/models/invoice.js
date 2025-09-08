const mongoose = require("mongoose");
const { Schema } = mongoose;

const invoiceSchema = new Schema({
	userId: { type: Number, required: true }, // Use {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true} in production!
	swapPayId: { type: String, required: true },
	amount: { type: String, required: true },
	token: { type: String, required: true, enum: ["USDT", "TRX", "TON"] },
	network: { type: String, required: true, enum: ["TON", "TRON", "BSC"] },
	status: {
		type: String,
		required: true,
		default: "ACTIVE",
		enum: ["ACTIVE", "CANCELLED", "PAID", "EXPIRED"],
	},
	paidAt: { type: Date, default: null },
	paidAmount: { type: String, default: null },
	paidToken: { type: String, default: null, enum: ["USDT", "TRX", "TON"] },
});

const InvoiceModel = mongoose.model("Invoice", invoiceSchema);
module.exports = InvoiceModel;
