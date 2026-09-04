const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: '../.env' });

const Facility = require('../models/Facility');
const Stock = require('../models/Stock');
const Request = require('../models/Request');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medical_supply';

const hospitals = [
  { hospitalId: 'H001', hospitalName: 'Colombo National Hospital', email: 'colombo@gov.lk', password: 'password123', location: 'Colombo', province: 'Western' },
  { hospitalId: 'H002', hospitalName: 'Kandy Teaching Hospital', email: 'kandy@gov.lk', password: 'password123', location: 'Kandy', province: 'Central' },
  { hospitalId: 'H003', hospitalName: 'Karapitiya Teaching Hospital', email: 'karapitiya@gov.lk', password: 'password123', location: 'Galle', province: 'Southern' },
  { hospitalId: 'H004', hospitalName: 'Jaffna Teaching Hospital', email: 'jaffna@gov.lk', password: 'password123', location: 'Jaffna', province: 'Northern' },
  { hospitalId: 'H005', hospitalName: 'Batticaloa Teaching Hospital', email: 'batticaloa@gov.lk', password: 'password123', location: 'Batticaloa', province: 'Eastern' },
  { hospitalId: 'H006', hospitalName: 'Kurunegala Teaching Hospital', email: 'kurunegala@gov.lk', password: 'password123', location: 'Kurunegala', province: 'North Western' },
  { hospitalId: 'H007', hospitalName: 'Anuradhapura Teaching Hospital', email: 'anuradhapura@gov.lk', password: 'password123', location: 'Anuradhapura', province: 'North Central' },
  { hospitalId: 'H008', hospitalName: 'Badulla General Hospital', email: 'badulla@gov.lk', password: 'password123', location: 'Badulla', province: 'Uva' },
  { hospitalId: 'H009', hospitalName: 'Ratnapura General Hospital', email: 'ratnapura@gov.lk', password: 'password123', location: 'Ratnapura', province: 'Sabaragamuwa' },
  { hospitalId: 'H010', hospitalName: 'Matara District Hospital', email: 'matara@gov.lk', password: 'password123', location: 'Matara', province: 'Southern' }
];

const seedData = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    await Facility.deleteMany();
    await Stock.deleteMany();
    await Request.deleteMany();
    
    console.log('Cleared existing data');

    const createdHospitals = [];
    for (const h of hospitals) {
      h.password = await bcrypt.hash(h.password, 10);
      const newH = await Facility.create(h);
      createdHospitals.push(newH);
    }
    
    console.log('Hospitals seeded');

    const d = new Date();
    const nextMonth = new Date(d.setMonth(d.getMonth() + 1));
    const nextYear = new Date(d.setFullYear(d.getFullYear() + 1));
    const pastDate = new Date('2024-01-01');

    const stocks = [
      { stockId: 'STK001', hospitalId: createdHospitals[0]._id, medicine: 'Paracetamol', quantity: 500, expiryDate: nextYear, status: 'AVAILABLE' },
      { stockId: 'STK002', hospitalId: createdHospitals[1]._id, medicine: 'Amoxicillin', quantity: 200, expiryDate: nextYear, status: 'AVAILABLE' },
      { stockId: 'STK003', hospitalId: createdHospitals[2]._id, medicine: 'Metformin', quantity: 300, expiryDate: nextYear, status: 'AVAILABLE' },
      { stockId: 'STK004', hospitalId: createdHospitals[3]._id, medicine: 'Losartan', quantity: 150, expiryDate: nextYear, status: 'AVAILABLE' },
      { stockId: 'STK005', hospitalId: createdHospitals[4]._id, medicine: 'Omeprazole', quantity: 400, expiryDate: nextYear, status: 'AVAILABLE' },
      { stockId: 'STK006', hospitalId: createdHospitals[5]._id, medicine: 'Aspirin', quantity: 0, expiryDate: nextYear, status: 'AVAILABLE' }, // edge case: quantity = 0
      { stockId: 'STK007', hospitalId: createdHospitals[6]._id, medicine: 'Ibuprofen', quantity: 100, expiryDate: pastDate, status: 'AVAILABLE' }, // edge case: expired
      { stockId: 'STK008', hospitalId: createdHospitals[7]._id, medicine: 'Atorvastatin', quantity: 250, expiryDate: nextYear, status: 'AVAILABLE' },
      { stockId: 'STK009', hospitalId: createdHospitals[8]._id, medicine: 'Cetirizine', quantity: 350, expiryDate: nextYear, status: 'AVAILABLE' },
      { stockId: 'STK010', hospitalId: createdHospitals[9]._id, medicine: 'Insulin', quantity: 50, expiryDate: nextYear, status: 'AVAILABLE' },
      { stockId: 'STK011', hospitalId: createdHospitals[0]._id, medicine: 'Salbutamol', quantity: 600, expiryDate: nextYear, status: 'AVAILABLE' },
      { stockId: 'STK012', hospitalId: createdHospitals[1]._id, medicine: 'Amoxicillin', quantity: 200, expiryDate: nextMonth, status: 'AVAILABLE' },
      { stockId: 'STK013', hospitalId: createdHospitals[2]._id, medicine: 'Metformin', quantity: 300, expiryDate: nextYear, status: 'UNAVAILABLE' }, // edge case: unavailable
      { stockId: 'STK014', hospitalId: createdHospitals[3]._id, medicine: 'Losartan', quantity: 150, expiryDate: nextYear, status: 'AVAILABLE' },
      { stockId: 'STK015', hospitalId: createdHospitals[4]._id, medicine: 'Omeprazole', quantity: 400, expiryDate: nextYear, status: 'AVAILABLE' }
    ];

    await Stock.insertMany(stocks);
    console.log('Stock seeded');

    const requests = [
      { requestId: 'REQ001', hospitalId: createdHospitals[0]._id, medicine: 'Insulin', quantity: 100, urgency: 'HIGH', location: 'Colombo', province: 'Western', requiredBy: nextMonth, status: 'OPEN' },
      { requestId: 'REQ002', hospitalId: createdHospitals[1]._id, medicine: 'Paracetamol', quantity: 1000, urgency: 'MEDIUM', location: 'Kandy', province: 'Central', requiredBy: nextMonth, status: 'OPEN' },
      { requestId: 'REQ003', hospitalId: createdHospitals[2]._id, medicine: 'Salbutamol', quantity: 200, urgency: 'LOW', location: 'Galle', province: 'Southern', requiredBy: nextMonth, status: 'OPEN' },
      { requestId: 'REQ004', hospitalId: createdHospitals[3]._id, medicine: 'Ibuprofen', quantity: 300, urgency: 'HIGH', location: 'Jaffna', province: 'Northern', requiredBy: nextMonth, status: 'OPEN' },
      { requestId: 'REQ005', hospitalId: createdHospitals[4]._id, medicine: 'Atorvastatin', quantity: 400, urgency: 'MEDIUM', location: 'Batticaloa', province: 'Eastern', requiredBy: nextMonth, status: 'OPEN' },
      { requestId: 'REQ006', hospitalId: createdHospitals[5]._id, medicine: 'Cetirizine', quantity: 500, urgency: 'LOW', location: 'Kurunegala', province: 'North Western', requiredBy: nextMonth, status: 'OPEN' },
      { requestId: 'REQ007', hospitalId: createdHospitals[6]._id, medicine: 'Aspirin', quantity: 150, urgency: 'HIGH', location: 'Anuradhapura', province: 'North Central', requiredBy: nextMonth, status: 'OPEN' },
      { requestId: 'REQ008', hospitalId: createdHospitals[7]._id, medicine: 'Omeprazole', quantity: 250, urgency: 'MEDIUM', location: 'Badulla', province: 'Uva', requiredBy: nextMonth, status: 'OPEN' },
      { requestId: 'REQ009', hospitalId: createdHospitals[8]._id, medicine: 'Losartan', quantity: 350, urgency: 'LOW', location: 'Ratnapura', province: 'Sabaragamuwa', requiredBy: nextMonth, status: 'CANCELLED' }, // edge case: cancelled
      { requestId: 'REQ010', hospitalId: createdHospitals[9]._id, medicine: 'Metformin', quantity: 450, urgency: 'HIGH', location: 'Matara', province: 'Southern', requiredBy: nextMonth, status: 'OPEN' }
    ];

    await Request.insertMany(requests);
    console.log('Requests seeded');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
