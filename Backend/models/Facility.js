const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const facilitySchema = new mongoose.Schema({
  hospitalName: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
}, { timestamps: true });

facilitySchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

facilitySchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Facility', facilitySchema);
