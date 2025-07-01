'use client'

import { useState } from 'react'
import axios from 'axios'

interface SignupFormProps {
  onSuccess?: () => void
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'details'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [numPeople, setNumPeople] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tempToken, setTempToken] = useState('')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('http://localhost:3334/api/auth/send-otp', {
        phone
      })

      if (response.data.success) {
        setStep('otp')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('http://localhost:3334/api/auth/verify-otp', {
        phone,
        otp
      })

      if (response.data.success) {
        setTempToken(response.data.data.tempToken)
        setStep('details')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('http://localhost:3334/api/auth/complete-signup', {
        tempToken,
        name,
        agencyName,
        numPeople: parseInt(numPeople),
        password
      })

      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        onSuccess?.()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign Up</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Step 1: Phone Number */}
      {step === 'phone' && (
        <form onSubmit={handleSendOtp}>
          <div className="mb-4">
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {/* Step 2: OTP Verification */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp}>
          <div className="mb-4">
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              OTP sent to {phone} (Demo OTP: 111111)
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            type="button"
            onClick={() => setStep('phone')}
            className="w-full mt-2 text-blue-600 hover:text-blue-700"
          >
            Back to Phone
          </button>
        </form>
      )}

      {/* Step 3: Complete Details */}
      {step === 'details' && (
        <form onSubmit={handleCompleteSignup}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="agencyName" className="block text-sm font-medium text-gray-700 mb-2">
              Agency Name
            </label>
            <input
              type="text"
              id="agencyName"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              placeholder="Enter your agency name"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="numPeople" className="block text-sm font-medium text-gray-700 mb-2">
              Number of People
            </label>
            <input
              type="number"
              id="numPeople"
              value={numPeople}
              onChange={(e) => setNumPeople(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              placeholder="Enter number of people"
              min="1"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Complete Signup'}
          </button>
          <button
            type="button"
            onClick={() => setStep('otp')}
            className="w-full mt-2 text-blue-600 hover:text-blue-700"
          >
            Back to OTP
          </button>
        </form>
      )}
    </div>
  )
} 