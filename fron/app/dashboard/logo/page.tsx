'use client';

import React from 'react';
import LogoUpload from '../details/LogoUpload';

export default function LogoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Logo Management</h1>
              <p className="text-gray-600">Upload, manage, and sync your company logo</p>
            </div>
          </div>
        </div>

        {/* Logo Upload Component */}
        <LogoUpload />

        {/* Additional Info */}
        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">Logo Management Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
            <div>
              <h4 className="font-medium mb-2">Local Storage</h4>
              <ul className="space-y-1">
                <li>• Fast access to logo URL</li>
                <li>• Works offline</li>
                <li>• Persists across browser sessions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Server Sync</h4>
              <ul className="space-y-1">
                <li>• Backup logo URL on server</li>
                <li>• Access from any device</li>
                <li>• Integrated with business details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 