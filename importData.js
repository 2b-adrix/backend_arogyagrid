require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const Supply = require('./models/Supply'); // Import our schema

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB...');
    importData(); // Start importing once connected
  })
  .catch(err => console.error('Could not connect to MongoDB...', err));

function importData() {
  const results = [];

  // 2. Read the CSV file
  fs.createReadStream('supplies.csv')
    .pipe(csv())
    .on('data', (data) => {
        // Convert strings to numbers where necessary
        results.push({
            sku: data.sku,
            name: data.name,
            category: data.category,
            unit: data.unit,
            currentStock: parseInt(data.currentStock),
            minimumStockLevel: parseInt(data.minimumStockLevel)
        });
    })
    .on('end', async () => {
      try {
        console.log(`Read ${results.length} items from CSV.`);

        // 3. Clear existing data (optional, but good for starting fresh)
        await Supply.deleteMany({});
        console.log('Cleared existing supplies.');

        // 4. Insert the new data
        await Supply.insertMany(results);
        console.log('Successfully imported all data into MongoDB!');

        process.exit(); // Close the script
      } catch (err) {
        console.error('Error importing data:', err);
        process.exit(1);
      }
    });
}