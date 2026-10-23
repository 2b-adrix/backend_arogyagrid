import csv
import os
import sys
from datetime import datetime

# Attempt to import pymongo, install if missing
try:
    from pymongo import MongoClient
except ImportError:
    print("Installing pymongo...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymongo"])
    from pymongo import MongoClient

# Database configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = "arogyagrid"

DESKTOP_PATH = os.path.dirname(os.path.abspath(__file__))

def parse_val(val, target_type):
    if val is None or val == "" or val.strip() == "":
        return None
    val = val.strip()
    try:
        if target_type == "int":
            return int(float(val))
        elif target_type == "float":
            return float(val)
        elif target_type == "bool":
            return val.lower() == "true"
        elif target_type == "date_ms":
            # Convert millisecond epoch to datetime object (or keep as int)
            ms = int(float(val))
            return datetime.fromtimestamp(ms / 1000.0)
        else:
            return str(val)
    except Exception as e:
        return val

# Dataset schema rules
FILES_CONFIG = [
    {
        "filename": "facilities(1).csv",
        "collection": "facilities",
        "types": {
            "latitude": "float",
            "longitude": "float",
            "totalBeds": "int",
            "occupiedBeds": "int",
            "updatedAt": "date_ms"
        }
    },
    {
        "filename": "medicines.csv",
        "collection": "medicines",
        "types": {
            "reorderLevel": "int",
            "leadTimeDays": "int"
        }
    },
    {
        "filename": "inventory_balances.csv",
        "collection": "inventory_balances",
        "types": {
            "closingStock": "int",
            "averageDailyConsumption": "float",
            "coverageDays": "float",
            "stockGap": "int",
            "updatedAt": "date_ms"
        }
    },
    {
        "filename": "beds_and_staff.csv",
        "collection": "beds_and_staff",
        "types": {
            "totalBeds": "int",
            "occupiedBeds": "int",
            "doctorCount": "int",
            "nurseCount": "int",
            "pharmacistCount": "int",
            "staffToBedRatio": "float",
            "updatedAt": "date_ms"
        }
    },
    {
        "filename": "risk_assessments.csv",
        "collection": "risk_assessments",
        "types": {
            "riskScore": "float",
            "daysToStockout": "int",
            "updatedAt": "date_ms"
        }
    },
    {
        "filename": "redistribution_recommendations.csv",
        "collection": "redistribution_recommendations",
        "types": {
            "recommendedQuantity": "int",
            "distanceKm": "float",
            "createdAt": "date_ms"
        }
    },
    {
        "filename": "alerts.csv",
        "collection": "alerts",
        "types": {
            "isResolved": "bool",
            "createdAt": "date_ms"
        }
    },
    {
        "filename": "demand_forecasts.csv",
        "collection": "demand_forecasts",
        "types": {
            "actualDemand": "int",
            "predictedDemand": "int",
            "lowerBound": "int",
            "upperBound": "int"
        }
    },
    {
        "filename": "audit_logs.csv",
        "collection": "audit_logs",
        "types": {
            "timestamp": "date_ms"
        }
    }
]

def main():
    uri = sys.argv[1] if len(sys.argv) > 1 else MONGO_URI
    print(f"Connecting to MongoDB at: {uri}")

    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("Connected successfully to MongoDB!")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        print("\nPlease make sure MongoDB is running locally, or pass your connection string as an argument:")
        print("  python import_to_mongodb.py \"mongodb+srv://user:password@cluster.mongodb.net/\"")
        sys.exit(1)

    db = client[DB_NAME]

    for item in FILES_CONFIG:
        filepath = os.path.join(DESKTOP_PATH, item["filename"])
        coll_name = item["collection"]
        types_map = item["types"]

        if not os.path.exists(filepath):
            print(f"Skipping {item['filename']} (File not found at {filepath})")
            continue

        print(f"Importing {item['filename']} into collection '{coll_name}'...")
        documents = []

        with open(filepath, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                doc = {}
                for key, val in row.items():
                    key = key.strip()
                    target_type = types_map.get(key, "string")
                    doc[key] = parse_val(val, target_type)
                documents.append(doc)

        if documents:
            collection = db[coll_name]
            # Clear previous collection data
            collection.delete_many({})
            # Insert new documents
            res = collection.insert_many(documents)
            print(f"  --> Successfully inserted {len(res.inserted_ids)} records into '{coll_name}'.")

    print("\nAll datasets have been imported into MongoDB successfully!")

if __name__ == "__main__":
    main()
