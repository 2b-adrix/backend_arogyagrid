const express = require('express');
const router = express.Router();
const InventoryBalance = require('../models/InventoryBalance');

// GET inventory balances (supports optional facilityId filter)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.facilityId) filter.facilityId = req.query.facilityId;
    if (req.query.medicineId) filter.medicineId = req.query.medicineId;

    const balances = await InventoryBalance.find(filter);
    res.json({
      success: true,
      message: "Inventory balances retrieved successfully",
      data: balances
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
