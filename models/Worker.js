const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  bio: {
    type: String,
    maxlength: 500
  },
  experience: {
    type: Number,
    min: 0
  },
  skills: [String],
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  serviceAreas: [{
    city: String,
    areas: [String]
  }],
  availability: {
    monday: { available: Boolean, start: String, end: String },
    tuesday: { available: Boolean, start: String, end: String },
    wednesday: { available: Boolean, start: String, end: String },
    thursday: { available: Boolean, start: String, end: String },
    friday: { available: Boolean, start: String, end: String },
    saturday: { available: Boolean, start: String, end: String },
    sunday: { available: Boolean, start: String, end: String }
  },
  documents: {
    cnic: { front: String, back: String, verified: Boolean },
    license: { file: String, verified: Boolean },
    certificates: [{ file: String, name: String }]
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  totalJobs: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: String,
  portfolio: [{
    image: String,
    description: String,
    date: Date
  }],
  whatsappNumber: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Worker', workerSchema);

