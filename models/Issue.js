const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  vehicleType: {
    type: String,
    required: true,
    enum: ['Car', 'Motorcycle']
  },
  description: {
    type: String,
    required: true
  },
  expectedPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'OFFERED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  offers: [{
    mechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mechanic'
    },
    price: Number,
    estimatedTime: Number,
    notes: String,
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  acceptedOffer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mechanic'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for geospatial queries
issueSchema.index({ location: '2dsphere' });

// Update the updatedAt timestamp before saving
issueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Issue', issueSchema); 