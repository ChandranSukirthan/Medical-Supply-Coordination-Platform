"""
seed.py — Seeds the MongoDB database with sample data.

Run once to populate the collections:
    python seed.py

Safe to run multiple times — clears existing data before inserting.

Collections created:
    hospitals   — 10 Sri Lankan hospital records
    inventory   — 15 medicine stock records (covers all test edge cases)
    requests    — 10 medicine requests (open + cancelled)
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URL, MONGODB_DB_NAME, COLLECTION_HOSPITALS, COLLECTION_INVENTORY, COLLECTION_REQUESTS

# ─── Sample Data ──────────────────────────────────────────────────────────────

HOSPITALS = [
    {"hospitalId": "H001", "name": "Colombo National Hospital",      "location": "Colombo",     "province": "Western"},
    {"hospitalId": "H002", "name": "Kandy Teaching Hospital",        "location": "Kandy",       "province": "Central"},
    {"hospitalId": "H003", "name": "Galle Base Hospital",            "location": "Galle",       "province": "Southern"},
    {"hospitalId": "H004", "name": "Jaffna Teaching Hospital",       "location": "Jaffna",      "province": "Northern"},
    {"hospitalId": "H005", "name": "Negombo District Hospital",      "location": "Negombo",     "province": "Western"},
    {"hospitalId": "H006", "name": "Kurunegala District Hospital",   "location": "Kurunegala",  "province": "North Western"},
    {"hospitalId": "H007", "name": "Anuradhapura Teaching Hospital", "location": "Anuradhapura","province": "North Central"},
    {"hospitalId": "H008", "name": "Batticaloa Teaching Hospital",   "location": "Batticaloa",  "province": "Eastern"},
    {"hospitalId": "H009", "name": "Ratnapura District Hospital",    "location": "Ratnapura",   "province": "Sabaragamuwa"},
    {"hospitalId": "H010", "name": "Matara District Hospital",       "location": "Matara",      "province": "Southern"},
]

INVENTORY = [
    {"stockId": "STK001", "hospitalId": "H001", "medicine": "Insulin",      "quantity": 120, "location": "Colombo",     "province": "Western",       "expiryDate": "2027-02-10", "status": "available"},
    {"stockId": "STK002", "hospitalId": "H002", "medicine": "Insulin",      "quantity": 60,  "location": "Kandy",       "province": "Central",       "expiryDate": "2027-01-15", "status": "available"},
    {"stockId": "STK003", "hospitalId": "H003", "medicine": "Paracetamol",  "quantity": 500, "location": "Galle",       "province": "Southern",      "expiryDate": "2026-11-20", "status": "available"},
    {"stockId": "STK004", "hospitalId": "H004", "medicine": "Amoxicillin",  "quantity": 200, "location": "Jaffna",      "province": "Northern",      "expiryDate": "2026-12-05", "status": "available"},
    {"stockId": "STK005", "hospitalId": "H005", "medicine": "Metformin",    "quantity": 300, "location": "Negombo",     "province": "Western",       "expiryDate": "2027-03-30", "status": "available"},
    {"stockId": "STK006", "hospitalId": "H006", "medicine": "Insulin",      "quantity": 0,   "location": "Kurunegala",  "province": "North Western", "expiryDate": "2027-04-01", "status": "available"},
    {"stockId": "STK007", "hospitalId": "H007", "medicine": "Paracetamol",  "quantity": 150, "location": "Anuradhapura","province": "North Central", "expiryDate": "2026-09-03", "status": "available"},
    {"stockId": "STK008", "hospitalId": "H008", "medicine": "Amoxicillin",  "quantity": 80,  "location": "Batticaloa",  "province": "Eastern",       "expiryDate": "2027-06-15", "status": "available"},
    {"stockId": "STK009", "hospitalId": "H009", "medicine": "Insulin",      "quantity": 40,  "location": "Ratnapura",   "province": "Sabaragamuwa",  "expiryDate": "2026-10-20", "status": "available"},
    {"stockId": "STK010", "hospitalId": "H010", "medicine": "Metformin",    "quantity": 100, "location": "Matara",      "province": "Southern",      "expiryDate": "2027-05-01", "status": "available"},
    {"stockId": "STK011", "hospitalId": "H001", "medicine": "Paracetamol",  "quantity": 800, "location": "Colombo",     "province": "Western",       "expiryDate": "2027-08-10", "status": "available"},
    {"stockId": "STK012", "hospitalId": "H002", "medicine": "Amoxicillin",  "quantity": 250, "location": "Kandy",       "province": "Central",       "expiryDate": "2027-07-22", "status": "available"},
    {"stockId": "STK013", "hospitalId": "H003", "medicine": "Insulin",      "quantity": 75,  "location": "Galle",       "province": "Southern",      "expiryDate": "2027-09-10", "status": "unavailable"},
    {"stockId": "STK014", "hospitalId": "H005", "medicine": "Insulin",      "quantity": 90,  "location": "Negombo",     "province": "Western",       "expiryDate": "2026-10-01", "status": "available"},
    {"stockId": "STK015", "hospitalId": "H004", "medicine": "Metformin",    "quantity": 50,  "location": "Jaffna",      "province": "Northern",      "expiryDate": "2027-01-10", "status": "available"},
]

REQUESTS = [
    {"requestId": "REQ001", "hospitalId": "H010", "medicine": "Insulin",     "quantity": 80,  "urgency": "HIGH",   "location": "Matara",      "province": "Southern",      "requiredBy": "2026-09-15", "status": "open"},
    {"requestId": "REQ002", "hospitalId": "H004", "medicine": "Insulin",     "quantity": 200, "urgency": "MEDIUM", "location": "Jaffna",      "province": "Northern",      "requiredBy": "2026-09-25", "status": "open"},
    {"requestId": "REQ003", "hospitalId": "H007", "medicine": "Paracetamol", "quantity": 300, "urgency": "LOW",    "location": "Anuradhapura","province": "North Central", "requiredBy": "2026-10-01", "status": "open"},
    {"requestId": "REQ004", "hospitalId": "H008", "medicine": "Amoxicillin", "quantity": 100, "urgency": "HIGH",   "location": "Batticaloa",  "province": "Eastern",       "requiredBy": "2026-09-12", "status": "open"},
    {"requestId": "REQ005", "hospitalId": "H009", "medicine": "Metformin",   "quantity": 150, "urgency": "MEDIUM", "location": "Ratnapura",   "province": "Sabaragamuwa",  "requiredBy": "2026-09-20", "status": "open"},
    {"requestId": "REQ006", "hospitalId": "H006", "medicine": "Insulin",     "quantity": 50,  "urgency": "HIGH",   "location": "Kurunegala",  "province": "North Western", "requiredBy": "2026-09-10", "status": "open"},
    {"requestId": "REQ007", "hospitalId": "H003", "medicine": "Paracetamol", "quantity": 400, "urgency": "MEDIUM", "location": "Galle",       "province": "Southern",      "requiredBy": "2026-09-18", "status": "open"},
    {"requestId": "REQ008", "hospitalId": "H005", "medicine": "Amoxicillin", "quantity": 60,  "urgency": "LOW",    "location": "Negombo",     "province": "Western",       "requiredBy": "2026-10-05", "status": "open"},
    {"requestId": "REQ009", "hospitalId": "H002", "medicine": "Insulin",     "quantity": 30,  "urgency": "HIGH",   "location": "Kandy",       "province": "Central",       "requiredBy": "2026-09-08", "status": "cancelled"},
    {"requestId": "REQ010", "hospitalId": "H001", "medicine": "Metformin",   "quantity": 200, "urgency": "LOW",    "location": "Colombo",     "province": "Western",       "requiredBy": "2026-10-15", "status": "open"},
]


# ─── Seeder ────────────────────────────────────────────────────────────────────

async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB_NAME]

    print(f"\n[SEED] Seeding database: '{MONGODB_DB_NAME}'\n")

    # Hospitals
    await db[COLLECTION_HOSPITALS].drop()
    await db[COLLECTION_HOSPITALS].insert_many(HOSPITALS)
    print(f"  [OK] hospitals    -> {len(HOSPITALS)} records inserted")

    # Create unique index on hospitalId
    await db[COLLECTION_HOSPITALS].create_index("hospitalId", unique=True)

    # Inventory
    await db[COLLECTION_INVENTORY].drop()
    await db[COLLECTION_INVENTORY].insert_many(INVENTORY)
    print(f"  [OK] inventory    -> {len(INVENTORY)} records inserted")

    # Create indexes for common queries
    await db[COLLECTION_INVENTORY].create_index("stockId", unique=True)
    await db[COLLECTION_INVENTORY].create_index([("medicine", 1), ("status", 1)])

    # Requests
    await db[COLLECTION_REQUESTS].drop()
    await db[COLLECTION_REQUESTS].insert_many(REQUESTS)
    print(f"  [OK] requests     -> {len(REQUESTS)} records inserted")

    # Create indexes
    await db[COLLECTION_REQUESTS].create_index("requestId", unique=True)
    await db[COLLECTION_REQUESTS].create_index([("medicine", 1), ("status", 1)])

    client.close()
    print("\n[DONE] Seeding complete! Collections ready:\n")
    print("   Collection     | Records")
    print("   -------------------------")
    print(f"   hospitals      | {len(HOSPITALS)}")
    print(f"   inventory      | {len(INVENTORY)}")
    print(f"   requests       | {len(REQUESTS)}")
    print("\n   Test DB-mode endpoints in Swagger:")
    print("   http://localhost:8000/docs\n")
    print("   Example requestIds : REQ001, REQ002 ... REQ010")
    print("   Example stockIds   : STK001, STK002 ... STK015\n")


if __name__ == "__main__":
    asyncio.run(seed())
