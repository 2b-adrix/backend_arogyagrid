const mongoose = require('mongoose');

const demandForecastSchema = new mongoose.Schema({
  dayLabel: { type: String, required: true },
  facilityId: { type: String, required: true },
  medicineId: { type: String, required: true },
  actualDemand: { type: Number, default: null },
  predictedDemand: { type: Number, required: true },
  lowerBound: { type: Number, required: true },
  upperBound: { type: Number, required: true }
});

demandForecastSchema.index({ facilityId: 1, medicineId: 1, dayLabel: 1 });

module.exports = mongoose.model('DemandForecast', demandForecastSchema);
