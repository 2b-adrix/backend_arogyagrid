require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const Facility = require('./models/Facility');
const Medicine = require('./models/Medicine');
const InventoryBalance = require('./models/InventoryBalance');
const RiskAssessment = require('./models/RiskAssessment');
const Alert = require('./models/Alert');
const Redistribution = require('./models/Redistribution');
const BedsAndStaff = require('./models/BedsAndStaff');
const DemandForecast = require('./models/DemandForecast');
const AuditLog = require('./models/AuditLog');
const User = require('./models/User');

const parseCsv = (filePath, transformRow) => {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return resolve([]);
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (rawRow) => {
        // Strip UTF-8 BOM (\uFEFF) and whitespace from header keys
        const row = {};
        for (const key of Object.keys(rawRow)) {
          const cleanKey = key.replace(/^\uFEFF/, '').trim();
          row[cleanKey] = rawRow[key];
        }
        const transformed = transformRow(row);
        if (transformed) results.push(transformed);
      })
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

async function seedAllCsv() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas / Local successfully.');

    console.log('\nClearing existing collection data...');
    await Promise.all([
      Facility.deleteMany({}),
      Medicine.deleteMany({}),
      InventoryBalance.deleteMany({}),
      RiskAssessment.deleteMany({}),
      Alert.deleteMany({}),
      Redistribution.deleteMany({}),
      BedsAndStaff.deleteMany({}),
      DemandForecast.deleteMany({}),
      AuditLog.deleteMany({}),
      User.deleteMany({})
    ]);

    console.log('✔ Collections cleared.');

    // 1. Facilities (facilities(1).csv)
    console.log('\nImporting facilities(1).csv...');
    const facilities = await parseCsv(path.join(__dirname, 'facilities(1).csv'), (row) => ({
      facilityId: row.id || row.facilityId,
      name: row.name,
      district: row.district,
      facilityType: row.facilityType,
      latitude: parseFloat(row.latitude) || 0,
      longitude: parseFloat(row.longitude) || 0,
      totalBeds: parseInt(row.totalBeds, 10) || 0,
      occupiedBeds: parseInt(row.occupiedBeds, 10) || 0,
      updatedAt: row.updatedAt ? new Date(parseInt(row.updatedAt, 10)) : new Date()
    }));
    if (facilities.length) await Facility.insertMany(facilities);
    console.log(`✔ Facilities seeded (${facilities.length} records).`);

    // 2. Medicines (medicines.csv)
    console.log('Importing medicines.csv...');
    const medicines = await parseCsv(path.join(__dirname, 'medicines.csv'), (row) => ({
      medicineId: row.id || row.medicineId,
      name: row.name,
      category: row.category,
      unit: row.unit,
      criticalityLevel: row.criticalityLevel,
      reorderLevel: parseInt(row.reorderLevel, 10) || 0,
      leadTimeDays: parseInt(row.leadTimeDays, 10) || 0
    }));
    if (medicines.length) await Medicine.insertMany(medicines);
    console.log(`✔ Medicines seeded (${medicines.length} records).`);

    // 3. Inventory Balances (inventory_balances.csv)
    console.log('Importing inventory_balances.csv...');
    const balances = await parseCsv(path.join(__dirname, 'inventory_balances.csv'), (row) => ({
      facilityId: row.facilityId,
      medicineId: row.medicineId,
      closingStock: parseInt(row.closingStock, 10) || 0,
      averageDailyConsumption: parseFloat(row.averageDailyConsumption) || 0,
      coverageDays: parseFloat(row.coverageDays) || 0,
      stockGap: parseInt(row.stockGap, 10) || 0,
      updatedAt: row.updatedAt ? new Date(parseInt(row.updatedAt, 10)) : new Date()
    }));
    if (balances.length) await InventoryBalance.insertMany(balances);
    console.log(`✔ Inventory balances seeded (${balances.length} records).`);

    // 4. Beds & Staff (beds_and_staff.csv)
    console.log('Importing beds_and_staff.csv...');
    const bedsStaff = await parseCsv(path.join(__dirname, 'beds_and_staff.csv'), (row) => ({
      facilityId: row.facilityId,
      totalBeds: parseInt(row.totalBeds, 10) || 0,
      occupiedBeds: parseInt(row.occupiedBeds, 10) || 0,
      doctorCount: parseInt(row.doctorCount, 10) || 0,
      nurseCount: parseInt(row.nurseCount, 10) || 0,
      pharmacistCount: parseInt(row.pharmacistCount, 10) || 0,
      staffToBedRatio: parseFloat(row.staffToBedRatio) || 0,
      updatedAt: row.updatedAt ? new Date(parseInt(row.updatedAt, 10)) : new Date()
    }));
    if (bedsStaff.length) await BedsAndStaff.insertMany(bedsStaff);
    console.log(`✔ Beds & staff seeded (${bedsStaff.length} records).`);

    // 5. Risk Assessments (risk_assessments.csv)
    console.log('Importing risk_assessments.csv...');
    const risks = await parseCsv(path.join(__dirname, 'risk_assessments.csv'), (row) => ({
      facilityId: row.facilityId,
      medicineId: row.medicineId,
      riskLevel: row.riskLevel,
      riskScore: parseFloat(row.riskScore) || 0,
      daysToStockout: parseInt(row.daysToStockout, 10) || 0,
      reason: row.reason,
      updatedAt: row.updatedAt ? new Date(parseInt(row.updatedAt, 10)) : new Date()
    }));
    if (risks.length) await RiskAssessment.insertMany(risks);
    console.log(`✔ Risk assessments seeded (${risks.length} records).`);

    // 6. Redistribution Recommendations (redistribution_recommendations.csv)
    console.log('Importing redistribution_recommendations.csv...');
    const redist = await parseCsv(path.join(__dirname, 'redistribution_recommendations.csv'), (row) => ({
      recommendationId: row.id || row.recommendationId,
      medicineId: row.medicineId,
      sourceFacilityId: row.sourceFacilityId,
      destinationFacilityId: row.destinationFacilityId,
      recommendedQuantity: parseInt(row.recommendedQuantity, 10) || 0,
      distanceKm: parseFloat(row.distanceKm) || 0,
      status: row.status || 'PENDING_APPROVAL',
      reason: row.reason,
      createdAt: row.createdAt ? new Date(parseInt(row.createdAt, 10)) : new Date()
    }));
    if (redist.length) await Redistribution.insertMany(redist);
    console.log(`✔ Redistribution recommendations seeded (${redist.length} records).`);

    // 7. Alerts (alerts.csv)
    console.log('Importing alerts.csv...');
    const alerts = await parseCsv(path.join(__dirname, 'alerts.csv'), (row) => ({
      alertId: row.id || row.alertId,
      facilityId: row.facilityId,
      type: row.type,
      severity: row.severity,
      title: row.title,
      message: row.message,
      isResolved: row.isResolved === 'true',
      createdAt: row.createdAt ? new Date(parseInt(row.createdAt, 10)) : new Date()
    }));
    if (alerts.length) await Alert.insertMany(alerts);
    console.log(`✔ Alerts seeded (${alerts.length} records).`);

    // 8. Demand Forecasts (demand_forecasts.csv)
    console.log('Importing demand_forecasts.csv...');
    const forecasts = await parseCsv(path.join(__dirname, 'demand_forecasts.csv'), (row) => ({
      dayLabel: row.dayLabel,
      facilityId: row.facilityId,
      medicineId: row.medicineId,
      actualDemand: row.actualDemand ? parseInt(row.actualDemand, 10) : null,
      predictedDemand: parseInt(row.predictedDemand, 10) || 0,
      lowerBound: parseInt(row.lowerBound, 10) || 0,
      upperBound: parseInt(row.upperBound, 10) || 0
    }));
    if (forecasts.length) await DemandForecast.insertMany(forecasts);
    console.log(`✔ Demand forecasts seeded (${forecasts.length} records).`);

    // 9. Audit Logs (audit_logs.csv)
    console.log('Importing audit_logs.csv...');
    const auditLogs = await parseCsv(path.join(__dirname, 'audit_logs.csv'), (row) => ({
      logId: row.logId || row.id,
      timestamp: row.timestamp ? new Date(parseInt(row.timestamp, 10)) : new Date(),
      actionType: row.actionType,
      performedBy: row.performedBy,
      details: row.details
    }));
    if (auditLogs.length) await AuditLog.insertMany(auditLogs);
    console.log(`✔ Audit logs seeded (${auditLogs.length} records).`);

    // 10. Default Administrative Users
    console.log('Creating default users...');
    const users = [
      { userId: "USR-001", username: "officer_jaipur", fullName: "Jaipur District Officer", role: "DISTRICT_OFFICER", district: "Jaipur" },
      { userId: "USR-002", username: "manager_phc1", fullName: "PHC 1 Facility Manager", role: "FACILITY_MANAGER", district: "Jaipur", facilityId: "F-003" },
      { userId: "USR-003", username: "state_admin", fullName: "State Admin Officer", role: "STATE_ADMIN", district: "All" }
    ];
    await User.insertMany(users);
    console.log('✔ Administrative users created.');

    console.log('\n🎉 ALL 9 CSV DATASETS COMPLETED IMPORTING TO MONGODB SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Error during CSV seeding:', err);
    process.exit(1);
  }
}

seedAllCsv();
