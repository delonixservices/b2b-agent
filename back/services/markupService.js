/**
 * Markup Service
 * Updated by: Amber Bisht
 * @description Service for handling markup calculations, GST, and service charges for hotel bookings
 * This service manages the complex pricing calculations including:
 * - Base amount markup (percentage or fixed)
 * - GST calculations (18%)
 * - Service component calculations
 * - Processing fee additions
 * All calculations are done with proper rounding and error handling
 */

const Config = require('../models/config');
const logger = require('../config/logger');

module.exports = {
  /**
   * Apply markup and additional charges to hotel package
   * Updated by: Amber Bisht
   * @param {Object} hotelPackage - Hotel package object to modify
   * @throws {Error} If hotel package is missing or calculation fails
   * @description Applies the following calculations in sequence:
   * 1. Base amount markup (percentage or fixed)
   * 2. GST on base amount (18%)
   * 3. Service component (percentage or fixed)
   * 4. Processing fee addition
   * 5. GST on service component (18%)
   * All amounts are rounded to 2 decimal places
   */
  addMarkup: async (hotelPackage) => {
    // Validate input
    if (!hotelPackage) {
      logger.info('No hotel package found to apply markup at markupService.js - returning 0 price');
      return {
        base_amount: 0,
        service_component: 0,
        gst: 0,
        chargeable_rate: 0
      };
    }

    let baseAmount = hotelPackage.chargeable_rate | 0;
    let config = await Config.findOne({});

    // Validate config
    if (!config || !config.markup) {
      logger.info('Cannot find any document in the config collection. at markupService.js - returning 0 price');
      return {
        base_amount: 0,
        service_component: 0,
        gst: 0,
        chargeable_rate: 0
      };
    }

    try {
      // Only proceed if both base amount and markup value are positive
      if (baseAmount > 0 && config.markup.value > 0) {
        let markup = 0;
        
        // Calculate markup based on type (percentage or fixed)
        if (config.markup.type === 'percentage') {
          markup = (config.markup.value / 100) * baseAmount;
        } else if (config.markup.type === 'fixed') {
          markup = config.markup.value;
        }
        
        // Step 1: Add markup to base amount
        baseAmount = baseAmount + markup;
        
        // Step 2: Apply 18% GST on the total base amount
        const hotelGst = (18 / 100) * baseAmount;
        baseAmount = baseAmount + hotelGst;

        // Step 3: Calculate service component
        let serviceComponent = 0;
        if (config.service_charge.value > 0) {
          if (config.service_charge.type === 'percentage') {
            serviceComponent = (config.service_charge.value / 100) * baseAmount;
          } else if (config.service_charge.type === 'fixed') {
            serviceComponent = config.service_charge.value;
          }
        }

        // Step 4: Add processing fee to service component
        if (config.processing_fee > 0) {
          serviceComponent += config.processing_fee;
        }

        // Step 5: Apply GST on service component
        const serviceGst = (18 / 100) * serviceComponent;
        serviceComponent = serviceComponent + serviceGst;

        // Update hotel package with calculated values
        // All values are rounded to 2 decimal places
        hotelPackage.base_amount = +baseAmount.toFixed(2);
        hotelPackage.service_component = +serviceComponent.toFixed(2);
        hotelPackage.gst = +(hotelGst + serviceGst).toFixed(2);
        hotelPackage.chargeable_rate = +(baseAmount + serviceComponent).toFixed(2);

        logger.info('Markup calculation completed successfully', {
          baseAmount: hotelPackage.base_amount,
          serviceComponent: hotelPackage.service_component,
          gst: hotelPackage.gst,
          totalChargeable: hotelPackage.chargeable_rate
        });
      } else {
        // If base amount or markup value is not positive, set all values to 0
        hotelPackage.base_amount = 0;
        hotelPackage.service_component = 0;
        hotelPackage.gst = 0;
        hotelPackage.chargeable_rate = 0;
        
        logger.info('Base amount or markup value not positive - setting all values to 0');
      }
    } catch (err) {
      logger.error('Error in markup calculation:', err);
      // Return 0 values on error instead of throwing
      hotelPackage.base_amount = 0;
      hotelPackage.service_component = 0;
      hotelPackage.gst = 0;
      hotelPackage.chargeable_rate = 0;
    }
  },

  /**
   * Get current markup configuration
   * Updated by: Amber Bisht
   * @returns {Object} Current markup configuration
   * @throws {Error} If config or markup settings are not found
   * @description Retrieves the current markup settings from config
   */
  getMarkup: async () => {
    const config = await Config.findOne({});
    if (!config || !config.markup) {
      throw new Error('Cannot find any document in the config collection. at markupService.js');
    }
    return config.markup;
  },

  /**
   * Get complete configuration
   * @returns {Object} Complete configuration including markup, service_charge, processing_fee, cancellation_charge
   */
  getConfig: async () => {
    const config = await Config.findOne({});
    if (!config) {
      throw new Error('Configuration not found');
    }
    return config;
  },

  /**
   * Update configuration (super admin only)
   * @param {Object} configData - Configuration data to update
   * @returns {Object} Updated configuration
   */
  updateConfig: async (configData) => {
    try {
      let config = await Config.findOne({});
      
      if (!config) {
        // Create new config if none exists
        config = new Config(configData);
      } else {
        // Update existing config
        Object.assign(config, configData);
      }
      
      await config.save();
      return config;
    } catch (error) {
      logger.error('Error updating configuration:', error);
      throw error;
    }
  },

  /**
   * Calculate cancellation charge
   * @param {number} amount - Amount to calculate cancellation charge on
   * @returns {number} Cancellation charge amount
   */
  calculateCancellationCharge: async (amount) => {
    try {
      const config = await Config.findOne({});
      if (!config || !config.cancellation_charge) {
        return 0;
      }

      let cancellationCharge = 0;
      
      if (config.cancellation_charge.type === 'percentage') {
        cancellationCharge = (config.cancellation_charge.value / 100) * amount;
      } else {
        cancellationCharge = config.cancellation_charge.value;
      }

      return +cancellationCharge.toFixed(2);
    } catch (error) {
      logger.error('Error calculating cancellation charge:', error);
      return 0;
    }
  }
}; 