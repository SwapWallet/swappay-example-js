const mongoose = require('mongoose');
const {Schema} = mongoose;

const invoiceSchema = new Schema({
  userId: {type: Number, required: true}, // Use {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true} in production!
  swapPayId: {type: String, required: true},
  type: {type: String, required: true, enum: ['FIXED-AMOUNT', 'FIXED-VALUE']},
  amount: {type: String, required: true},
  token: {type: String, required: true, enum: ['TRX']},
  status: {type: String, required: true, default: 'ACTIVE', enum: ['ACTIVE', 'CANCELLED', 'PAID', 'EXPIRED']},
  paidAt: {type: Date, default: null},
})

const InvoiceModel = mongoose.model('Invoice', invoiceSchema)
module.exports = InvoiceModel
