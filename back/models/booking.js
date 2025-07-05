const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingPolicySchema = new Schema({
    booking_policy: {
        type: Object,
        required: true
    },
    search: {
        type: Object,
        required: true
    },
    transaction_identifier: {
        type: String,
        required: true
    },
    hotel: {
        type: Schema.Types.ObjectId,
        ref: 'Hotel'
    },
    // Additional fields to match the desired response structure
    booking_policy_id: {
        type: String,
        required: true,
        unique: true
    },
    event_id: {
        type: String,
        default: ""
    },
    statusToken: {
        type: String,
        default: ""
    },
    session_id: {
        type: String,
        default: ""
    },
    // User information for tracking who created the booking policy
    userType: {
        type: String,
        enum: ['company', 'employee'],
        required: true
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: function() {
            return this.userType === 'company';
        }
    },
    employeeId: {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
        required: function() {
            return this.userType === 'employee';
        }
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('BookingPolicy', bookingPolicySchema, 'bookingPolicy');