require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');

const Facility = require('./models/Facility');
const Alert = require('./models/Alert');
const Supply = require('./models/Supply');
const Redistribution = require('./models/Redistribution');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas...');
    runSeed();
  })
  .catch(err => {
    console.error('Could not connect to MongoDB...', err);
    process.exit(1);
  });

async function runSeed() {
  try {
    console.log('Clearing existing data...');
    await Facility.deleteMany({});
    await Alert.deleteMany({});
    await Supply.deleteMany({});
    await Redistribution.deleteMany({});
    await User.deleteMany({});

    // 1. Seed Facilities
    const facilities = [
        { facilityId: "FAC-001", name: "Jaipur DH 1", district: "Jaipur", facilityType: "District Hospital", latitude: 26.9124, longitude: 75.7873, totalBeds: 250, occupiedBeds: 210 },
        { facilityId: "FAC-002", name: "Jaipur PHC 1", district: "Jaipur", facilityType: "Primary Health Centre", latitude: 26.9200, longitude: 75.8000, totalBeds: 30, occupiedBeds: 28 },
        { facilityId: "FAC-003", name: "Jaipur PHC 2", district: "Jaipur", facilityType: "Primary Health Centre", latitude: 26.9500, longitude: 75.8200, totalBeds: 25, occupiedBeds: 12 },
        { facilityId: "FAC-004", name: "Jaipur DH 2", district: "Jaipur", facilityType: "District Hospital", latitude: 26.8500, longitude: 75.7500, totalBeds: 300, occupiedBeds: 280 }
    ];
    await Facility.insertMany(facilities);
    console.log('✔ Facilities seeded.');

    // 2. Seed Alerts
    const alerts = [
        { alertId: "ALT-001", facilityId: "FAC-002", type: "STOCKOUT_RISK", severity: "CRITICAL", title: "Critical Stockout Risk - Amoxicillin", message: "Jaipur PHC 1 will run out of Amoxicillin 500mg in 2 days." },
        { alertId: "ALT-002", facilityId: "FAC-004", type: "CAPACITY_WARNING", severity: "HIGH", title: "High Bed Occupancy: 93%", message: "Jaipur DH 2 is nearing maximum bed capacity." }
    ];
    await Alert.insertMany(alerts);
    console.log('✔ Alerts seeded.');

    // 3. Seed Supplies from CSV
    const supplies = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream('supplies.csv')
          .pipe(csv())
          .on('data', (data) => {
              supplies.push({
                  sku: data.sku,
                  name: data.name,
                  category: data.category,
                  unit: data.unit,
                  currentStock: parseInt(data.currentStock) || 0,
                  minimumStockLevel: parseInt(data.minimumStockLevel) || 10
              });
          })
          .on('end', resolve)
          .on('error', reject);
    });
    await Supply.insertMany(supplies);
    console.log(`✔ Supplies seeded (${supplies.length} items from CSV).`);

    // 4. Seed Redistribution
    const redistributions = [
        {
            recommendationId: "REC-001",
            medicineId: "MED-001",
            sourceFacilityId: "FAC-001",
            destinationFacilityId: "FAC-002",
            recommendedQuantity: 300,
            distanceKm: 12.5,
            status: "PENDING_APPROVAL",
            reason: "Transfer 300 units of Paracetamol from Jaipur DH 1 to Jaipur PHC 1 to mitigate critical shortage."
        },
        {
            recommendationId: "REC-002",
            medicineId: "PPE-001",
            sourceFacilityId: "FAC-004",
            destinationFacilityId: "FAC-003",
            recommendedQuantity: 100,
            distanceKm: 8.2,
            status: "PENDING_APPROVAL",
            reason: "Transfer 100 N95 Masks to Jaipur PHC 2 due to upcoming seasonal demand spike."
        }
    ];
    await Redistribution.insertMany(redistributions);
    console.log('✔ Redistribution recommendations seeded.');

    // 5. Seed Users
    const users = [
        { userId: "USR-001", username: "officer_jaipur", fullName: "Jaipur District Officer", role: "DISTRICT_OFFICER", district: "Jaipur" },
        { userId: "USR-002", username: "manager_phc1", fullName: "PHC 1 Facility Manager", role: "FACILITY_MANAGER", district: "Jaipur", facilityId: "FAC-002" }
    ];
    await User.insertMany(users);
    console.log('✔ Users seeded.');

    console.log('\n🎉 ALL DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}