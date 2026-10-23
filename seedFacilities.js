require('dotenv').config();
const mongoose = require('mongoose');
const Facility = require('./models/Facility');
const Alert = require('./models/Alert');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB...');
    seedData();
  })
  .catch(err => console.error('Could not connect to MongoDB...', err));

async function seedData() {
  try {
    // Clear existing
    await Facility.deleteMany({});
    await Alert.deleteMany({});

    // Seed Facilities
    const facilities = [
        { facilityId: "FAC-001", name: "Jaipur DH 1", district: "Jaipur", facilityType: "District Hospital", latitude: 26.9124, longitude: 75.7873, totalBeds: 250, occupiedBeds: 210 },
        { facilityId: "FAC-002", name: "Jaipur PHC 1", district: "Jaipur", facilityType: "Primary Health Centre", latitude: 26.9200, longitude: 75.8000, totalBeds: 30, occupiedBeds: 28 },
        { facilityId: "FAC-003", name: "Jaipur PHC 2", district: "Jaipur", facilityType: "Primary Health Centre", latitude: 26.9500, longitude: 75.8200, totalBeds: 25, occupiedBeds: 12 },
        { facilityId: "FAC-004", name: "Jaipur DH 2", district: "Jaipur", facilityType: "District Hospital", latitude: 26.8500, longitude: 75.7500, totalBeds: 300, occupiedBeds: 280 }
    ];
    await Facility.insertMany(facilities);
    console.log("Facilities seeded.");

    // Seed Alerts
    const alerts = [
        { alertId: "ALT-001", facilityId: "FAC-002", type: "STOCKOUT_RISK", severity: "CRITICAL", title: "Critical Stockout Risk - Amoxicillin", message: "Jaipur PHC 1 will run out of Amoxicillin 500mg in 2 days." },
        { alertId: "ALT-002", facilityId: "FAC-004", type: "CAPACITY_WARNING", severity: "HIGH", title: "High Bed Occupancy: 93%", message: "Jaipur DH 2 is nearing maximum bed capacity." }
    ];
    await Alert.insertMany(alerts);
    console.log("Alerts seeded.");

    process.exit();
  } catch (err) {
    console.error("Error seeding:", err);
    process.exit(1);
  }
}