'use client';

import React, { useState, useEffect } from 'react';
import { Building, MapPin, Mail, Phone, FileText, CreditCard } from 'lucide-react';
import LogoUpload from './LogoUpload';

interface BusinessDetails {
  gstNumber: string;
  panNumber: string;
  address: string;
  billingAddress: string;
  email: string;
  phone: string;
}

export default function BusinessDetailsPage() {
  const [formData, setFormData] = useState<BusinessDetails>({
    gstNumber: '',
    panNumber: '',
    address: '',
    billingAddress: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');

  // Load existing business details on component mount
  const loadBusinessDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoadingData(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_PATH}/api/auth/business-details`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.data.businessDetails && data.data.businessDetails.address) {
        setFormData({
          gstNumber: data.data.businessDetails.gstNumber || '',
          panNumber: data.data.businessDetails.panNumber || '',
          address: data.data.businessDetails.address || '',
          billingAddress: data.data.businessDetails.billingAddress || '',
          email: data.data.businessDetails.email || '',
          phone: data.data.businessDetails.phone || ''
        });
        setIsSubmitted(true);
        setMessage({ type: 'success', text: 'Business details have already been submitted. You can only submit once.' });
      } else {
        // No existing business details, allow user to enter information
        setIsSubmitted(false);
        setMessage(null);
      }

      // Set logo URL if available
      if (data.success && data.data.logo) {
        setLogoUrl(data.data.logo);
      }
    } catch (error) {
      console.error('Error loading business details:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load business details on component mount
  useEffect(() => {
    loadBusinessDetails();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.address.trim()) {
      setMessage({ type: 'error', text: 'Address is required' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({ type: 'error', text: 'Please login to save business details' });
        return;
      }

      // Include logo URL in the request if available
      const requestData = {
        ...formData,
        logoUrl: logoUrl || undefined
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_PATH}/api/auth/save-business-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Business details submitted successfully!' });
        setIsSubmitted(true);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit business details' });
        // If it's an error about already submitted, show the existing data
        if (data.data && data.data.businessDetails) {
          setFormData({
            gstNumber: data.data.businessDetails.gstNumber || '',
            panNumber: data.data.businessDetails.panNumber || '',
            address: data.data.businessDetails.address || '',
            billingAddress: data.data.businessDetails.billingAddress || '',
            email: data.data.businessDetails.email || '',
            phone: data.data.businessDetails.phone || ''
          });
          setIsSubmitted(true);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Details</h1>
              <p className="text-gray-600">
                {isSubmitted 
                  ? 'View your submitted business information and billing details' 
                  : 'Update your business information and billing details'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {isSubmitted && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-800 font-medium">Read-only mode: Business details have been submitted</span>
              </div>
            </div>
          )}
          {isLoadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading business details...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}
            
            {/* Ready to enter message */}
            {!isSubmitted && !isLoadingData && !message && (
              <div className="p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                Please fill in your business details below. All fields except address are optional.
              </div>
            )}

            {/* GST Number */}
            <div>
              <label htmlFor="gstNumber" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                <span>GST Number</span>
                <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                id="gstNumber"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleInputChange}
                placeholder="e.g., 22AAAAA0000A1Z5"
                disabled={isSubmitted}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                  isSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* PAN Number */}
            <div>
              <label htmlFor="panNumber" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                <span>PAN Number</span>
                <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                id="panNumber"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleInputChange}
                placeholder="e.g., ABCDE1234F"
                disabled={isSubmitted}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                  isSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                <span>Address</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your complete business address"
                rows={3}
                required
                disabled={isSubmitted}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                  isSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Billing Address */}
            <div>
              <label htmlFor="billingAddress" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4" />
                <span>Billing Address</span>
                <span className="text-gray-400">(Optional - will use main address if not provided)</span>
              </label>
              <textarea
                id="billingAddress"
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleInputChange}
                placeholder="Enter billing address (if different from main address)"
                rows={3}
                disabled={isSubmitted}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                  isSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4" />
                <span>Email Address</span>
                <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="business@example.com"
                disabled={isSubmitted}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                  isSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4" />
                <span>Phone Number</span>
                <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="9876543210"
                disabled={isSubmitted}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                  isSubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              {!isSubmitted ? (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Submitting...' : 'Submit Business Details'}
                </button>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Business Details Already Submitted
                  </div>
                </div>
              )}
            </div>
          </form>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Information</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Only the address field is mandatory</li>
            <li>• GST and PAN numbers are optional but recommended for business transactions</li>
            <li>• If billing address is not provided, your main address will be used</li>
            <li>• Phone number should be 10 digits starting with 6-9</li>
            <li>• Email address will be validated for proper format</li>
            <li>• <strong>Business details can only be submitted once and cannot be modified later</strong></li>
          </ul>
        </div>

        {/* Logo Upload Section */}
        <div className="mt-8">
          <LogoUpload onLogoChange={setLogoUrl} />
        </div>
      </div>
    </div>
  );
} 