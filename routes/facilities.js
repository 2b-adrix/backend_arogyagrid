const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const Alert = require('../models/Alert');

// GET all facilities
router.get('/', async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.json({
        success: true,
        message: "Facilities retrieved successfully",
        data: facilities
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST Register new Health Facility / PHC / Hospital
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      district,
      facilityType,
      latitude,
      longitude,
      totalBeds,
      occupiedBeds
    } = req.body;

    const count = await Facility.countDocuments();
    const facilityId = `FAC-${String(count + 1).padStart(3, '0')}`;

    const newFacility = new Facility({
      facilityId,
      name: name || "New Health Centre",
      district: district || "Jaipur",
      facilityType: facilityType || "Primary Health Centre",
      latitude: parseFloat(latitude) || 26.9124,
      longitude: parseFloat(longitude) || 75.7873,
      totalBeds: parseInt(totalBeds) || 20,
      occupiedBeds: parseInt(occupiedBeds) || 5,
      updatedAt: Date.now()
    });

    await newFacility.save();

    res.status(201).json({
      success: true,
      message: `Facility '${newFacility.name}' (${facilityId}) successfully registered on ArogyaGrid!`,
      data: newFacility
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET active alerts
router.get('/alerts', async (req, res) => {
    try {
      const alerts = await Alert.find({ isResolved: false });
      res.json({
          success: true,
          message: "Alerts retrieved successfully",
          data: alerts
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;