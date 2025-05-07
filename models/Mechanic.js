const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mechanicSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  cnic: {
    type: String,
    required: true,
    unique: true
  },
  experience: {
    type: String,
    required: true
  },
  hourlyRate: {
    type: String,
    required: true
  },
  availability: {
    type: String,
    enum: ['full-time', 'part-time'],
    default: 'full-time'
  },
  vehicleTypes: [{
    type: String,
    enum: ['Car', 'Bike']
  }],
  serviceRadius: {
    type: String,
    required: true
  },
  serviceAreas: {
    type: String,
    required: true
  },
  isLive: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
mechanicSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
mechanicSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Mechanic', mechanicSchema); 