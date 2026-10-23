const mongoose = require('mongoose');

const inventoryBalanceSchema = new mongoose.Schema({
  facilityId: { type: String, required: true },
  medicineId: { type: String, required: true },
  closingStock: { type: Number, required: true },
  averageDailyConsumption: { type: Number, required: true },
  coverageDays: { type: Number, required: true },
  stockGap: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient compound query
inventoryBalanceSchema.index({ facilityId: 1, medicineId: 1 });

module.exports = mongoose.model('InventoryBalance', inventoryBalanceSchema);
