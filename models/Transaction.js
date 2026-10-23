const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  supplyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supply', required: true },
  transactionType: { type: String, enum: ['RECEIVE', 'ISSUE', 'ADJUST'], required: true },
  quantity: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);