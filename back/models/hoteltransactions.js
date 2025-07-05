const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // User information
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For anonymous users
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, // For company bookings
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, // For employee bookings
  userType: { type: String, enum: ['anonymous', 'company', 'employee'], default: 'anonymous' },
  
  // Booking information
  transaction_identifier: { type: String, required: true },
  booking_policy_id: { type: String, required: true },
  
  // Search and hotel details
  search: { type: Object, required: true },
  booking_policy: { type: Object, required: true },
  hotel: { type: Object, required: true },
  hotelPackage: { type: Object, required: true },
  
  // Contact and guest information
  contactDetail: { type: Object, required: true },
  coupon: { type: Object, default: {} },
  
  // Pricing information
  pricing: { type: Object, required: true },
  
  // Status and responses
  status: { type: Number, default: 0 }, // 0: pending, 1: confirmed, 2: cancelled, 3: failed
  prebook_response: { type: Object },
  confirm_response: { type: Object },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ transaction_identifier: 1 });
transactionSchema.index({ booking_policy_id: 1 });
transactionSchema.index({ companyId: 1 });
transactionSchema.index({ employeeId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 