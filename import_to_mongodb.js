const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let MongoClient;
try {
  MongoClient = require('mongodb').MongoClient;
} catch (e) {
  console.log('Installing mongodb driver...');
  execSync('npm install mongodb', { stdio: 'inherit' });
  MongoClient = require('mongodb').MongoClient;
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const DB_NAME = 'arogyagrid';
const DESKTOP_PATH = __dirname;

const FILES_CONFIG = [
  {
    filename: 'facilities(1).csv',
    collection: 'facilities',
    types: { latitude: 'float', longitude: 'float', totalBeds: 'int', occupiedBeds: 'int', updatedAt: 'date_ms' }
  },
  {
    filename: 'medicines.csv',
    collection: 'medicines',
    types: { reorderLevel: 'int', leadTimeDays: 'int' }
  },
  {
    filename: 'inventory_balances.csv',
    collection: 'inventory_balances',
    types: { closingStock: 'int', averageDailyConsumption: 'float', coverageDays: 'float', stockGap: 'int', updatedAt: 'date_ms' }
  },
  {
    filename: 'beds_and_staff.csv',
    collection: 'beds_and_staff',
    types: { totalBeds: 'int', occupiedBeds: 'int', doctorCount: 'int', nurseCount: 'int', pharmacistCount: 'int', staffToBedRatio: 'float', updatedAt: 'date_ms' }
  },
  {
    filename: 'risk_assessments.csv',
    collection: 'risk_assessments',
    types: { riskScore: 'float', daysToStockout: 'int', updatedAt: 'date_ms' }
  },
  {
    filename: 'redistribution_recommendations.csv',
    collection: 'redistribution_recommendations',
    types: { recommendedQuantity: 'int', distanceKm: 'float', createdAt: 'date_ms' }
  },
  {
    filename: 'alerts.csv',
    collection: 'alerts',
    types: { isResolved: 'bool', createdAt: 'date_ms' }
  },
  {
    filename: 'demand_forecasts.csv',
    collection: 'demand_forecasts',
    types: { actualDemand: 'int', predictedDemand: 'int', lowerBound: 'int', upperBound: 'int' }
  },
  {
    filename: 'audit_logs.csv',
    collection: 'audit_logs',
    types: { timestamp: 'date_ms' }
  }
];

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseVal(val, targetType) {
  if (val === undefined || val === null || val.trim() === '') return null;
  val = val.trim().replace(/^"|"$/g, '');
  if (targetType === 'int') return parseInt(val, 10);
  if (targetType === 'float') return parseFloat(val);
  if (targetType === 'bool') return val.toLowerCase() === 'true';
  if (targetType === 'date_ms') return new Date(parseInt(val, 10));
  return val;
}

async function run() {
  const uri = process.argv[2] || MONGO_URI;
  console.log(`Connecting to MongoDB at: ${uri}`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected successfully to MongoDB!');
    const db = client.db(DB_NAME);

    for (const item of FILES_CONFIG) {
      const filePath = path.join(DESKTOP_PATH, item.filename);
      if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${item.filename} (File not found)`);
        continue;
      }

      console.log(`Importing ${item.filename} into collection '${item.collection}'...`);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) continue;

      const headers = parseCsvLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
      const documents = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        const doc = {};
        headers.forEach((header, idx) => {
          const type = item.types[header] || 'string';
          doc[header] = parseVal(values[idx], type);
        });
        documents.push(doc);
      }

      if (documents.length > 0) {
        const collection = db.collection(item.collection);
        await collection.deleteMany({});
        const res = await collection.insertMany(documents);
        console.log(`  --> Successfully inserted ${res.insertedCount} records into '${item.collection}'.`);
      }
    }

    console.log('\nAll datasets have been imported into MongoDB successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
}

run();
