const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const configSchema = new Schema({
  markup: {
    type: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed']
    },
    value: {
      type: Number,
      required: true
    }
  },
  service_charge: {
    type: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed']
    },
    value: {
      type: Number,
      required: true
    }
  },
  processing_fee: {
    type: Number,
    required: true
  },
  cancellation_charge: {
    type: {
      type: String,
      required: true,
      enum: ['percentage', 'fixed']
    },
    value: {
      type: Number,
      required: true
    }
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Ensure only one config document exists
configSchema.index({}, { unique: true, sparse: true });

module.exports = mongoose.model('Config', configSchema, 'configs'); 