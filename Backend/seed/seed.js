const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Hospital = require("../models/Hospital");
const User = require("../models/User");
const MedicineRequest = require("../models/MedicineRequest");
const Stock = require("../models/Stock");
const Offer = require("../models/Offer");
const Transaction = require("../models/Transaction");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const hospitals = [
  { hospitalId: "H001", name: "National Hospital Colombo", location: "Colombo", province: "Western" },
  { hospitalId: "H002", name: "Kandy Teaching Hospital", location: "Kandy", province: "Central" },
  { hospitalId: "H003", name: "Karapitiya Teaching Hospital", location: "Galle", province: "Southern" },
  { hospitalId: "H004", name: "Jaffna Teaching Hospital", location: "Jaffna", province: "Northern" },
  { hospitalId: "H005", name: "Teaching Hospital Anuradhapura", location: "Anuradhapura", province: "North Central" },
  { hospitalId: "H006", name: "District General Hospital Badulla", location: "Badulla", province: "Uva" },
  { hospitalId: "H007", name: "Teaching Hospital Kurunegala", location: "Kurunegala", province: "North Western" },
  { hospitalId: "H008", name: "District General Hospital Ratnapura", location: "Ratnapura", province: "Sabaragamuwa" },
  { hospitalId: "H009", name: "Base Hospital Batticaloa", location: "Batticaloa", province: "Eastern" },
  { hospitalId: "H010", name: "District General Hospital Matara", location: "Matara", province: "Southern" },
  { hospitalId: "JF001", name: "Jaffna General Hospital", location: "Jaffna", province: "Northern" },
  { hospitalId: "H012", name: "Base Hospital Vavuniya", location: "Vavuniya", province: "Northern" },
];

const futureDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

const requestsData = [
  { requestId: "REQ-9042", hospitalId: "JF001", medicine: "Atropine Sulfate Injection 0.6mg/mL", quantity: 450, urgency: "HIGH", location: "Jaffna", province: "Northern", requiredBy: futureDate(2), status: "open" },
  { requestId: "REQ-9043", hospitalId: "H006", medicine: "Enoxaparin Sodium 40mg", quantity: 800, urgency: "HIGH", location: "Badulla", province: "Uva", requiredBy: futureDate(3), status: "open" },
  { requestId: "REQ-9044", hospitalId: "H008", medicine: "Sevoflurane Inhalation 250ml", quantity: 50, urgency: "MEDIUM", location: "Ratnapura", province: "Sabaragamuwa", requiredBy: futureDate(5), status: "open" },
  { requestId: "REQ-9045", hospitalId: "JF001", medicine: "Surgical Gloves (Latex Size 7.5)", quantity: 500, urgency: "HIGH", location: "Jaffna", province: "Northern", requiredBy: futureDate(1), status: "open" },
  { requestId: "REQ-9046", hospitalId: "H012", medicine: "Anti-Rabies Vaccine (Purified)", quantity: 120, urgency: "HIGH", location: "Vavuniya", province: "Northern", requiredBy: futureDate(2), status: "open" },
  { requestId: "REQ-9047", hospitalId: "H009", medicine: "Paracetamol Tablets 500mg", quantity: 2000, urgency: "LOW", location: "Batticaloa", province: "Eastern", requiredBy: futureDate(14), status: "open" },
  { requestId: "REQ-9048", hospitalId: "H005", medicine: "Insulin Injection (Actrapid) 100IU/mL", quantity: 300, urgency: "HIGH", location: "Anuradhapura", province: "North Central", requiredBy: futureDate(3), status: "open" },
  { requestId: "REQ-9049", hospitalId: "H010", medicine: "Amoxicillin Capsules 250mg", quantity: 1500, urgency: "MEDIUM", location: "Matara", province: "Southern", requiredBy: futureDate(7), status: "open" },
  { requestId: "REQ-9050", hospitalId: "H006", medicine: "Normal Saline IV 500ml", quantity: 200, urgency: "HIGH", location: "Badulla", province: "Uva", requiredBy: futureDate(2), status: "open" },
  { requestId: "REQ-9051", hospitalId: "H005", medicine: "Diazepam Injection 5mg/mL", quantity: 150, urgency: "MEDIUM", location: "Anuradhapura", province: "North Central", requiredBy: futureDate(6), status: "open" },
  { requestId: "REQ-9052", hospitalId: "H007", medicine: "Metformin Tablets 500mg", quantity: 3000, urgency: "LOW", location: "Kurunegala", province: "North Western", requiredBy: futureDate(10), status: "open" },
  { requestId: "REQ-9053", hospitalId: "H009", medicine: "Ceftriaxone Injection 1g", quantity: 400, urgency: "HIGH", location: "Batticaloa", province: "Eastern", requiredBy: futureDate(4), status: "open" },
];

const stockData = [
  { stockId: "STK-001", hospitalId: "H001", medicine: "Surgical Gloves (Latex Size 7.5)", quantity: 1200, location: "Colombo", province: "Western", expiryDate: futureDate(400), status: "available" },
  { stockId: "STK-002", hospitalId: "H002", medicine: "Surgical Gloves (Latex Size 7.5)", quantity: 650, location: "Kandy", province: "Central", expiryDate: futureDate(450), status: "available" },
  { stockId: "STK-003", hospitalId: "H007", medicine: "Surgical Gloves (Latex Size 7.5)", quantity: 800, location: "Kurunegala", province: "North Western", expiryDate: futureDate(360), status: "available" },
  { stockId: "STK-004", hospitalId: "H002", medicine: "National Hospital Kandy Bay", quantity: 550, location: "Kandy", province: "Central", expiryDate: futureDate(380), status: "available" },
  { stockId: "STK-005", hospitalId: "H012", medicine: "Surgical Gloves (Latex Size 7.5)", quantity: 350, location: "Vavuniya", province: "Northern", expiryDate: futureDate(600), status: "available" },
  { stockId: "STK-006", hospitalId: "H003", medicine: "Surgical Gloves (Latex Size 7.5)", quantity: 1500, location: "Galle", province: "Southern", expiryDate: futureDate(500), status: "available" },
  { stockId: "STK-007", hospitalId: "H001", medicine: "Atropine Sulfate Injection 0.6mg/mL", quantity: 600, location: "Colombo", province: "Western", expiryDate: futureDate(300), status: "available" },
  { stockId: "STK-008", hospitalId: "H002", medicine: "Enoxaparin Sodium 40mg", quantity: 1200, location: "Kandy", province: "Central", expiryDate: futureDate(350), status: "available" },
  { stockId: "STK-009", hospitalId: "H003", medicine: "Sevoflurane Inhalation 250ml", quantity: 150, location: "Galle", province: "Southern", expiryDate: futureDate(420), status: "available" },
  { stockId: "STK-010", hospitalId: "H002", medicine: "Anti-Rabies Vaccine (Purified)", quantity: 400, location: "Kandy", province: "Central", expiryDate: futureDate(280), status: "available" },
  { stockId: "STK-011", hospitalId: "H001", medicine: "Paracetamol Tablets 500mg", quantity: 5000, location: "Colombo", province: "Western", expiryDate: futureDate(700), status: "available" },
  { stockId: "STK-012", hospitalId: "H002", medicine: "Insulin Injection (Actrapid) 100IU/mL", quantity: 800, location: "Kandy", province: "Central", expiryDate: futureDate(250), status: "available" },
  { stockId: "STK-013", hospitalId: "H003", medicine: "Amoxicillin Capsules 250mg", quantity: 3000, location: "Galle", province: "Southern", expiryDate: futureDate(360), status: "available" },
  { stockId: "STK-014", hospitalId: "H001", medicine: "Normal Saline IV 500ml", quantity: 1000, location: "Colombo", province: "Western", expiryDate: futureDate(400), status: "available" },
  { stockId: "STK-015", hospitalId: "H001", medicine: "Diazepam Injection 5mg/mL", quantity: 500, location: "Colombo", province: "Western", expiryDate: futureDate(320), status: "available" },
  { stockId: "STK-016", hospitalId: "H007", medicine: "Metformin Tablets 500mg", quantity: 4500, location: "Kurunegala", province: "North Western", expiryDate: futureDate(550), status: "available" },
  { stockId: "STK-017", hospitalId: "H002", medicine: "Ceftriaxone Injection 1g", quantity: 700, location: "Kandy", province: "Central", expiryDate: futureDate(290), status: "available" },
  { stockId: "STK-018", hospitalId: "H003", medicine: "Omeprazole Capsules 20mg", quantity: 2200, location: "Galle", province: "Southern", expiryDate: futureDate(450), status: "available" },
  { stockId: "STK-019", hospitalId: "H001", medicine: "Adrenaline Injection 1mg/mL", quantity: 450, location: "Colombo", province: "Western", expiryDate: futureDate(300), status: "available" },
  { stockId: "STK-020", hospitalId: "JF001", medicine: "Insulin Injection (Actrapid) 100IU/mL", quantity: 250, location: "Jaffna", province: "Northern", expiryDate: futureDate(240), status: "available" },
];

const seed = async () => {
  await connectDB();
  console.log("Connected to MongoDB Atlas.");

  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  const demoPasswordHash = await bcrypt.hash("MedBridgeDemo123!", 10);

  // Clear existing collections
  await Promise.all([
    Hospital.deleteMany({}),
    User.deleteMany({}),
    MedicineRequest.deleteMany({}),
    Stock.deleteMany({}),
    Offer.deleteMany({}),
    Transaction.deleteMany({}),
  ]);
  console.log("Cleared old collections.");

  // Insert Hospitals
  await Hospital.insertMany(hospitals);
  console.log(`Inserted ${hospitals.length} hospitals.`);

  // Insert Users
  const users = hospitals.map((h, i) => ({
    userId: crypto.randomUUID(),
    hospitalId: h.hospitalId,
    email: h.hospitalId === "JF001" ? "sukirsukirthan347@gmail.com" : `${h.hospitalId.toLowerCase()}@medbridge.lk`,
    passwordHash: defaultPasswordHash,
    role: "hospital_admin",
  }));

  // Also add secondary demo user
  users.push({
    userId: crypto.randomUUID(),
    hospitalId: "H001",
    email: "demo@medbridge.lk",
    passwordHash: demoPasswordHash,
    role: "hospital_admin",
  });

  await User.insertMany(users);
  console.log(`Inserted ${users.length} users with password: password123 (and demo@medbridge.lk / MedBridgeDemo123!)`);

  // Insert Requests
  await MedicineRequest.insertMany(requestsData);
  console.log(`Inserted ${requestsData.length} active medicine requests.`);

  // Insert Stock
  await Stock.insertMany(stockData);
  console.log(`Inserted ${stockData.length} available stock records.`);

  console.log("=========================================");
  console.log("✅ SEEDING COMPLETE WITH REAL MONGO DATA!");
  console.log("=========================================");
  console.log("Log in with:");
  console.log("  Email:    sukirsukirthan347@gmail.com");
  console.log("  Password: password123");
  console.log("=========================================");
};

seed()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
