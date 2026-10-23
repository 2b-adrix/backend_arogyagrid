const express = require('express');
const router = express.Router();
const Redistribution = require('../models/Redistribution');

// GET all pending recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await Redistribution.find({ status: 'PENDING_APPROVAL' });
    res.json({
        success: true,
        message: "Recommendations retrieved successfully",
        data: recommendations
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST approve recommendation
router.post('/:id/approve', async (req, res) => {
    try {
        const rec = await Redistribution.findOne({ recommendationId: req.params.id });
        if (!rec) {
            return res.status(404).json({ success: false, message: 'Recommendation not found' });
        }

        rec.status = 'APPROVED';
        await rec.save();

        res.json({
            success: true,
            message: "Redistribution recommendation approved",
            data: true
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST reject recommendation
router.post('/:id/reject', async (req, res) => {
    try {
        const rec = await Redistribution.findOne({ recommendationId: req.params.id });
        if (!rec) {
            return res.status(404).json({ success: false, message: 'Recommendation not found' });
        }

        rec.status = 'REJECTED';
        await rec.save();

        res.json({
            success: true,
            message: "Redistribution recommendation rejected",
            data: true
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;