'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Calculator, Percent, Settings, CreditCard, AlertTriangle } from 'lucide-react';
import { 
  getConfig, 
  getAdminToken, 
  Config,
  ConfigResponse 
} from '../../services/adminApi';

export default function MarkupsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState('');
  const [calculationResult, setCalculationResult] = useState<any>(null);

  const token = getAdminToken();

  useEffect(() => {
    if (token) {
      fetchConfig();
    }
  }, [token]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response: ConfigResponse = await getConfig(token!);
      setConfig(response.data.config);
      setError(null);
    } catch (err) {
      setError('Failed to fetch configuration');
      console.error('Error fetching configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!calculatorAmount || isNaN(Number(calculatorAmount))) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_PATH}/api/owner/config/calculate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: Number(calculatorAmount) }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate markup');
      }

      const result = await response.json();
      setCalculationResult(result.data);
      setError(null);
    } catch (err) {
      setError('Failed to calculate markup');
      console.error('Error calculating markup:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatValue = (type: 'fixed' | 'percentage', value: number) => {
    if (type === 'percentage') {
      return `${value}%`;
    }
    return `₹${value}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Configuration</h1>
          <p className="text-gray-600">Manage global pricing settings for all hotel bookings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculator</span>
          </button>
          {!config && (
            <button
              onClick={() => window.location.href = '/admin/markups/create'}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Configuration</span>
            </button>
          )}
        </div>
      </div>

      {/* Calculator */}
      {showCalculator && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Markup Calculator</h3>
          <div className="flex space-x-3">
            <input
              type="number"
              placeholder="Enter amount"
              value={calculatorAmount}
              onChange={(e) => setCalculatorAmount(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCalculate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Calculate
            </button>
          </div>
          
          {calculationResult && (
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Original Amount:</span>
                  <p className="text-gray-600">₹{calculationResult.originalAmount}</p>
                </div>
                <div>
                  <span className="font-medium">Markup Amount:</span>
                  <p className="text-gray-600">₹{calculationResult.markup.amount}</p>
                </div>
                <div>
                  <span className="font-medium">Final Amount:</span>
                  <p className="text-lg font-bold text-green-600">₹{calculationResult.finalAmount}</p>
                </div>
              </div>
              
              <div className="mt-3">
                <span className="font-medium text-sm">Markup Details:</span>
                <div className="mt-2 text-xs text-gray-600">
                  {calculationResult.markup.type === 'percentage' ? `${calculationResult.markup.value}%` : `₹${calculationResult.markup.value}`} = ₹{calculationResult.markup.amount}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Configuration Display */}
      {config ? (
        <div className="space-y-6">
          {/* Markup Configuration */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <Percent className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Markup Configuration</h2>
                </div>
                <button
                  onClick={() => window.location.href = '/admin/markups/edit'}
                  className="text-indigo-600 hover:text-indigo-900 p-2"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Type</div>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      config.markup.type === 'percentage' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {config.markup.type}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Value</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {formatValue(config.markup.type, config.markup.value)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Charge Configuration */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Service Charge Configuration</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Type</div>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      config.service_charge.type === 'percentage' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {config.service_charge.type}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Value</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {formatValue(config.service_charge.type, config.service_charge.value)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Processing Fee */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Processing Fee</h2>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-500">Fixed Amount</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  ₹{config.processing_fee}
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Charge */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900">Cancellation Charge</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Type</div>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      config.cancellation_charge.type === 'percentage' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {config.cancellation_charge.type}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Value</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {formatValue(config.cancellation_charge.type, config.cancellation_charge.value)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500">
            Last updated: {formatDate(config.updated_at)}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 mb-4">
            <Settings className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No configuration set</h3>
          <p className="text-gray-500 mb-4">Create a pricing configuration to apply to all hotel bookings.</p>
          <button
            onClick={() => window.location.href = '/admin/markups/create'}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Configuration</span>
          </button>
        </div>
      )}
    </div>
  );
} 