'use client'

import { useState, useEffect } from 'react'
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

export default function HotelVoucherPage() {
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
            {voucherData.book_response?.data.book.booking_id && (
              <p className="text-sm text-gray-500 mt-2">
                Booking ID: {voucherData.book_response.data.book.booking_id}
              </p>
            )}
          </div>

          {/* Guest Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Guest Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900">{voucherData.contactDetail.name} {voucherData.contactDetail.last_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{voucherData.contactDetail.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Mobile:</span>
                  <p className="text-gray-900">{voucherData.contactDetail.mobile}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Hotel Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Hotel Name:</span>
                  <p className="text-gray-900">{voucherData.hotel.originalName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Address:</span>
                  <p className="text-gray-900">
                    {voucherData.hotel.location.address}, {voucherData.hotel.location.city}
                    {voucherData.hotel.location.country && `, ${voucherData.hotel.location.country}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="font-medium text-gray-700">Total Amount:</span>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(voucherData.pricing.total_chargeable_amount, voucherData.pricing.currency)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Payment Status:</span>
                <p className="text-green-600 font-semibold">
                  {voucherData.payment_response?.order_status === 'Success' ? 'Paid' : 'Pending'}
                </p>
              </div>
              {voucherData.payment_response?.payment_mode && (
                <div>
                  <span className="font-medium text-gray-700">Payment Method:</span>
                  <p className="text-gray-900">{voucherData.payment_response.payment_mode}</p>
                </div>
              )}
              {voucherData.payment_response?.bank_ref_no && (
                <div>
                  <span className="font-medium text-gray-700">Reference Number:</span>
                  <p className="text-gray-900">{voucherData.payment_response.bank_ref_no}</p>
                </div>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">Important Information</h3>
            <ul className="text-sm text-yellow-700 space-y-2">
              <li>• Please present this voucher at the hotel reception during check-in</li>
              <li>• Keep this voucher safe as it serves as proof of your booking</li>
              <li>• For any queries, contact our support team at support@delonixtravel.com</li>
              <li>• This voucher is valid for the dates specified in your booking</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
            <p>Thank you for choosing our service!</p>
            <p className="mt-1">TripBazaar - Your trusted travel partner</p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
} 