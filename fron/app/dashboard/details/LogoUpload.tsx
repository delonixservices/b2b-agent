'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Image, Link, Save, Download } from 'lucide-react';

interface LogoUploadProps {
  onLogoChange?: (logoUrl: string) => void;
}

export default function LogoUpload({ onLogoChange }: LogoUploadProps) {
  const [logoUrl, setLogoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load logo from localStorage on component mount
  useEffect(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
    setIsLoadingData(false);
  }, []);

  // Load logo from server
  const loadLogoFromServer = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({ type: 'error', text: 'Please login to load logo' });
        return;
      }

      setIsLoading(true);
      setMessage(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_PATH}/api/auth/logo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.data.logo) {
        setLogoUrl(data.data.logo);
        localStorage.setItem('companyLogo', data.data.logo);
        setMessage({ type: 'success', text: 'Logo loaded from server successfully!' });
        if (onLogoChange) {
          onLogoChange(data.data.logo);
        }
      } else {
        setMessage({ type: 'error', text: 'No logo found on server' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load logo from server' });
    } finally {
      setIsLoading(false);
    }
  };

  // Upload logo to server
  const uploadLogoToServer = async () => {
    if (!logoUrl.trim()) {
      setMessage({ type: 'error', text: 'Please enter a logo URL first' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setMessage({ type: 'error', text: 'Please login to upload logo' });
        return;
      }

      setIsLoading(true);
      setMessage(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_PATH}/api/auth/upload-logo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ logoUrl: logoUrl.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('companyLogo', logoUrl.trim());
        setMessage({ type: 'success', text: 'Logo uploaded to server successfully!' });
        if (onLogoChange) {
          onLogoChange(logoUrl.trim());
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to upload logo' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Save logo URL to localStorage only
  const saveToLocalStorage = () => {
    if (!logoUrl.trim()) {
      setMessage({ type: 'error', text: 'Please enter a logo URL first' });
      return;
    }

    localStorage.setItem('companyLogo', logoUrl.trim());
    setMessage({ type: 'success', text: 'Logo URL saved to local storage!' });
    if (onLogoChange) {
      onLogoChange(logoUrl.trim());
    }
  };

  // Clear logo
  const clearLogo = () => {
    setLogoUrl('');
    localStorage.removeItem('companyLogo');
    setMessage({ type: 'success', text: 'Logo cleared successfully!' });
    if (onLogoChange) {
      onLogoChange('');
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading logo...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 p-3 rounded-lg">
          <Image className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Company Logo</h2>
          <p className="text-gray-600">Upload or manage your company logo</p>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Logo URL Input */}
      <div className="mb-6">
        <label htmlFor="logoUrl" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
          <Link className="w-4 h-4" />
          <span>Logo URL</span>
        </label>
        <input
          type="url"
          id="logoUrl"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://example.com/company-logo.png"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
        />
      </div>

      {/* Logo Preview */}
      {logoUrl && (
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Logo Preview</label>
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <img 
              src={logoUrl} 
              alt="Company Logo" 
              className="max-w-xs max-h-32 object-contain mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                setMessage({ type: 'error', text: 'Failed to load image. Please check the URL.' });
              }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Save to Local Storage */}
        <button
          onClick={saveToLocalStorage}
          disabled={isLoading || !logoUrl.trim()}
          className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Local</span>
        </button>

        {/* Upload to Server */}
        <button
          onClick={uploadLogoToServer}
          disabled={isLoading || !logoUrl.trim()}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Server</span>
        </button>

        {/* Load from Server */}
        <button
          onClick={loadLogoFromServer}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Load Server</span>
        </button>

        {/* Clear Logo */}
        <button
          onClick={clearLogo}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>Clear</span>
        </button>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works:</h3>
        <ul className="space-y-1 text-xs text-blue-800">
          <li>• <strong>Save Local:</strong> Saves logo URL to browser's local storage only</li>
          <li>• <strong>Upload Server:</strong> Saves logo URL to both local storage and server database</li>
          <li>• <strong>Load Server:</strong> Retrieves logo URL from server and saves to local storage</li>
          <li>• <strong>Clear:</strong> Removes logo URL from local storage</li>
          <li>• Logo URL must be a valid image URL (https://example.com/image.png)</li>
        </ul>
      </div>
    </div>
  );
} 