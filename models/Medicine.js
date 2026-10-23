const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  medicineId: { type: String, required: true, unique: true }, // maps from 'id' e.g. "M-101"
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  criticalityLevel: { type: String, required: true },
  reorderLevel: { type: Number, default: 0 },
  leadTimeDays: { type: Number, default: 0 }
});

module.exports = mongoose.model('Medicine', medicineSchema);
