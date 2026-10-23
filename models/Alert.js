const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertId: { type: String, required: true, unique: true }, // e.g. "ALT-2026-0001"
  facilityId: { type: String, required: true },
  type: { type: String, required: true },
  severity: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isResolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
