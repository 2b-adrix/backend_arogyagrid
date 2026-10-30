require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const Facility = require('./models/Facility');
const Alert = require('./models/Alert');
const Supply = require('./models/Supply');
const Medicine = require('./models/Medicine');
const InventoryBalance = require('./models/InventoryBalance');
const RiskAssessment = require('./models/RiskAssessment');
const Redistribution = require('./models/Redistribution');
const DemandForecast = require('./models/DemandForecast');
const User = require('./models/User');

const DATA_DIR = "C:\\Users\\vadit\\OneDrive\\Desktop\\Full Data Set";

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas...');
    runImport();
  })
  .catch(err => {
    console.error('Could not connect to MongoDB...', err);
    process.exit(1);
  });

async function runImport() {
  try {
    console.log('Clearing existing database collections...');
    await Facility.deleteMany({});
    await Alert.deleteMany({});
    await Supply.deleteMany({});
    await Medicine.deleteMany({});
    await InventoryBalance.deleteMany({});
    await RiskAssessment.deleteMany({});
    await Redistribution.deleteMany({});
    await DemandForecast.deleteMany({});
    await User.deleteMany({});

    // 1. IMPORT FACILITIES (facilities.csv)
    console.log('\nImporting Facilities from facilities.csv...');
    const facilityFilePath = path.join(DATA_DIR, 'facilities.csv');
    const facilitiesList = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(facilityFilePath)
        .pipe(csv())
        .on('data', (row) => {
          const beds = parseInt(row.beds) || 30;
          const targetPct = parseFloat(row.avg_bed_occupancy_target_pct) || 60;
          const occupied = Math.round((beds * targetPct) / 100);

          facilitiesList.push({
            facilityId: row.facility_id,
            name: row.facility_name,
            district: row.district,
            facilityType: row.facility_type === 'PHC' ? 'Primary Health Centre' : (row.facility_type === 'DH' ? 'District Hospital' : row.facility_type),
            latitude: parseFloat(row.latitude) || 26.9124,
            longitude: parseFloat(row.longitude) || 75.7873,
            totalBeds: beds,
            occupiedBeds: occupied,
            updatedAt: Date.now()
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    await Facility.insertMany(facilitiesList);
    console.log(`✔ Imported ${facilitiesList.length} Facilities across ${[...new Set(facilitiesList.map(f => f.district))].join(', ')}.`);

    // 2. IMPORT RESOURCE RISK DEMO (resource_risk_demo.csv)
    console.log('\nImporting Risk, Inventory, Forecasts & Transfer Recommendations from resource_risk_demo.csv...');
    const riskFilePath = path.join(DATA_DIR, 'resource_risk_demo.csv');

    const suppliesMap = new Map();
    const medicinesMap = new Map();
    const balancesList = [];
    const risksList = [];
    const redistributionsList = [];
    const forecastsList = [];
    const alertsList = [];

    let rowCount = 0;
    let recCount = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream(riskFilePath)
        .pipe(csv())
        .on('data', (row) => {
          rowCount++;
          // We limit to the first ~2,000 rows to keep database import super fast & optimized
          if (rowCount > 3000) return;

          const medId = row.medicine_id || `MED-${rowCount}`;
          const medName = row.medicine_name || 'Medical Supply';
          const cat = row.medicine_category || 'Essential';
          const facId = row.facility_id;
          const stock = parseInt(row.current_stock) || 0;
          const reorder = parseInt(row.reorder_level) || 50;
          const daysCover = parseFloat(row.days_of_cover) || 10;
          const riskLevel = row.risk_level || 'LOW';
          const riskScore = parseFloat(row.risk_score) || 10;

          // Master Supplies / Catalog
          if (!suppliesMap.has(medId)) {
            suppliesMap.set(medId, {
              sku: medId,
              name: medName,
              category: cat,
              unit: 'Units',
              currentStock: stock,
              minimumStockLevel: reorder
            });
            medicinesMap.set(medId, {
              medicineId: medId,
              name: medName,
              category: cat,
              unit: 'Units',
              criticalityLevel: riskLevel,
              reorderLevel: reorder,
              leadTimeDays: parseInt(row.supplier_lead_time_days) || 7
            });
          }

          // Inventory Balances per facility
          balancesList.push({
            facilityId: facId,
            medicineId: medId,
            closingStock: stock,
            averageDailyConsumption: parseFloat(row.avg_daily_consumption_7d) || 5,
            coverageDays: daysCover,
            stockGap: parseInt(row.stock_gap_7d) || 0,
            updatedAt: Date.now()
          });

          // Risk Assessments
          if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH' || riskLevel === 'MEDIUM') {
            risksList.push({
              facilityId: facId,
              medicineId: medId,
              riskLevel: riskLevel,
              riskScore: riskScore,
              daysToStockout: Math.round(daysCover * 10) / 10,
              reason: `Current stock is ${stock} units. Coverage: ${Math.round(daysCover)} days vs lead time. Recommended action: ${row.recommended_action || 'REORDER'}.`,
              updatedAt: Date.now()
            });
          }

          // Alerts for Critical/High Stockouts
          if ((riskLevel === 'CRITICAL' || riskLevel === 'HIGH') && alertsList.length < 10) {
            alertsList.push({
              alertId: `ALT-${String(alertsList.length + 1).padStart(3, '0')}`,
              facilityId: facId,
              type: 'STOCKOUT_RISK',
              severity: riskLevel,
              title: `${riskLevel} Shortage: ${medName}`,
              message: `${row.district || 'District'} facility ${facId} stock coverage is ${Math.round(daysCover)} days. Immediate replenishment needed.`,
              isResolved: false
            });
          }

          // Redistribution Recommendations
          const transferQty = parseInt(row.recommended_transfer_qty) || 0;
          if (transferQty > 0 && row.candidate_source_facility_id) {
            recCount++;
            redistributionsList.push({
              recommendationId: `REC-${String(recCount).padStart(3, '0')}`,
              medicineId: medId,
              sourceFacilityId: row.candidate_source_facility_id,
              destinationFacilityId: facId,
              recommendedQuantity: transferQty,
              distanceKm: parseFloat(row.candidate_distance_km) || 12.0,
              status: 'PENDING_APPROVAL',
              reason: `Transfer ${transferQty} units of ${medName} from surplus facility ${row.candidate_source_facility_id} to ${facId}.`
            });
          }

          // Demand Forecasts
          if (forecastsList.length < 50) {
            forecastsList.push({
              dayLabel: row.date || 'Day 1',
              facilityId: facId,
              medicineId: medId,
              actualDemand: parseInt(row.avg_daily_consumption_7d) || 10,
              predictedDemand: parseInt(row.predicted_demand_7d) || 12,
              lowerBound: Math.max(0, (parseInt(row.predicted_demand_7d) || 12) - 5),
              upperBound: (parseInt(row.predicted_demand_7d) || 12) + 10
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    await Supply.insertMany([...suppliesMap.values()]);
    await Medicine.insertMany([...medicinesMap.values()]);
    await InventoryBalance.insertMany(balancesList);
    await RiskAssessment.insertMany(risksList);
    await Alert.insertMany(alertsList);
    await Redistribution.insertMany(redistributionsList);
    await DemandForecast.insertMany(forecastsList);

    // 3. SEED DEFAULT COMMAND CENTER USERS
    const users = [
      { userId: "USR-001", username: "officer_jaipur", fullName: "Jaipur District Officer", role: "DISTRICT_OFFICER", district: "Jaipur" },
      { userId: "USR-002", username: "manager_phc1", fullName: "PHC 1 Facility Manager", role: "FACILITY_MANAGER", district: "Jaipur", facilityId: "RJ001" }
    ];
    await User.insertMany(users);

    console.log(`\n🎉 ENHANCED FULL DATASET IMPORT COMPLETE!`);
    console.log(`• Facilities: ${facilitiesList.length} across 6 Rajasthan districts`);
    console.log(`• Master Medicines & Supplies: ${suppliesMap.size}`);
    console.log(`• Inventory Balances: ${balancesList.length}`);
    console.log(`• Risk Assessments: ${risksList.length}`);
    console.log(`• System Alerts: ${alertsList.length}`);
    console.log(`• Redistribution Transfer Recommendations: ${redistributionsList.length}`);
    console.log(`• Demand Forecasts: ${forecastsList.length}`);

    process.exit(0);
  } catch (err) {
    console.error('Error importing full dataset:', err);
    process.exit(1);
  }
}