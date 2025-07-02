'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Calculator, Percent } from 'lucide-react';
import { 
  getAllMarkups, 
  getAdminToken, 
  Markup,
  MarkupsResponse 
} from '../../services/adminApi';

export default function MarkupsPage() {
  const [markup, setMarkup] = useState<Markup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState('');
  const [calculationResult, setCalculationResult] = useState<any>(null);

  const token = getAdminToken();

  useEffect(() => {
    if (token) {
      fetchMarkup();
    }
  }, [token]);

  const fetchMarkup = async () => {
    try {
      setLoading(true);
      const response: MarkupsResponse = await getAllMarkups(token!);
      setMarkup(response.data.markup);
      setError(null);
    } catch (err) {
      setError('Failed to fetch markup');
      console.error('Error fetching markup:', err);
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
      const response = await fetch('http://localhost:3334/api/owner/markups/calculate', {
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

  const formatValue = (markup: Markup) => {
    if (markup.type === 'percentage') {
      return `${markup.value}%`;
    }
    return `₹${markup.value}`;
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
          <h1 className="text-2xl font-bold text-gray-900">Global Markup</h1>
          <p className="text-gray-600">Manage the global pricing markup for all hotels</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculator</span>
          </button>
          {!markup && (
            <button
              onClick={() => window.location.href = '/admin/markups/create'}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Markup</span>
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
                  {calculationResult.markup.name}: {calculationResult.markup.type === 'percentage' ? `${calculationResult.markup.value}%` : `₹${calculationResult.markup.value}`} = ₹{calculationResult.markup.amount}
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

      {/* Markup Display */}
      {markup ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{markup.name}</h2>
                {markup.description && (
                  <p className="text-gray-600 mt-1">{markup.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.location.href = `/admin/markups/${markup._id}`}
                  className="text-blue-600 hover:text-blue-900 p-2"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.location.href = `/admin/markups/${markup._id}/edit`}
                  className="text-indigo-600 hover:text-indigo-900 p-2"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-500">Type</div>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    markup.type === 'percentage' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {markup.type}
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-500">Value</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {formatValue(markup)}
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-500">Status</div>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    markup.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {markup.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Created: {formatDate(markup.createdAt)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 mb-4">
            <Percent className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No markup configured</h3>
          <p className="text-gray-500 mb-4">Create a global markup to apply to all hotel bookings.</p>
          <button
            onClick={() => window.location.href = '/admin/markups/create'}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Markup</span>
          </button>
        </div>
      )}
    </div>
  );
} 