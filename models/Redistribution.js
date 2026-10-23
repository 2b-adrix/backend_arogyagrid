const mongoose = require('mongoose');

const redistributionSchema = new mongoose.Schema({
  recommendationId: { type: String, required: true, unique: true }, // e.g. "REC-2026-001"
  medicineId: { type: String, required: true },
  sourceFacilityId: { type: String, required: true },
  destinationFacilityId: { type: String, required: true },
  recommendedQuantity: { type: Number, required: true },
  distanceKm: { type: Number, default: 0 },
  status: { type: String, default: 'PENDING_APPROVAL' },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Redistribution', redistributionSchema);
