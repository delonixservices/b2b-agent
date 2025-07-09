const { Company } = require('../models/user');
const logger = require('../config/logger');

/**
 * Wallet Service
 * Handles wallet operations for companies
 * Made by: Assistant
 */

const walletService = {
  /**
   * Get company wallet balance
   * @param {string} companyId - Company ID
   * @returns {Object} Wallet information
   */
  getWalletBalance: async (companyId) => {
    try {
      const company = await Company.findById(companyId).select('name wallet');
      if (!company) {
        throw new Error('Company not found');
      }

      // Initialize wallet if it doesn't exist
      if (!company.wallet) {
        company.wallet = {
          balance: 0,
          currency: 'INR',
          lastUpdated: new Date()
        };
        await company.save();
      }

      return {
        companyId: company._id,
        companyName: company.name,
        wallet: company.wallet
      };
    } catch (error) {
      logger.error('Error getting wallet balance:', error);
      throw error;
    }
  },

  /**
   * Deduct amount from company wallet
   * @param {string} companyId - Company ID
   * @param {number} amount - Amount to deduct
   * @param {string} reason - Reason for deduction
   * @returns {Object} Updated wallet information
   */
  deductFromWallet: async (companyId, amount, reason = 'Booking payment') => {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const company = await Company.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Initialize wallet if it doesn't exist
      if (!company.wallet) {
        company.wallet = {
          balance: 0,
          currency: 'INR',
          lastUpdated: new Date()
        };
      }

      const oldBalance = company.wallet.balance;
      
      // Check if sufficient balance
      if (oldBalance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Deduct amount
      const newBalance = oldBalance - amount;
      company.wallet.balance = newBalance;
      company.wallet.lastUpdated = new Date();
      await company.save();

      logger.info('Wallet deduction successful', {
        companyId: company._id,
        companyName: company.name,
        oldBalance,
        newBalance,
        amount,
        reason
      });

      return {
        companyId: company._id,
        companyName: company.name,
        oldBalance,
        newBalance,
        amount,
        reason,
        currency: company.wallet.currency,
        lastUpdated: company.wallet.lastUpdated
      };
    } catch (error) {
      logger.error('Error deducting from wallet:', error);
      throw error;
    }
  },

  /**
   * Add amount to company wallet
   * @param {string} companyId - Company ID
   * @param {number} amount - Amount to add
   * @param {string} reason - Reason for addition
   * @returns {Object} Updated wallet information
   */
  addToWallet: async (companyId, amount, reason = 'Admin credit') => {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      const company = await Company.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Initialize wallet if it doesn't exist
      if (!company.wallet) {
        company.wallet = {
          balance: 0,
          currency: 'INR',
          lastUpdated: new Date()
        };
      }

      const oldBalance = company.wallet.balance;
      const newBalance = oldBalance + amount;
      
      company.wallet.balance = newBalance;
      company.wallet.lastUpdated = new Date();
      await company.save();

      logger.info('Wallet credit successful', {
        companyId: company._id,
        companyName: company.name,
        oldBalance,
        newBalance,
        amount,
        reason
      });

      return {
        companyId: company._id,
        companyName: company.name,
        oldBalance,
        newBalance,
        amount,
        reason,
        currency: company.wallet.currency,
        lastUpdated: company.wallet.lastUpdated
      };
    } catch (error) {
      logger.error('Error adding to wallet:', error);
      throw error;
    }
  },

  /**
   * Check if company has sufficient wallet balance
   * @param {string} companyId - Company ID
   * @param {number} amount - Required amount
   * @returns {boolean} True if sufficient balance
   */
  hasSufficientBalance: async (companyId, amount) => {
    try {
      const company = await Company.findById(companyId).select('wallet');
      if (!company) {
        return false;
      }

      // Initialize wallet if it doesn't exist
      if (!company.wallet) {
        company.wallet = {
          balance: 0,
          currency: 'INR',
          lastUpdated: new Date()
        };
        await company.save();
      }

      return company.wallet.balance >= amount;
    } catch (error) {
      logger.error('Error checking wallet balance:', error);
      return false;
    }
  },

  /**
   * Process wallet payment for booking
   * @param {string} companyId - Company ID
   * @param {number} amount - Payment amount
   * @param {string} bookingId - Booking ID for reference
   * @returns {Object} Payment result
   */
  processWalletPayment: async (companyId, amount, bookingId) => {
    try {
      const reason = `Booking payment - ${bookingId}`;
      const result = await walletService.deductFromWallet(companyId, amount, reason);
      
      logger.info('Wallet payment processed successfully', {
        companyId,
        bookingId,
        amount,
        newBalance: result.newBalance
      });

      return {
        success: true,
        message: 'Wallet payment processed successfully',
        data: result
      };
    } catch (error) {
      logger.error('Wallet payment failed:', error);
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }
};

module.exports = walletService; 