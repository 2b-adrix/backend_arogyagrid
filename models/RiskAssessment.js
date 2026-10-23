const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema({
  facilityId: { type: String, required: true },
  medicineId: { type: String, required: true },
  riskLevel: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  riskScore: { type: Number, required: true },
  daysToStockout: { type: Number, required: true },
  reason: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

riskAssessmentSchema.index({ facilityId: 1, medicineId: 1 });

module.exports = mongoose.model('RiskAssessment', riskAssessmentSchema);
