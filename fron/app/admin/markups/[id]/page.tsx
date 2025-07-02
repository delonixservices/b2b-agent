'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, AlertCircle, Calendar, User } from 'lucide-react';
import { getMarkupById, deleteMarkup, getAdminToken, Markup } from '../../../services/adminApi';

export default function MarkupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const token = getAdminToken();
  
  const [markup, setMarkup] = useState<Markup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const markupId = params.id as string;

  useEffect(() => {
    if (token && markupId) {
      fetchMarkup();
    }
  }, [token, markupId]);

  const fetchMarkup = async () => {
    try {
      setLoading(true);
      const response = await getMarkupById(token!, markupId);
      setMarkup(response.data.markup);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch markup details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this markup? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMarkup(token!, markupId);
      router.push('/admin/markups');
    } catch (err: any) {
      setError(err.message || 'Failed to delete markup');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !markup) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
        
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
          <p className="text-gray-500">{error || 'Markup not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{markup.name}</h1>
            <p className="text-gray-600">Markup Details</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => router.push(`/admin/markups/${markupId}/edit`)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Markup Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Name</label>
              <p className="mt-1 text-sm text-gray-900">{markup.name}</p>
            </div>

            {markup.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-sm text-gray-900">{markup.description}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500">Type</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                markup.type === 'percentage' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {markup.type}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Value</label>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatValue(markup)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                markup.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {markup.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Created By</label>
              <div className="mt-1 flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{markup.createdBy.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Created At</label>
              <div className="mt-1 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{formatDate(markup.createdAt)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Last Updated</label>
              <div className="mt-1 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{formatDate(markup.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Example Calculation */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Example Calculation</h2>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">For an amount of ₹1,000:</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Original Amount:</span>
              <span className="font-medium">₹1,000.00</span>
            </div>
            
            <div className="flex justify-between">
              <span>Markup ({formatValue(markup)}):</span>
              <span className="font-medium">
                {markup.type === 'percentage' 
                  ? `₹${(markup.value * 10).toFixed(2)}`
                  : `₹${markup.value.toFixed(2)}`
                }
              </span>
            </div>
            
            <div className="border-t pt-2 flex justify-between font-semibold text-green-600">
              <span>Final Amount:</span>
              <span>
                ₹{markup.type === 'percentage' 
                  ? (1000 + (markup.value * 10)).toFixed(2)
                  : (1000 + markup.value).toFixed(2)
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 