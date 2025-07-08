'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [bookingStatus, setBookingStatus] = useState<string>('')
  const [transactionId, setTransactionId] = useState<string>('')

  useEffect(() => {
    const status = searchParams.get('status')
    const txnId = searchParams.get('transactionId')
    
    setBookingStatus(status || '')
    setTransactionId(txnId || '')
    setLoading(false)
  }, [searchParams])

  const handleViewVoucher = () => {
    if (transactionId) {
      router.push(`/hotels/hotelvoucher?id=${transactionId}`)
    }
  }

  const handleBackToHotels = () => {
    router.push('/hotels')
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading confirmation...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {bookingStatus === 'confirmed' ? (
            <>
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
                <p className="text-lg text-gray-600 mb-4">
                  Your hotel booking has been successfully confirmed.
                </p>
                {transactionId && (
                  <p className="text-sm text-gray-500 mb-6">
                    Transaction ID: {transactionId}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleViewVoucher}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  View Booking Voucher
                </button>
                
                <button
                  onClick={handleBackToHotels}
                  className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Book Another Hotel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking in Progress</h1>
                <p className="text-lg text-gray-600 mb-4">
                  Your booking is being processed. You will be redirected to the payment gateway shortly.
                </p>
                {transactionId && (
                  <p className="text-sm text-gray-500 mb-6">
                    Transaction ID: {transactionId}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleBackToHotels}
                  className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back to Hotels
                </button>
              </div>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              If you have any questions about your booking, please contact our support team at{' '}
              <a href="mailto:support@delonixtravel.com" className="text-blue-600 hover:text-blue-800">
                support@delonixtravel.com
              </a>
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
} 