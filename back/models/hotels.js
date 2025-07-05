const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const hotelSchema = new Schema({
  "hotelId": {
    type: String
  },
  "hotel_response_id": {
    type: String
  },
  "originalName": {
    type: String,
    required: true
  },
  "moreRatings": {
    type: Object,
    // required: true
  },
  "amenities": {
    type: Array,
    required: true
  },
  "moreDetails": {
    type: Object,
    required: true
  },
  "imageDetails": {
    type: Object,
    required: true
  },
  "rates": {
    packages: [{
      base_amount: Number,
      service_component: Number,
      gst: Number,
      chargeable_rate: Number,
      room_details: Object,
      booking_key: String,
      room_rate: Number,
      client_commission: Number,
      guest_discount_percentage: Number
    }]
  },
  "name": {
    type: String,
    required: true
  },
  "location": {
    type: Object,
    required: true
  },
  "id": {
    type: String,
    required: true
  },
  "starRating": {
    type: Object,
    // required: true
  },
  "dailyRates": {
    type: Object,
    // required: true
  },
  "policy": {
    // type: Object,
    // required: true
  },
  "meta_search_referenceId": {
    type: String
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Hotel', hotelSchema, 'hotels');