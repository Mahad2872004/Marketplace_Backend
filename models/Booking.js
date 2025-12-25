const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['instant', 'scheduled'],
    required: true
  },
  scheduledDate: Date,
  scheduledTime: String,
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    instructions: String
  },
  description: {
    type: String,
    required: true
  },
  images: [String],
  estimatedCost: Number,
  finalCost: Number,
  paymentMethod: {
    type: String,
    enum: ['cash', 'jazzcash', 'easypaisa', 'card', 'bank_transfer'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['customer', 'worker', 'admin']
  },
  completedAt: Date,
  rating: {
    score: { type: Number, min: 1, max: 5 },
    comment: String,
    date: Date
  },
  review: {
    text: String,
    date: Date
  },
  chatMessages: [{
    sender: { type: String, enum: ['customer', 'worker'] },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
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

module.exports = mongoose.model('Booking', bookingSchema);

