'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MarkupData {
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
}

interface MarkupCalculation {
  basePrice: number;
  markupAmount: number;
  finalPrice: number;
  markup: MarkupData;
}

export default function MarkupPage() {
  const router = useRouter();
  const [markup, setMarkup] = useState<MarkupData>({
    type: 'percentage',
    value: 0,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [calculation, setCalculation] = useState<MarkupCalculation | null>(null);
  const [testPrice, setTestPrice] = useState('');

  // Fetch current markup on component mount
  useEffect(() => {
    fetchMarkup();
  }, []);

  const fetchMarkup = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:3334/api/company/markup', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setMarkup(data.data.company.markup);
      } else {
        setMessage(data.message || 'Failed to fetch markup');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error fetching markup:', error);
      setMessage('Failed to fetch markup');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkupChange = (field: keyof MarkupData, value: any) => {
    setMarkup(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveMarkup = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:3334/api/company/markup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(markup)
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('Markup saved successfully!');
        setMessageType('success');
        setMarkup(data.data.company.markup);
      } else {
        setMessage(data.message || 'Failed to save markup');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error saving markup:', error);
      setMessage('Failed to save markup');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const calculateMarkup = async () => {
    if (!testPrice || isNaN(Number(testPrice))) {
      setMessage('Please enter a valid price');
      setMessageType('error');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:3334/api/company/markup/calculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ basePrice: parseFloat(testPrice) })
      });

      const data = await response.json();
      
      if (data.success) {
        setCalculation(data.data);
        setMessage('Markup calculated successfully!');
        setMessageType('success');
      } else {
        setMessage(data.message || 'Failed to calculate markup');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error calculating markup:', error);
      setMessage('Failed to calculate markup');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const toggleMarkup = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:3334/api/company/markup/toggle', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !markup.isActive })
      });

      const data = await response.json();
      
      if (data.success) {
        setMarkup(prev => ({ ...prev, isActive: !prev.isActive }));
        setMessage(`Markup ${!markup.isActive ? 'activated' : 'deactivated'} successfully!`);
        setMessageType('success');
      } else {
        setMessage(data.message || 'Failed to toggle markup');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error toggling markup:', error);
      setMessage('Failed to toggle markup');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Markup Management</h1>
            <p className="text-gray-600">
              Configure your markup settings to add profit margins to hotel bookings.
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              messageType === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* Current Markup Status */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Current Markup Status</h3>
                <p className="text-blue-700">
                  {markup.isActive ? 'Active' : 'Inactive'} - {markup.type === 'percentage' ? `${markup.value}%` : `₹${markup.value}`}
                </p>
              </div>
              <button
                onClick={toggleMarkup}
                disabled={loading}
                className={`px-4 py-2 rounded-md font-medium ${
                  markup.isActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } disabled:opacity-50`}
              >
                {loading ? 'Loading...' : (markup.isActive ? 'Deactivate' : 'Activate')}
              </button>
            </div>
          </div>

          {/* Markup Configuration Form */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configure Markup</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Markup Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Markup Type
                </label>
                <select
                  value={markup.type}
                  onChange={(e) => handleMarkupChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              {/* Markup Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Markup Value
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={markup.value}
                    onChange={(e) => handleMarkupChange('value', parseFloat(e.target.value) || 0)}
                    min="0"
                    max={markup.type === 'percentage' ? 100 : undefined}
                    step={markup.type === 'percentage' ? 0.1 : 1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={markup.type === 'percentage' ? '0.0' : '0'}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">
                      {markup.type === 'percentage' ? '%' : '₹'}
                    </span>
                  </div>
                </div>
                {markup.type === 'percentage' && (
                  <p className="mt-1 text-sm text-gray-500">Maximum: 100%</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={saveMarkup}
                disabled={loading}
                className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Markup'}
              </button>
            </div>
          </div>

          {/* Markup Calculator */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Markup Calculator</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (₹)
                </label>
                <input
                  type="number"
                  value={testPrice}
                  onChange={(e) => setTestPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1000"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={calculateMarkup}
                  disabled={loading || !testPrice}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? 'Calculating...' : 'Calculate'}
                </button>
              </div>
            </div>

            {/* Calculation Results */}
            {calculation && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Calculation Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Base Price</p>
                    <p className="text-lg font-semibold text-gray-900">₹{calculation.basePrice.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Markup Amount</p>
                    <p className="text-lg font-semibold text-blue-600">₹{calculation.markupAmount.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Final Price</p>
                    <p className="text-lg font-semibold text-green-600">₹{calculation.finalPrice.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-500">
                    Applied: {calculation.markup.type === 'percentage' ? `${calculation.markup.value}%` : `₹${calculation.markup.value}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Information Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">How Markup Works</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• <strong>Percentage Markup:</strong> Adds a percentage of the base price (e.g., 10% on ₹1000 = ₹100 markup)</li>
              <li>• <strong>Fixed Markup:</strong> Adds a fixed amount regardless of the base price (e.g., ₹200 on any booking)</li>
              <li>• Markup is applied to all hotel bookings made by your employees</li>
              <li>• You can activate/deactivate markup without changing the configuration</li>
              <li>• Use the calculator above to preview how markup affects pricing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 