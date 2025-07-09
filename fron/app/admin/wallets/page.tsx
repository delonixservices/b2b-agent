'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllCompaniesWithWallets, updateCompanyWallet, CompanyWithWallet } from '../../services/adminApi';
import { isAuthenticated, getAdminToken, logoutAdmin } from '../../utils/authUtils';

export default function WalletsPage() {
  const [companies, setCompanies] = useState<CompanyWithWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithWallet | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletForm, setWalletForm] = useState({
    amount: '',
    action: 'add' as 'add' | 'deduct',
    reason: ''
  });
  const [updatingWallet, setUpdatingWallet] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    fetchCompanies();
  }, [currentPage, statusFilter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAdminToken();
      if (!token) {
        throw new Error('No admin token found');
      }

      const response = await getAllCompaniesWithWallets(token, statusFilter as any, currentPage, 10);
      setCompanies(response.data.companies);
      setTotalPages(response.data.pagination.pages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch companies');
      if (err.message === 'Unauthorized') {
        logoutAdmin();
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWalletUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      setUpdatingWallet(true);
      setError(null);
      const token = getAdminToken();
      if (!token) {
        throw new Error('No admin token found');
      }

      const amount = parseFloat(walletForm.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      await updateCompanyWallet(token, selectedCompany._id, {
        amount,
        action: walletForm.action,
        reason: walletForm.reason || `${walletForm.action === 'add' ? 'Credit' : 'Debit'} by admin`
      });

      // Refresh the companies list
      await fetchCompanies();
      setShowWalletModal(false);
      setSelectedCompany(null);
      setWalletForm({ amount: '', action: 'add', reason: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to update wallet');
    } finally {
      setUpdatingWallet(false);
    }
  };

  const openWalletModal = (company: CompanyWithWallet) => {
    setSelectedCompany(company);
    setShowWalletModal(true);
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(balance);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'deactivated':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Wallet Management</h1>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallet Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      <div className="text-sm text-gray-500">{company.phone}</div>
                      <div className="text-sm text-gray-500">#{company.companyNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(company.status)}`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatBalance(company.wallet?.balance || 0)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {company.wallet?.currency || 'INR'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.wallet?.lastUpdated ? formatDate(company.wallet.lastUpdated) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openWalletModal(company)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                    >
                      Manage Wallet
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Wallet Update Modal */}
      {showWalletModal && selectedCompany && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Manage Wallet - {selectedCompany.name}
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Current Balance: <span className="font-medium">{formatBalance(selectedCompany.wallet?.balance || 0)}</span>
                </p>
              </div>
              <form onSubmit={handleWalletUpdate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <select
                    value={walletForm.action}
                    onChange={(e) => setWalletForm({ ...walletForm, action: e.target.value as 'add' | 'deduct' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="add">Add Funds</option>
                    <option value="deduct">Deduct Funds</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount ({selectedCompany.wallet?.currency || 'INR'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={walletForm.amount}
                    onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={walletForm.reason}
                    onChange={(e) => setWalletForm({ ...walletForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Enter reason for this transaction"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWalletModal(false);
                      setSelectedCompany(null);
                      setWalletForm({ amount: '', action: 'add', reason: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingWallet}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingWallet ? 'Updating...' : 'Update Wallet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 