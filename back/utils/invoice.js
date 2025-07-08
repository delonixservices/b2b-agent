const fs = require('fs');
const path = require('path');

/**
 * Generate invoice PDF for hotel booking
 * @param {Object} bookingData - Booking transaction data
 * @returns {Buffer} - PDF buffer
 */
const generateInvoice = async (bookingData) => {
  try {
    // For now, return a simple text representation
    // In a real implementation, you would use a PDF library like PDFKit
    const invoiceContent = `
INVOICE

Booking ID: ${bookingData._id}
Hotel: ${bookingData.hotel?.originalName || 'N/A'}
Guest: ${bookingData.contactDetail?.name || 'N/A'} ${bookingData.contactDetail?.last_name || ''}
Amount: ${bookingData.pricing?.currency || 'INR'} ${bookingData.pricing?.total_chargeable_amount || 0}

Generated on: ${new Date().toISOString()}
    `;
    
    return Buffer.from(invoiceContent, 'utf8');
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};

module.exports = {
  generateInvoice
}; 