"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getCompanyById,
  getAdminToken,
  verifyCompany,
} from "../../../services/adminApi";

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

interface Company {
  _id: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  status: 'pending' | 'verified' | 'deactivated';
  createdAt: string;
  updatedAt: string;
  gst?: string;
  docs?: string[];
  numPeople?: number;
  companyNumber?: number;
}

export default function CompanyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.id as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = getAdminToken();
      if (!token) {
        router.push("/admin/login");
        return;
      }
      try {
        setLoading(true);
        setError("");
        
        // Fetch company info
        const companyRes = await getCompanyById(token, companyId);
        setCompany(companyRes.data.company);
        
        // Fetch employees
        const empRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3334"}/api/owner/companies/${companyId}/employees`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!empRes.ok) throw new Error("Failed to fetch employees");
        const empData = await empRes.json();
        setEmployees(empData.data.employees);
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    if (companyId) fetchData();
  }, [companyId, router]);

  const handleCompanyAction = async (action: 'verify' | 'deactivate') => {
    const token = getAdminToken();
    if (!token || !company) return;

    try {
      setActionLoading(true);
      await verifyCompany(token, companyId, action);
      
      // Refresh company data
      const companyRes = await getCompanyById(token, companyId);
      setCompany(companyRes.data.company);
      
      // Show success message
      alert(`Company ${action === 'verify' ? 'verified' : 'deactivated'} successfully!`);
    } catch (err: any) {
      setError(err.message || `Failed to ${action} company`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'deactivated': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending Verification';
      case 'deactivated': return 'Deactivated';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">🔍</div>
          <p className="text-gray-600 mb-4">Company not found.</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.back()}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            ← Back to Companies
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {company.companyName || company.name}
              </h1>
              <p className="text-gray-600 mt-2">Company ID: {company._id}</p>
            </div>
            <div className="flex gap-3">
              {company.status === 'pending' && (
                <button
                  onClick={() => handleCompanyAction('verify')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Verifying...' : 'Verify Company'}
                </button>
              )}
              {company.status === 'verified' && (
                <button
                  onClick={() => handleCompanyAction('deactivate')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Deactivating...' : 'Deactivate Company'}
                </button>
              )}
              {company.status === 'deactivated' && (
                <button
                  onClick={() => handleCompanyAction('verify')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Reactivating...' : 'Reactivate Company'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Company Name</label>
              <p className="text-gray-900 font-medium">{company.companyName || company.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="text-gray-900">{company.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
              <p className="text-gray-900">{company.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
              <p className="text-gray-900">{company.address || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(company.status)}`}>
                {getStatusText(company.status)}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Active</label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${company.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                {company.isActive ? 'Yes' : 'No'}
              </span>
            </div>
            {company.numPeople && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Number of People</label>
                <p className="text-gray-900">{company.numPeople}</p>
              </div>
            )}
            {company.companyNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Company Number</label>
                <p className="text-gray-900">{company.companyNumber}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
              <p className="text-gray-900">{new Date(company.createdAt).toLocaleString()}</p>
            </div>
        <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
              <p className="text-gray-900">{new Date(company.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Employees Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Employees ({employees.length})</h2>
      </div>
          
      {employees.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">👥</div>
              <p className="text-gray-600">No employees found for this company.</p>
            </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${emp.isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(emp.createdAt).toLocaleDateString()}
                      </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </div>
      </div>
    </div>
  );
} 