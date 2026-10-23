require('dotenv').config();
const mongoose = require('mongoose');
const Redistribution = require('./models/Redistribution');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB...');
    seedData();
  })
  .catch(err => console.error('Could not connect to MongoDB...', err));

async function seedData() {
  try {
    // Clear existing
    await Redistribution.deleteMany({});

    // Seed Data
    const recommendations = [
        {
            recommendationId: "REC-001",
            medicineId: "MED-001", // Paracetamol
            sourceFacilityId: "FAC-001", // Jaipur DH 1
            destinationFacilityId: "FAC-002", // Jaipur PHC 1
            recommendedQuantity: 300,
            distanceKm: 12.5,
            status: "PENDING_APPROVAL",
            reason: "Transfer 300 units of Paracetamol from Jaipur DH 1 (abundant stock) to Jaipur PHC 1 to mitigate critical shortage."
        },
        {
            recommendationId: "REC-002",
            medicineId: "PPE-001", // N95 Masks
            sourceFacilityId: "FAC-004", // Jaipur DH 2
            destinationFacilityId: "FAC-003", // Jaipur PHC 2
            recommendedQuantity: 100,
            distanceKm: 8.2,
            status: "PENDING_APPROVAL",
            reason: "Transfer 100 N95 Masks to Jaipur PHC 2 due to upcoming seasonal demand spike."
        }
    ];

    await Redistribution.insertMany(recommendations);
    console.log("Redistribution recommendations seeded.");

    process.exit();
  } catch (err) {
    console.error("Error seeding:", err);
    process.exit(1);
  }
}