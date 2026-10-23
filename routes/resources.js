const express = require('express');
const router = express.Router();
const BedsAndStaff = require('../models/BedsAndStaff');

// GET beds and staff records
router.get('/beds-staff', async (req, res) => {
  try {
    const records = await BedsAndStaff.find();
    res.json({
      success: true,
      message: "Beds and staff metrics retrieved successfully",
      data: records
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
