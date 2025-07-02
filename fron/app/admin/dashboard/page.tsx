'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getDashboardStats, 
  getAllCompanies, 
  verifyCompany,
  type DashboardStats,
  type Company 
} from '../../services/adminApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'verified' | 'deactivated'>('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminInfo');
    
    if (!token) {
      router.push('/admin/login');
      return;
    }

    if (admin) {
      setAdminInfo(JSON.parse(admin));
    }

    fetchDashboardData(token);
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsData = await getDashboardStats(token);
      setStats(statsData);
      
      // Fetch companies based on active tab
      const companiesData = await getAllCompanies(token, activeTab === 'overview' ? undefined : activeTab, currentPage);
      setCompanies(companiesData.data.companies);
      setTotalPages(companiesData.data.pagination.totalPages);
      
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (tab: 'overview' | 'pending' | 'verified' | 'deactivated') => {
    setActiveTab(tab);
    setCurrentPage(1);
    
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const companiesData = await getAllCompanies(token, tab === 'overview' ? undefined : tab, 1);
        setCompanies(companiesData.data.companies);
        setTotalPages(companiesData.data.pagination.totalPages);
      } catch (err) {
        setError('Failed to fetch companies');
      }
    }
  };

  const handleVerifyCompany = async (companyId: string, action: 'verify' | 'deactivate') => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      await verifyCompany(token, companyId, action);
      // Refresh the data
      fetchDashboardData(token);
    } catch (err) {
      setError('Failed to update company status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-lg">Welcome back, Super Admin</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <span className="bg-blue-100 p-3 rounded-lg"><svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /></svg></span>
            <div>
              <div className="text-gray-500 text-sm">Total Companies</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalCompanies ?? 0}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <span className="bg-yellow-100 p-3 rounded-lg"><svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2 2" /></svg></span>
            <div>
              <div className="text-gray-500 text-sm">Pending</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.pendingCompanies ?? 0}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <span className="bg-green-100 p-3 rounded-lg"><svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></span>
            <div>
              <div className="text-gray-500 text-sm">Verified</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.verifiedCompanies ?? 0}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <span className="bg-red-100 p-3 rounded-lg"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></span>
            <div>
              <div className="text-gray-500 text-sm">Deactivated</div>
              <div className="text-2xl font-bold text-gray-900">{stats?.deactivatedCompanies ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex space-x-8 border-b border-gray-200 mb-4">
            {['All Companies', 'Pending Approval', 'Verified Companies', 'Deactivated Companies'].map((tab, idx) => {
              const tabKey = ['overview', 'pending', 'verified', 'deactivated'][idx] as typeof activeTab;
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tabKey)}
                  className={`pb-2 text-lg font-medium focus:outline-none transition-colors ${isActive ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-indigo-600'}`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Companies Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {companies.map((company) => (
                  <tr key={company._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-700 hover:underline cursor-pointer" onClick={() => router.push(`/admin/details/${company._id}`)}>{company.companyName || company.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{company.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {company.status === 'verified' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Verified</span>}
                      {company.status === 'pending' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>}
                      {company.status === 'deactivated' && <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Deactivated</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(company.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {company.status === 'deactivated' ? (
                        <button onClick={() => handleVerifyCompany(company._id, 'verify')} className="text-indigo-600 hover:underline font-semibold">Reactivate</button>
                      ) : company.status === 'verified' ? (
                        <button onClick={() => handleVerifyCompany(company._id, 'deactivate')} className="text-red-600 hover:underline font-semibold">Deactivate</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">No companies found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 