'use client';

import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { getWalletBalance } from '../services/hotelApi';
import { getToken } from '../utils/authUtils';

interface WalletData {
  balance: number;
  currency: string;
  lastUpdated: string;
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      setLoadingWallet(true);
      const token = getToken();
      if (!token) return;
      const response = await getWalletBalance(token);
      setWalletData(response.data.wallet);
    } catch (error) {
      setWalletData(null);
    } finally {
      setLoadingWallet(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Wallet Balance</h2>
            <p className="text-blue-100 mb-4">Your available balance for instant bookings</p>
            {loadingWallet ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                <span>Loading balance...</span>
              </div>
            ) : (
              <div className="text-4xl font-bold">
                {walletData ? formatCurrency(walletData.balance) : '₹0.00'}
              </div>
            )}
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-full">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        {walletData && (
          <div className="mt-4 text-sm text-blue-100">
            Last updated: {new Date(walletData.lastUpdated).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
} 