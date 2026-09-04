const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Hospital = require("../models/Hospital");
const User = require("../models/User");
const MedicineRequest = require("../models/MedicineRequest");
const Stock = require("../models/Stock");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const hospitals = [
  ["H001", "National Hospital of Sri Lanka", "Colombo", "Western"],
  ["H002", "Teaching Hospital Kandy", "Kandy", "Central"],
  ["H003", "Teaching Hospital Karapitiya", "Galle", "Southern"],
  ["H004", "Teaching Hospital Jaffna", "Jaffna", "Northern"],
  ["H005", "Teaching Hospital Anuradhapura", "Anuradhapura", "North Central"],
  ["H006", "District General Hospital Badulla", "Badulla", "Uva"],
  ["H007", "Teaching Hospital Kurunegala", "Kurunegala", "North Western"],
  ["H008", "District General Hospital Ratnapura", "Ratnapura", "Sabaragamuwa"],
  ["H009", "Base Hospital Batticaloa", "Batticaloa", "Eastern"],
  ["H010", "District General Hospital Matara", "Matara", "Southern"],
].map(([hospitalId, name, location, province]) => ({ hospitalId, name, location, province }));

const date = (value) => new Date(`${value}T00:00:00.000Z`);
const requests = [
  ["REQ001", "H010", "Insulin", 80, "HIGH", "Matara", "Southern", "2026-09-15", "open"],
  ["REQ002", "H002", "Paracetamol", 200, "MEDIUM", "Kandy", "Central", "2026-10-01", "open"],
  ["REQ003", "H003", "Amoxicillin", 120, "HIGH", "Galle", "Southern", "2026-09-20", "open"],
  ["REQ004", "H004", "Salbutamol", 60, "MEDIUM", "Jaffna", "Northern", "2026-10-10", "open"],
  ["REQ005", "H005", "Insulin", 40, "HIGH", "Anuradhapura", "North Central", "2026-09-25", "open"],
  ["REQ006", "H006", "Ceftriaxone", 90, "LOW", "Badulla", "Uva", "2026-11-01", "open"],
  ["REQ007", "H007", "Paracetamol", 150, "MEDIUM", "Kurunegala", "North Western", "2026-10-20", "open"],
  ["REQ008", "H008", "Insulin", 30, "HIGH", "Ratnapura", "Sabaragamuwa", "2026-09-18", "open"],
  ["REQ009", "H009", "Amoxicillin", 75, "LOW", "Batticaloa", "Eastern", "2026-10-15", "cancelled"],
  ["REQ010", "H010", "Salbutamol", 50, "MEDIUM", "Matara", "Southern", "2026-10-30", "open"],
].map(([requestId, hospitalId, medicine, quantity, urgency, location, province, requiredBy, status]) => ({ requestId, hospitalId, medicine, quantity, urgency, location, province, requiredBy: date(requiredBy), status }));

const stock = [
  ["STK001", "H001", "Insulin", 120, "Colombo", "Western", "2027-02-10", "available"],
  ["STK002", "H002", "Paracetamol", 500, "Kandy", "Central", "2027-01-15", "available"],
  ["STK003", "H003", "Amoxicillin", 250, "Galle", "Southern", "2027-03-20", "available"],
  ["STK004", "H004", "Salbutamol", 150, "Jaffna", "Northern", "2027-04-05", "available"],
  ["STK005", "H005", "Insulin", 75, "Anuradhapura", "North Central", "2027-01-30", "available"],
  ["STK006", "H006", "Ceftriaxone", 0, "Badulla", "Uva", "2027-05-10", "available"],
  ["STK007", "H007", "Paracetamol", 100, "Kurunegala", "North Western", "2025-12-01", "available"],
  ["STK008", "H008", "Insulin", 60, "Ratnapura", "Sabaragamuwa", "2027-02-28", "available"],
  ["STK009", "H009", "Amoxicillin", 180, "Batticaloa", "Eastern", "2027-03-01", "available"],
  ["STK010", "H010", "Salbutamol", 100, "Matara", "Southern", "2027-02-18", "available"],
  ["STK011", "H001", "Ceftriaxone", 110, "Colombo", "Western", "2027-06-01", "available"],
  ["STK012", "H002", "Insulin", 45, "Kandy", "Central", "2027-02-05", "available"],
  ["STK013", "H003", "Paracetamol", 300, "Galle", "Southern", "2027-02-20", "unavailable"],
  ["STK014", "H004", "Amoxicillin", 90, "Jaffna", "Northern", "2027-03-15", "available"],
  ["STK015", "H005", "Salbutamol", 80, "Anuradhapura", "North Central", "2027-04-20", "available"],
].map(([stockId, hospitalId, medicine, quantity, location, province, expiryDate, status]) => ({ stockId, hospitalId, medicine, quantity, location, province, expiryDate: date(expiryDate), status }));

const seed = async () => {
  await connectDB();
  const passwordHash = await bcrypt.hash("MedBridgeDemo123!", 12);
  await Promise.all([Hospital.deleteMany({}), User.deleteMany({}), MedicineRequest.deleteMany({}), Stock.deleteMany({})]);
  await Hospital.insertMany(hospitals);
  await User.insertMany(hospitals.map(({ hospitalId }) => ({ userId: `USR${hospitalId.slice(1)}`, hospitalId, email: `${hospitalId.toLowerCase()}@medbridge.demo`, passwordHash, role: "hospital_admin" })));
  await MedicineRequest.insertMany(requests);
  await Stock.insertMany(stock);
  console.log(`Seeded ${hospitals.length} hospitals, ${requests.length} requests, and ${stock.length} stock records.`);
  console.log("Demo login password for all seeded users: MedBridgeDemo123!");
};

seed().catch((error) => { console.error("Seed failed:", error.message); process.exitCode = 1; }).finally(async () => { await mongoose.disconnect(); });