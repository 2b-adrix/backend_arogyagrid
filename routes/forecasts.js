const express = require('express');
const router = express.Router();
const DemandForecast = require('../models/DemandForecast');

// GET demand forecasts
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.facilityId) filter.facilityId = req.query.facilityId;
    if (req.query.medicineId) filter.medicineId = req.query.medicineId;

    const forecasts = await DemandForecast.find(filter).sort({ dayLabel: 1 });
    res.json({
      success: true,
      message: "Demand forecasts retrieved successfully",
      data: forecasts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
