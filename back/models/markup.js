const mongoose = require('mongoose');

const markupSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  type: { 
    type: String, 
    enum: ['fixed', 'percentage'], 
    required: true 
  },
  value: { 
    type: Number, 
    required: true,
    min: 0 
  },
  // For percentage type, value should be between 0-100
  // For fixed type, value is the fixed amount
  isActive: { 
    type: Boolean, 
    default: true 
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin', 
    required: true 
  }
}, {
  timestamps: true
});

// Index for efficient queries
markupSchema.index({ isActive: 1, hotelId: 1 });

// Ensure only one markup per hotel
markupSchema.index({ hotelId: 1 }, { unique: true });

const Markup = mongoose.model('Markup', markupSchema);

module.exports = Markup; 