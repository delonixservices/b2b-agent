'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, Percent, Settings, CreditCard, AlertTriangle } from 'lucide-react';
import { getConfig, updateConfig, getAdminToken } from '../../../services/adminApi';

export default function EditConfigPage() {
  const router = useRouter();
  const token = getAdminToken();
  
  const [formData, setFormData] = useState({
    markup: {
      type: 'percentage' as 'fixed' | 'percentage',
      value: ''
    },
    service_charge: {
      type: 'percentage' as 'fixed' | 'percentage',
      value: ''
    },
    processing_fee: '',
    cancellation_charge: {
      type: 'percentage' as 'fixed' | 'percentage',
      value: ''
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (token) {
      fetchConfig();
    }
  }, [token]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await getConfig(token!);
      const config = response.data.config;
      
      setFormData({
        markup: {
          type: config.markup.type,
          value: config.markup.value.toString()
        },
        service_charge: {
          type: config.service_charge.type,
          value: config.service_charge.value.toString()
        },
        processing_fee: config.processing_fee.toString(),
        cancellation_charge: {
          type: config.cancellation_charge.type,
          value: config.cancellation_charge.value.toString()
        }
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch configuration');
      console.error('Error fetching configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    // Validate markup
    if (!formData.markup.value) {
      errors.markupValue = 'Markup value is required';
    } else {
      const numValue = Number(formData.markup.value);
      if (isNaN(numValue) || numValue < 0) {
        errors.markupValue = 'Markup value must be a positive number';
      } else if (formData.markup.type === 'percentage' && numValue > 100) {
        errors.markupValue = 'Markup percentage cannot exceed 100%';
      }
    }

    // Validate service charge
    if (!formData.service_charge.value) {
      errors.serviceChargeValue = 'Service charge value is required';
    } else {
      const numValue = Number(formData.service_charge.value);
      if (isNaN(numValue) || numValue < 0) {
        errors.serviceChargeValue = 'Service charge value must be a positive number';
      } else if (formData.service_charge.type === 'percentage' && numValue > 100) {
        errors.serviceChargeValue = 'Service charge percentage cannot exceed 100%';
      }
    }

    // Validate processing fee
    if (!formData.processing_fee) {
      errors.processingFee = 'Processing fee is required';
    } else {
      const numValue = Number(formData.processing_fee);
      if (isNaN(numValue) || numValue < 0) {
        errors.processingFee = 'Processing fee must be a positive number';
      }
    }

    // Validate cancellation charge
    if (!formData.cancellation_charge.value) {
      errors.cancellationChargeValue = 'Cancellation charge value is required';
    } else {
      const numValue = Number(formData.cancellation_charge.value);
      if (isNaN(numValue) || numValue < 0) {
        errors.cancellationChargeValue = 'Cancellation charge value must be a positive number';
      } else if (formData.cancellation_charge.type === 'percentage' && numValue > 100) {
        errors.cancellationChargeValue = 'Cancellation charge percentage cannot exceed 100%';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      await updateConfig(token!, {
        markup: {
          type: formData.markup.type,
          value: Number(formData.markup.value)
        },
        service_charge: {
          type: formData.service_charge.type,
          value: Number(formData.service_charge.value)
        },
        processing_fee: Number(formData.processing_fee),
        cancellation_charge: {
          type: formData.cancellation_charge.type,
          value: Number(formData.cancellation_charge.value)
        }
      });

      router.push('/admin/markups');
    } catch (err: any) {
      setError(err.message || 'Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section: string, field: string, value: string) => {
    if (section === 'markup' || section === 'service_charge' || section === 'cancellation_charge') {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear validation error when user starts typing
    const errorKey = section === 'markup' || section === 'service_charge' || section === 'cancellation_charge' 
      ? `${section}Value` 
      : field;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
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
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Pricing Configuration</h1>
          <p className="text-gray-600">Update global pricing settings for all hotel bookings</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Markup Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Percent className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Markup Configuration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Markup Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative">
                    <input
                      type="radio"
                      name="markupType"
                      value="percentage"
                      checked={formData.markup.type === 'percentage'}
                      onChange={(e) => handleInputChange('markup', 'type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.markup.type === 'percentage'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="text-center">
                        <div className="font-medium">Percentage</div>
                        <div className="text-xs text-gray-500">% of amount</div>
                      </div>
                    </div>
                  </label>

                  <label className="relative">
                    <input
                      type="radio"
                      name="markupType"
                      value="fixed"
                      checked={formData.markup.type === 'fixed'}
                      onChange={(e) => handleInputChange('markup', 'type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.markup.type === 'fixed'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="text-center">
                        <div className="font-medium">Fixed</div>
                        <div className="text-xs text-gray-500">₹ amount</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="markupValue" className="block text-sm font-medium text-gray-700 mb-2">
                  Markup Value *
                </label>
                <input
                  type="number"
                  id="markupValue"
                  value={formData.markup.value}
                  onChange={(e) => handleInputChange('markup', 'value', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                    validationErrors.markupValue ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={formData.markup.type === 'percentage' ? '0-100' : '0'}
                  step="0.01"
                />
                {validationErrors.markupValue && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.markupValue}</p>
                )}
              </div>
            </div>
          </div>

          {/* Service Charge Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Service Charge Configuration</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Charge Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative">
                    <input
                      type="radio"
                      name="serviceChargeType"
                      value="percentage"
                      checked={formData.service_charge.type === 'percentage'}
                      onChange={(e) => handleInputChange('service_charge', 'type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.service_charge.type === 'percentage'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="text-center">
                        <div className="font-medium">Percentage</div>
                        <div className="text-xs text-gray-500">% of amount</div>
                      </div>
                    </div>
                  </label>

                  <label className="relative">
                    <input
                      type="radio"
                      name="serviceChargeType"
                      value="fixed"
                      checked={formData.service_charge.type === 'fixed'}
                      onChange={(e) => handleInputChange('service_charge', 'type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.service_charge.type === 'fixed'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="text-center">
                        <div className="font-medium">Fixed</div>
                        <div className="text-xs text-gray-500">₹ amount</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="serviceChargeValue" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Charge Value *
                </label>
                <input
                  type="number"
                  id="serviceChargeValue"
                  value={formData.service_charge.value}
                  onChange={(e) => handleInputChange('service_charge', 'value', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black ${
                    validationErrors.serviceChargeValue ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={formData.service_charge.type === 'percentage' ? '0-100' : '0'}
                  step="0.01"
                />
                {validationErrors.serviceChargeValue && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.serviceChargeValue}</p>
                )}
              </div>
            </div>
          </div>

          {/* Processing Fee */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Processing Fee</h2>
            </div>
            
            <div>
              <label htmlFor="processingFee" className="block text-sm font-medium text-gray-700 mb-2">
                Processing Fee Amount (₹) *
              </label>
              <input
                type="number"
                id="processingFee"
                value={formData.processing_fee}
                onChange={(e) => handleInputChange('', 'processing_fee', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black ${
                  validationErrors.processingFee ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0"
                step="0.01"
              />
              {validationErrors.processingFee && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.processingFee}</p>
              )}
            </div>
          </div>

          {/* Cancellation Charge */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Cancellation Charge</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Charge Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative">
                    <input
                      type="radio"
                      name="cancellationChargeType"
                      value="percentage"
                      checked={formData.cancellation_charge.type === 'percentage'}
                      onChange={(e) => handleInputChange('cancellation_charge', 'type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.cancellation_charge.type === 'percentage'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="text-center">
                        <div className="font-medium">Percentage</div>
                        <div className="text-xs text-gray-500">% of amount</div>
                      </div>
                    </div>
                  </label>

                  <label className="relative">
                    <input
                      type="radio"
                      name="cancellationChargeType"
                      value="fixed"
                      checked={formData.cancellation_charge.type === 'fixed'}
                      onChange={(e) => handleInputChange('cancellation_charge', 'type', e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.cancellation_charge.type === 'fixed'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="text-center">
                        <div className="font-medium">Fixed</div>
                        <div className="text-xs text-gray-500">₹ amount</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="cancellationChargeValue" className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Charge Value *
                </label>
                <input
                  type="number"
                  id="cancellationChargeValue"
                  value={formData.cancellation_charge.value}
                  onChange={(e) => handleInputChange('cancellation_charge', 'value', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-black ${
                    validationErrors.cancellationChargeValue ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={formData.cancellation_charge.type === 'percentage' ? '0-100' : '0'}
                  step="0.01"
                />
                {validationErrors.cancellationChargeValue && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.cancellationChargeValue}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Update Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 