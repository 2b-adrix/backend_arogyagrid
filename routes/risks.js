const express = require('express');
const router = express.Router();
const Supply = require('../models/Supply');

router.get('/', async (req, res) => {
  try {
    const supplies = await Supply.find();
    const risks = [];

    // We assume a constant average daily consumption for the mockup, e.g., 30.
    // In a real app, you would calculate this based on historical Transaction data.
    const averageDailyConsumption = 30;
    const defaultLeadTimeDays = 7;

    supplies.forEach(supply => {
        // Prevent division by zero
        const consumption = averageDailyConsumption > 0 ? averageDailyConsumption : 1;
        const coverageDays = supply.currentStock / consumption;

        let riskLevel = "LOW";
        let daysToStockout = coverageDays;

        if (coverageDays < defaultLeadTimeDays) {
            riskLevel = "CRITICAL";
        } else if (coverageDays < (defaultLeadTimeDays * 1.5)) {
            riskLevel = "HIGH";
        } else if (coverageDays < (defaultLeadTimeDays * 2.5)) {
            riskLevel = "MEDIUM";
        }

        // Only return items that are Medium, High, or Critical risk
        if (riskLevel !== "LOW") {
            // We use the default FAC-001 facility for this mockup
            risks.push({
                facilityId: "FAC-001",
                medicineId: supply.sku,
                riskLevel: riskLevel,
                riskScore: (defaultLeadTimeDays / (coverageDays || 0.1)) * 100, // Higher score = worse risk
                daysToStockout: Math.round(daysToStockout * 10) / 10,
                reason: `${supply.currentStock} units in stock. At ${consumption}/day, you will run out in ${Math.round(coverageDays)} days. Lead time is ${defaultLeadTimeDays} days.`,
                updatedAt: Date.now()
            });
        }
    });

    res.json({
        success: true,
        message: "Risks calculated successfully",
        data: risks
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;