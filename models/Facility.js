const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  facilityId: { type: String, required: true, unique: true }, // e.g. "F-001"
  name: { type: String, required: true },
  district: { type: String, required: true },
  facilityType: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  totalBeds: { type: Number, required: true, default: 0 },
  occupiedBeds: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Facility', facilitySchema);
