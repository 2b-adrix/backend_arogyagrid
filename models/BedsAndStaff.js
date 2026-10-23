const mongoose = require('mongoose');

const bedsAndStaffSchema = new mongoose.Schema({
  facilityId: { type: String, required: true, unique: true },
  totalBeds: { type: Number, required: true },
  occupiedBeds: { type: Number, required: true },
  doctorCount: { type: Number, required: true },
  nurseCount: { type: Number, required: true },
  pharmacistCount: { type: Number, required: true },
  staffToBedRatio: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BedsAndStaff', bedsAndStaffSchema);
