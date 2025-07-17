'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Wallet, CheckCircle, AlertCircle } from 'lucide-react'
import { getWalletBalance } from '../services/hotelApi'
import { getToken } from '../utils/authUtils'

interface PaymentMethodSelectorProps {
  amount: number
  currency: string
  onPaymentMethodSelect: (method: 'wallet' | 'gateway') => void
  selectedMethod: 'wallet' | 'gateway' | null
  transactionId: string
  bookingId: string
  onWalletPayment: () => void
  onGatewayPayment: () => void
  loading: boolean
}

interface WalletData {
  balance: number
  currency: string
  lastUpdated: string
}

export default function PaymentMethodSelector({
  amount,
  currency,
  onPaymentMethodSelect,
  selectedMethod,
  transactionId,
  bookingId,
  onWalletPayment,
  onGatewayPayment,
  loading
}: PaymentMethodSelectorProps) {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(true)
  const [walletError, setWalletError] = useState<string | null>(null)

  useEffect(() => {
    fetchWalletBalance()
  }, [])

  const fetchWalletBalance = async () => {
    try {
      setLoadingWallet(true)
      setWalletError(null)
      
      const token = getToken()
      if (!token) {
        setWalletError('Authentication required')
        return
      }

      const response = await getWalletBalance(token)
      setWalletData(response.data.wallet)
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
      setWalletError('Failed to load wallet balance')
    } finally {
      setLoadingWallet(false)
    }
  }

  const formatPrice = (price: number, curr: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0
    }).format(price)
  }

  const hasSufficientBalance = walletData && walletData.balance >= amount
  const walletShortfall = walletData ? Math.max(0, amount - walletData.balance) : 0

  const handleWalletSelect = () => {
    if (!hasSufficientBalance) {
      return
    }
    onPaymentMethodSelect('wallet')
  }

  const handleGatewaySelect = () => {
    onPaymentMethodSelect('gateway')
  }

  const handleProceed = () => {
    if (selectedMethod === 'wallet') {
      onWalletPayment()
    } else if (selectedMethod === 'gateway') {
      onGatewayPayment()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Choose Payment Method</h3>
      
      {/* Payment Amount Summary */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Amount:</span>
          <span className="text-2xl font-bold text-green-600">
            {formatPrice(amount, currency)}
          </span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4 mb-6">
        {/* Wallet Payment Option */}
        <div 
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'wallet' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          } ${!hasSufficientBalance ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleWalletSelect}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                selectedMethod === 'wallet' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <Wallet size={20} />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Pay with Wallet</h4>
                <p className="text-sm text-gray-600">Use your wallet balance</p>
              </div>
            </div>
            
            {selectedMethod === 'wallet' && (
              <CheckCircle className="text-blue-500" size={20} />
            )}
          </div>

          {/* Wallet Balance Info */}
          <div className="mt-3 pl-11">
            {loadingWallet ? (
              <div className="text-sm text-gray-500">Loading wallet balance...</div>
            ) : walletError ? (
              <div className="text-sm text-red-500 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {walletError}
              </div>
            ) : walletData ? (
              <div className="space-y-1">
                <div className="text-sm text-gray-600">
                  Available Balance: <span className="font-medium">{formatPrice(walletData.balance, walletData.currency)}</span>
                </div>
                
                {hasSufficientBalance ? (
                  <div className="text-sm text-green-600 flex items-center">
                    <CheckCircle size={14} className="mr-1" />
                    Sufficient balance available
                  </div>
                ) : (
                  <div className="text-sm text-red-600">
                    Insufficient balance. Shortfall: {formatPrice(walletShortfall, currency)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Wallet not available</div>
            )}
          </div>
        </div>

        {/* Payment Gateway Option */}
        <div 
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'gateway' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={handleGatewaySelect}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                selectedMethod === 'gateway' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <CreditCard size={20} />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Pay with Card/UPI</h4>
                <p className="text-sm text-gray-600">Credit Card, Debit Card, UPI, Net Banking</p>
              </div>
            </div>
            
            {selectedMethod === 'gateway' && (
              <CheckCircle className="text-blue-500" size={20} />
            )}
          </div>
        </div>
      </div>

      {/* Proceed Button */}
      <button
        onClick={handleProceed}
        disabled={!selectedMethod || loading || (selectedMethod === 'wallet' && !hasSufficientBalance)}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          !selectedMethod || loading || (selectedMethod === 'wallet' && !hasSufficientBalance)
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          `Proceed with ${selectedMethod === 'wallet' ? 'Wallet' : 'Card/UPI'} Payment`
        )}
      </button>

      {/* Additional Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• Wallet payments are instant and secure</p>
        <p>• Card/UPI payments are processed through CCAvenue</p>
        <p>• All payments are protected with SSL encryption</p>
      </div>
    </div>
  )
} 