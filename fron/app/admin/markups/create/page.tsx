'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { createMarkup, getAdminToken } from '../../../services/adminApi';

export default function CreateMarkupPage() {
  const router = useRouter();
  const token = getAdminToken();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'percentage' as 'fixed' | 'percentage',
    value: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.value) {
      errors.value = 'Value is required';
    } else {
      const numValue = Number(formData.value);
      if (isNaN(numValue) || numValue < 0) {
        errors.value = 'Value must be a positive number';
      } else if (formData.type === 'percentage' && numValue > 100) {
        errors.value = 'Percentage cannot exceed 100%';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      await createMarkup(token!, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        value: Number(formData.value)
      });

      router.push('/admin/markups');
    } catch (err: any) {
      setError(err.message || 'Failed to create markup');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Create Global Markup</h1>
          <p className="text-gray-600">Set the global pricing markup for all hotels</p>
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
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Markup Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., Service Fee, Processing Fee"
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description of this markup"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Markup Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="relative">
                <input
                  type="radio"
                  name="type"
                  value="percentage"
                  checked={formData.type === 'percentage'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.type === 'percentage'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.type === 'percentage'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.type === 'percentage' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">Percentage</div>
                      <div className="text-sm text-gray-500">Add a percentage of the amount</div>
                    </div>
                  </div>
                </div>
              </label>

              <label className="relative">
                <input
                  type="radio"
                  name="type"
                  value="fixed"
                  checked={formData.type === 'fixed'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.type === 'fixed'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.type === 'fixed'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.type === 'fixed' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">Fixed Amount</div>
                      <div className="text-sm text-gray-500">Add a fixed amount</div>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Value */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
              {formData.type === 'percentage' ? 'Percentage Value *' : 'Fixed Amount *'}
            </label>
            <div className="relative">
              <input
                type="number"
                id="value"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                step={formData.type === 'percentage' ? '0.01' : '1'}
                min="0"
                max={formData.type === 'percentage' ? '100' : undefined}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.value ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={formData.type === 'percentage' ? 'e.g., 15' : 'e.g., 100'}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">
                  {formData.type === 'percentage' ? '%' : '₹'}
                </span>
              </div>
            </div>
            {validationErrors.value && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.value}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formData.type === 'percentage' 
                ? 'Enter a value between 0 and 100' 
                : 'Enter the fixed amount to add'
              }
            </p>
          </div>

          {/* Preview */}
          {formData.value && !validationErrors.value && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
              <div className="text-sm text-gray-600">
                <p>For an amount of ₹1,000:</p>
                <p className="font-medium">
                  {formData.type === 'percentage' 
                    ? `Markup: ${formData.value}% = ₹${(Number(formData.value) * 10).toFixed(2)}`
                    : `Markup: ₹${formData.value}`
                  }
                </p>
                <p className="font-medium text-green-600">
                  Final Amount: ₹{formData.type === 'percentage' 
                    ? (1000 + (Number(formData.value) * 10)).toFixed(2)
                    : (1000 + Number(formData.value)).toFixed(2)
                  }
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Global Markup'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 