'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import { Plus, Users, UserX, UserCheck, Phone, Lock, User, Trash2, Edit, Eye, X, RefreshCw } from 'lucide-react'

interface Employee {
  _id: string
  employeeId: string
  name: string
  phone: string
  employeeNumber: number
  companyNumber: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AddEmployeeForm {
  name: string
  phone: string
  password: string
}

export default function NewUsersPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addFormData, setAddFormData] = useState<AddEmployeeForm>({
    name: '',
    phone: '',
    password: ''
  })
  const [addingEmployee, setAddingEmployee] = useState(false)
  const [deactivatingEmployee, setDeactivatingEmployee] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  }

  // Configure axios with auth token
  const api = axios.create({
    baseURL: `${process.env.NEXT_PUBLIC_API_PATH}/api/auth`,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Add request interceptor to include auth token
  api.interceptors.request.use((config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Add response interceptor to handle auth errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )

  // Fetch employees
  const fetchEmployees = async (showRefreshSpinner = false) => {
    try {
      if (showRefreshSpinner) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError('')
      
      const response = await api.get('/employees')
      
      if (response.data.success) {
        setEmployees(response.data.data.employees)
      } else {
        setError('Failed to fetch employees')
      }
    } catch (err: any) {
      console.error('Error fetching employees:', err)
      if (err.response?.status === 403) {
        setError(err.response.data.message || 'Access denied. Only companies can view employees.')
      } else {
        setError(err.response?.data?.message || 'Failed to fetch employees')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Add new employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!addFormData.name || !addFormData.phone || !addFormData.password) {
      setError('All fields are required')
      return
    }

    // Basic validation
    if (addFormData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (addFormData.phone.length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    try {
      setAddingEmployee(true)
      setError('')
      
      const response = await api.post('/employees', addFormData)
      
      if (response.data.success) {
        // Reset form and close modal
        setAddFormData({ name: '', phone: '', password: '' })
        setShowAddForm(false)
        
        // Refresh employees list
        await fetchEmployees()
        
        // Show success message (you could add a toast notification here)
        alert('Employee added successfully!')
      } else {
        setError('Failed to add employee')
      }
    } catch (err: any) {
      console.error('Error adding employee:', err)
      if (err.response?.status === 400) {
        setError(err.response.data.message || 'Invalid data provided')
      } else if (err.response?.status === 403) {
        setError(err.response.data.message || 'Access denied. Only companies can add employees.')
      } else {
        setError(err.response?.data?.message || 'Failed to add employee')
      }
    } finally {
      setAddingEmployee(false)
    }
  }

  // Deactivate employee
  const handleDeactivateEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to deactivate this employee? This action can be reversed later.')) {
      return
    }

    try {
      setDeactivatingEmployee(employeeId)
      setError('')
      
      const response = await api.put(`/employees/${employeeId}/deactivate`)
      
      if (response.data.success) {
        // Refresh employees list
        await fetchEmployees()
        
        // Show success message
        alert('Employee deactivated successfully!')
      } else {
        setError('Failed to deactivate employee')
      }
    } catch (err: any) {
      console.error('Error deactivating employee:', err)
      if (err.response?.status === 404) {
        setError('Employee not found')
      } else if (err.response?.status === 403) {
        setError(err.response.data.message || 'Access denied. Only companies can deactivate employees.')
      } else {
        setError(err.response?.data?.message || 'Failed to deactivate employee')
      }
    } finally {
      setDeactivatingEmployee(null)
    }
  }

  // Handle form input changes
  const handleInputChange = (field: keyof AddEmployeeForm, value: string) => {
    setAddFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees()
  }, [])

  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="mt-2 text-gray-600">Manage your company employees</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchEmployees(true)}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <UserX className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Employees List */}
      {!loading && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No employees</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first employee.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <li key={employee._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                          {employee.isActive ? (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <UserCheck className="mr-1 h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <UserX className="mr-1 h-3 w-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Phone className="mr-1 h-4 w-4" />
                          {employee.phone}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          ID: {employee.employeeId} | Employee #{employee.employeeNumber} | Company #{employee.companyNumber}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Created: {formatDate(employee.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {employee.isActive && (
                        <button
                          onClick={() => handleDeactivateEmployee(employee.employeeId)}
                          disabled={deactivatingEmployee === employee.employeeId}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {deactivatingEmployee === employee.employeeId ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="ml-1">Deactivate</span>
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Employee</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1 relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      value={addFormData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      id="phone"
                      value={addFormData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      id="password"
                      value={addFormData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter password (min 6 characters)"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingEmployee}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {addingEmployee ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </div>
                    ) : (
                      'Add Employee'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
