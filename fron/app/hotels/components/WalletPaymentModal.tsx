'use client';

import { useState, useEffect } from 'react';
import { getWalletBalance, checkWalletPaymentEligibility, processWalletPayment, WalletBalanceResponse, WalletEligibilityResponse } from '../../services/hotelApi';
import { getToken } from '../../utils/authUtils';

interface WalletPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  bookingId: string;
  amount: number;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
}

export default function WalletPaymentModal({
  isOpen,
  onClose,
  transactionId,
  bookingId,
  amount,
  onSuccess,
  onError
}: WalletPaymentModalProps) {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [eligibility, setEligibility] = useState<WalletEligibilityResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWalletData();
    }
  }, [isOpen, transactionId, bookingId]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Fetch wallet balance
      const balanceResponse = await getWalletBalance(token);
      setWalletBalance(balanceResponse.data.wallet.balance);

      // Check payment eligibility
      const eligibilityResponse = await checkWalletPaymentEligibility(token, {
        transactionId,
        bookingId
      });
      setEligibility(eligibilityResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallet data');
      onError(err.message || 'Failed to fetch wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletPayment = async () => {
    try {
      setProcessing(true);
      setError(null);
      const token = getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await processWalletPayment(token, {
        transactionId,
        bookingId
      });

      onSuccess(response.data);
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      onError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Wallet Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading wallet information...</p>
            </div>
          ) : error ? (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          ) : (
            <>
              {/* Wallet Balance */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Current Balance:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(walletBalance)}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Booking Amount:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                </div>
                
                {eligibility && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Required Amount:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(eligibility.requiredAmount)}</span>
                    </div>
                    
                    {!eligibility.eligible && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Insufficient Amount:</span>
                        <span className="font-medium text-red-600">{formatCurrency(eligibility.insufficientAmount)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Eligibility Status */}
              {eligibility && (
                <div className={`mb-6 p-4 rounded-lg ${
                  eligibility.eligible 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center">
                    {eligibility.eligible ? (
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`font-medium ${
                      eligibility.eligible ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {eligibility.eligible 
                        ? 'Sufficient balance for payment' 
                        : 'Insufficient balance for payment'
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {eligibility?.eligible ? (
                  <button
                    onClick={handleWalletPayment}
                    disabled={processing}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {processing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing Payment...
                      </div>
                    ) : (
                      `Pay ${formatCurrency(amount)} with Wallet`
                    )}
                  </button>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      Insufficient wallet balance
                    </p>
                    <p className="text-xs text-gray-500">
                      Please contact admin to add funds to your wallet
                    </p>
                  </div>
                )}
                
                <button
                  onClick={onClose}
                  className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Wallet payments are processed instantly and cannot be reversed.
                  <br />
                  Failed bookings will automatically refund to your wallet.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 