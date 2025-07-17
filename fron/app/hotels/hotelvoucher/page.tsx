'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

interface VoucherData {
  _id: string;
  contactDetail: {
    name: string;
    last_name: string;
    email: string;
    mobile: string;
  };
  hotel: {
    originalName: string;
    location: {
      address: string;
      city: string;
      country?: string;
      countryCode?: string;
    };
  };
  pricing: {
    currency: string;
    total_chargeable_amount: number;
  };
  book_response?: {
    data: {
      book: {
        booking_id: string;
        status: string;
      };
    };
  };
  payment_response?: {
    order_status: string;
    payment_mode: string;
    bank_ref_no?: string;
  };
}

function HotelVoucherContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [voucherData, setVoucherData] = useState<VoucherData | null>(null)

  const bookingId = searchParams.get('id')

  useEffect(() => {
    if (bookingId) {
      fetchVoucherData()
    } else {
      setError('Booking ID is required')
      setLoading(false)
    }
  }, [bookingId])

  const fetchVoucherData = async () => {
    try {
      setLoading(true)
      setError(null)

      // For now, we'll simulate the data since we don't have the API endpoint yet
      // In a real implementation, you would fetch this from your backend
      const mockData: VoucherData = {
        _id: bookingId || '',
        contactDetail: {
          name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          mobile: '+91 9876543210'
        },
        hotel: {
          originalName: 'Sample Hotel',
          location: {
            address: '123 Main Street',
            city: 'Mumbai',
            country: 'India',
            countryCode: 'IN'
          }
        },
        pricing: {
          currency: 'INR',
          total_chargeable_amount: 5000
        },
        book_response: {
          data: {
            book: {
              booking_id: 'BK123456789',
              status: 'Confirmed'
            }
          }
        },
        payment_response: {
          order_status: 'Success',
          payment_mode: 'Credit Card',
          bank_ref_no: 'REF123456789'
        }
      }

      setVoucherData(mockData)
    } catch (err: any) {
      console.error('Error fetching voucher data:', err)
      setError(err.message || 'Failed to fetch voucher data')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
  }

  const handlePrintVoucher = () => {
    window.print()
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
            <p className="text-gray-600">Loading voucher...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !voucherData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error || 'Voucher not found'}</p>
            <button 
              onClick={handleBackToHotels}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Back to Hotels
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <button 
            onClick={handleBackToHotels}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Hotels
          </button>
          
          <button
            onClick={handlePrintVoucher}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Voucher
          </button>
        </div>

        {/* Voucher Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hotel Booking Voucher</h1>
            <p className="text-gray-600">Booking Confirmed</p>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Booking ID:</span>
                  <span className="ml-2 text-gray-900">{voucherData.book_response?.data.book.booking_id || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 text-green-600 font-semibold">{voucherData.book_response?.data.book.status || 'Confirmed'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Payment Status:</span>
                  <span className="ml-2 text-green-600 font-semibold">{voucherData.payment_response?.order_status || 'Success'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Payment Mode:</span>
                  <span className="ml-2 text-gray-900">{voucherData.payment_response?.payment_mode || 'N/A'}</span>
                </div>
                {voucherData.payment_response?.bank_ref_no && (
                  <div>
                    <span className="font-medium text-gray-700">Reference No:</span>
                    <span className="ml-2 text-gray-900">{voucherData.payment_response.bank_ref_no}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Hotel Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Hotel Name:</span>
                  <span className="ml-2 text-gray-900">{voucherData.hotel.originalName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Address:</span>
                  <span className="ml-2 text-gray-900">{voucherData.hotel.location.address}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">City:</span>
                  <span className="ml-2 text-gray-900">{voucherData.hotel.location.city}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Country:</span>
                  <span className="ml-2 text-gray-900">{voucherData.hotel.location.country || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-900">{voucherData.contactDetail.name} {voucherData.contactDetail.last_name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{voucherData.contactDetail.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Mobile:</span>
                <span className="ml-2 text-gray-900">{voucherData.contactDetail.mobile}</span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pricing</h2>
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-700">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(voucherData.pricing.total_chargeable_amount, voucherData.pricing.currency)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>This voucher serves as proof of your booking. Please present this at the hotel during check-in.</p>
            <p className="mt-2">For any queries, please contact our customer support.</p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default function HotelVoucherPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <HotelVoucherContent />
    </Suspense>
  )
} 