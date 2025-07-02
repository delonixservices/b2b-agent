const { Company } = require('../models/user');
const Markup = require('../models/markup');

class MarkupService {
  /**
   * Set markup for a company
   * @param {string} companyId - Company ID
   * @param {Object} markupData - Markup configuration
   * @param {string} markupData.type - 'percentage' or 'fixed'
   * @param {number} markupData.value - Markup value
   * @param {boolean} markupData.isActive - Whether markup is active
   * @returns {Object} Updated company with markup
   */
  static async setMarkup(companyId, markupData) {
    try {
      const { type, value, isActive } = markupData;
      
      // Validate markup type
      if (!['percentage', 'fixed'].includes(type)) {
        throw new Error('Markup type must be either "percentage" or "fixed"');
      }
      
      // Validate markup value
      if (typeof value !== 'number' || value < 0) {
        throw new Error('Markup value must be a non-negative number');
      }
      
      // For percentage markup, ensure it's not more than 100%
      if (type === 'percentage' && value > 100) {
        throw new Error('Percentage markup cannot exceed 100%');
      }
      
      const company = await Company.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }
      
      // Update markup configuration
      company.markup = {
        type,
        value,
        isActive: isActive !== undefined ? isActive : true
      };
      
      await company.save();
      
      return {
        success: true,
        message: 'Markup updated successfully',
        data: {
          company: {
            _id: company._id,
            name: company.name,
            markup: company.markup
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get markup for a company
   * @param {string} companyId - Company ID
   * @returns {Object} Company markup configuration
   */
  static async getMarkup(companyId) {
    try {
      const company = await Company.findById(companyId).select('name markup');
      if (!company) {
        throw new Error('Company not found');
      }
      
      return {
        success: true,
        message: 'Markup retrieved successfully',
        data: {
          company: {
            _id: company._id,
            name: company.name,
            markup: company.markup
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Calculate markup for a given amount
   * @param {number} amount - Original amount
   * @returns {Object} - Markup calculation result
   */
  static async calculateMarkup(amount) {
    try {
      // Get the global markup
      const markup = await Markup.findOne({
        isActive: true
      });

      if (!markup) {
        throw new Error('No active markup found');
      }

      let markupAmount = 0;
      
      if (markup.type === 'percentage') {
        markupAmount = (amount * markup.value) / 100;
      } else {
        markupAmount = markup.value;
      }

      const finalAmount = amount + markupAmount;

      return {
        originalAmount: amount,
        markup: {
          id: markup._id,
          name: markup.name,
          type: markup.type,
          value: markup.value,
          amount: markupAmount
        },
        finalAmount
      };
    } catch (error) {
      console.error('Markup calculation error:', error);
      throw error;
    }
  }
  
  /**
   * Toggle markup active status
   * @param {string} companyId - Company ID
   * @param {boolean} isActive - Whether to activate or deactivate markup
   * @returns {Object} Updated markup configuration
   */
  static async toggleMarkup(companyId, isActive) {
    try {
      const company = await Company.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }
      
      company.markup.isActive = isActive;
      await company.save();
      
      return {
        success: true,
        message: `Markup ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          company: {
            _id: company._id,
            name: company.name,
            markup: company.markup
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the global markup
   * @returns {Object} - Global markup
   */
  static async getGlobalMarkup() {
    try {
      return await Markup.findOne({
        isActive: true
      });
    } catch (error) {
      console.error('Get global markup error:', error);
      throw error;
    }
  }

  /**
   * Apply markup to a booking or transaction
   * @param {Object} bookingData - Booking data with amount
   * @returns {Object} - Updated booking data with markup applied
   */
  static async applyMarkupToBooking(bookingData) {
    try {
      const { amount } = bookingData;
      
      if (!amount || amount <= 0) {
        throw new Error('Invalid amount for markup calculation');
      }

      const markupResult = await this.calculateMarkup(amount);

      return {
        ...bookingData,
        originalAmount: markupResult.originalAmount,
        markupAmount: markupResult.totalMarkup,
        finalAmount: markupResult.finalAmount,
        markupBreakdown: markupResult.markupBreakdown
      };
    } catch (error) {
      console.error('Apply markup to booking error:', error);
      throw error;
    }
  }

  /**
   * Validate markup data
   * @param {Object} markupData - Markup data to validate
   * @returns {Object} - Validation result
   */
  static validateMarkupData(markupData) {
    const { name, type, value } = markupData;
    const errors = [];

    if (!name || name.trim() === '') {
      errors.push('Name is required');
    }

    if (!type || !['fixed', 'percentage'].includes(type)) {
      errors.push('Type must be either "fixed" or "percentage"');
    }

    if (value === undefined || value === null) {
      errors.push('Value is required');
    } else {
      if (type === 'percentage' && (value < 0 || value > 100)) {
        errors.push('Percentage value must be between 0 and 100');
      }
      if (type === 'fixed' && value < 0) {
        errors.push('Fixed value must be greater than or equal to 0');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = MarkupService; 