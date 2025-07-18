'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Eye, EyeOff, CheckCircle, X, ArrowLeft, Lock, Smartphone } from 'lucide-react'
import { API_BASE_URL } from '../utils/config'
import { getOtpMessage } from '../utils/environment'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Password reset states
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetStep, setResetStep] = useState(1) // 1: phone, 2: OTP, 3: new password
  const [resetPhone, setResetPhone] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        phone,
        password
      })

      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        
        setShowSuccess(true)
        setTimeout(() => {
          // Redirect to hotels page
          router.push('/hotels')
        }, 1500)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSendResetOtp = async () => {
    if (!resetPhone) {
      setResetError('Please enter your phone number')
      return
    }

    setResetLoading(true)
    setResetError('')

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/send-password-reset-otp`, {
        phone: resetPhone
      })

      if (response.data.success) {
        setResetStep(2)
        setResetSuccess('OTP sent successfully!')
        setTimeout(() => setResetSuccess(''), 3000)
      }
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setResetLoading(false)
    }
  }

  const handleVerifyResetOtp = async () => {
    if (!resetOtp) {
      setResetError('Please enter the OTP')
      return
    }

    setResetLoading(true)
    setResetError('')

    try {
      // For now, just move to next step (in real app, you might want to verify OTP first)
      setResetStep(3)
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Failed to verify OTP')
    } finally {
      setResetLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setResetError('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long')
      return
    }

    setResetLoading(true)
    setResetError('')

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        phone: resetPhone,
        otp: resetOtp,
        newPassword
      })

      if (response.data.success) {
        setResetSuccess('Password reset successfully! You can now login with your new password.')
        setTimeout(() => {
          setShowResetModal(false)
          resetResetForm()
        }, 2000)
      }
    } catch (err: any) {
      setResetError(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setResetLoading(false)
    }
  }

  const resetResetForm = () => {
    setResetStep(1)
    setResetPhone('')
    setResetOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setResetError('')
    setResetSuccess('')
  }

  const openResetModal = () => {
    setShowResetModal(true)
    resetResetForm()
  }

  const closeResetModal = () => {
    setShowResetModal(false)
    resetResetForm()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your B2B Agent account</p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {showSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle size={20} />
                  <span>Login successful! Redirecting...</span>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 text-black placeholder-gray-500"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={openResetModal}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</h3>
            <p className="text-xs text-blue-700">
              Use any phone number and password from a completed signup to test the login functionality.
            </p>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Lock className="w-6 h-6 mr-2" />
                Reset Password
              </h2>
              <button
                onClick={closeResetModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {resetError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {resetError}
              </div>
            )}

            {resetSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {resetSuccess}
              </div>
            )}

            {/* Step 1: Phone Number */}
            {resetStep === 1 && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={resetPhone}
                      onChange={(e) => setResetPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                      placeholder="Enter your phone number"
                    />
                    <Smartphone className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <button
                  onClick={handleSendResetOtp}
                  disabled={resetLoading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {resetLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {resetStep === 2 && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                  />
                                     <p className="text-xs text-gray-500 mt-1">
                     {getOtpMessage(resetPhone).main}
                   </p>
                   <p className="text-xs text-gray-400 mt-1">
                     {getOtpMessage(resetPhone).sub}
                   </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setResetStep(1)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 inline mr-1" />
                    Back
                  </button>
                  <button
                    onClick={handleVerifyResetOtp}
                    disabled={resetLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {resetLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: New Password */}
            {resetStep === 3 && (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 text-black placeholder-gray-500"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 text-black placeholder-gray-500"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setResetStep(2)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 inline mr-1" />
                    Back
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
} 