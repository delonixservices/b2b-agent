'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { hotelApi, BookingPolicyResponse, PrebookRequest, ConfirmBookingRequest, processWalletPayment } from '../../services/hotelApi'
import { isAuthenticated, clearAuthData, getAuthToken } from '../../utils/authUtils'
import PaymentMethodSelector from '../../components/PaymentMethodSelector'
import PaymentSuccess from '../../components/PaymentSuccess'

interface ContactDetail {
  name: string;
  last_name: string;
  email: string;
  mobile: string;
}

interface Guest {
  room_guest: Array<{
    firstname: string;
    lastname: string;
    mobile: string;
    nationality: string;
  }>;
}

function ReviewPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingPolicy, setBookingPolicy] = useState<BookingPolicyResponse | null>(null)
  const [contactDetail, setContactDetail] = useState<ContactDetail>({
    name: '',
    last_name: '',
    email: '',
    mobile: ''
  })
  const [guests, setGuests] = useState<Guest[]>([])
  const [userToken, setUserToken] = useState<string | null>(null)
  const [prebookData, setPrebookData] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'gateway' | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [showPaymentSelector, setShowPaymentSelector] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Utility function to handle authentication errors
  const handleAuthError = () => {
    clearAuthData()
    setError('Authentication required. Please login to continue with booking.')
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  // Get URL parameters
  const hotelId = searchParams.get('hotelId')
  const hotelName = searchParams.get('hotelName')
  const bookingKey = searchParams.get('bookingKey')
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  const rooms = parseInt(searchParams.get('rooms') || '1')
  const adults = parseInt(searchParams.get('adults') || '1')
  const children = parseInt(searchParams.get('children') || '0')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateNights = (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getPackagePrice = (pkg: any) => {
    return (pkg.chargeable_rate_with_tax_excluded || 0) > 0 ? (pkg.chargeable_rate_with_tax_excluded || 0) :
           (pkg.room_rate || 0) > 0 ? (pkg.room_rate || 0) :
           (pkg.base_amount || 0) > 0 ? (pkg.base_amount || 0) : 0
  }

  const getPackageName = (pkg: any) => {
    return pkg.room_details?.room_type || 
           pkg.room_details?.description || 
           pkg.room_type || 
           pkg.description || 
           'Standard Room'
  }

  const getMealPlan = (pkg: any) => {
    return pkg.room_details?.food || 
           pkg.meal_plan || 
           'Room Only'
  }

  const fetchBookingPolicy = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!hotelId || !bookingKey || !checkIn || !checkOut) {
        throw new Error('Missing required booking parameters')
      }

      // Check if user is authenticated before making API call
      if (!isAuthenticated()) {
        handleAuthError()
        return
      }

      const token = getAuthToken()

      // Get transaction ID from URL parameters (passed from hotel details page)
      const transaction_id = searchParams.get('transactionId') || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const requestData = {
        transaction_id,
        search: {
          adult_count: adults,
          check_in_date: checkIn,
          check_out_date: checkOut,
          child_count: children,
          currency: 'INR',
          locale: 'en-US',
          room_count: rooms,
          source_market: 'IN'
        },
        bookingKey,
        hotelId
      }

      console.log('Fetching booking policy with data:', requestData)
      console.log('Using authentication token:', token ? 'Token present' : 'No token')

      const response = await hotelApi.getBookingPolicy(requestData, token!)
      setBookingPolicy(response)

      // Initialize guests array based on room count
      const initialGuests: Guest[] = Array.from({ length: rooms }, () => ({
        room_guest: [{
          firstname: '',
          lastname: '',
          mobile: '',
          nationality: 'IN'
        }]
      }))
      setGuests(initialGuests)

    } catch (err: any) {
      console.error('Error fetching booking policy:', err)
      
      // Handle authentication errors specifically
      if (err instanceof Error && err.message.includes('401')) {
        handleAuthError()
      } else {
        setError(err.message || 'Failed to fetch booking policy')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleContactDetailChange = (field: keyof ContactDetail, value: string) => {
    setContactDetail(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGuestChange = (roomIndex: number, guestIndex: number, field: string, value: string) => {
    setGuests(prev => {
      const newGuests = [...prev]
      if (newGuests[roomIndex] && newGuests[roomIndex].room_guest[guestIndex]) {
        newGuests[roomIndex].room_guest[guestIndex] = {
          ...newGuests[roomIndex].room_guest[guestIndex],
          [field]: value
        }
      }
      return newGuests
    })
  }

  const validateForm = () => {
    if (!contactDetail.name || !contactDetail.last_name || !contactDetail.email || !contactDetail.mobile) {
      return 'Please fill in all contact details'
    }

    if (!contactDetail.email.includes('@')) {
      return 'Please enter a valid email address'
    }

    if (contactDetail.mobile.length < 10) {
      return 'Please enter a valid mobile number'
    }

    // Validate guests if they are provided
    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i].room_guest[0]
      if (guest.firstname && (!guest.lastname || !guest.mobile)) {
        return `Please fill in all guest details for room ${i + 1}`
      }
    }

    return null
  }

  const handlePrebook = async () => {
    try {
      const validationError = validateForm()
      if (validationError) {
        setError(validationError)
        return
      }

      if (!bookingPolicy) {
        setError('Booking policy not available')
        return
      }

      // Check if user is authenticated before making API call
      if (!isAuthenticated()) {
        handleAuthError()
        return
      }

      setLoading(true)
      setError(null)

      const token = getAuthToken()

      const prebookData: PrebookRequest = {
        booking_policy_id: bookingPolicy.data.booking_policy_id,
        transaction_id: bookingPolicy.transaction_identifier,
        contactDetail,
        guest: guests.length > 0 ? guests : undefined
      }

      console.log('Prebooking with data:', prebookData)
      console.log('Using authentication token:', token ? 'Token present' : 'No token')

      const prebookResponse = await hotelApi.prebookHotel(prebookData, token!)
      
      console.log('Prebook response:', prebookResponse)
      setPrebookData(prebookResponse)

      // Show payment method selector instead of redirecting
      setShowPaymentSelector(true)

    } catch (err: any) {
      console.error('Error during booking process:', err)
      
      // Handle authentication errors specifically
      if (err instanceof Error && err.message.includes('401')) {
        handleAuthError()
      } else {
        // Try to extract error message from response
        let errorMessage = 'Failed to complete booking'
        if (err.message) {
          errorMessage = err.message
        } else if (err.response && err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message
        }
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBackToDetails = () => {
    router.back()
  }

  const handlePaymentMethodSelect = (method: 'wallet' | 'gateway') => {
    setPaymentMethod(method)
  }

  const handleWalletPayment = async () => {
    try {
      setPaymentLoading(true)
      setError(null)

      if (!prebookData || !paymentMethod) {
        setError('Payment data not available')
        return
      }

      const token = getAuthToken()
      const bookingId = prebookData.data?.booking_id || prebookData.data?.prebook_id || prebookData.data?.id || prebookData.data?.transactionid
      const transactionId = prebookData.data?.transactionid || prebookData.data?.id

      if (!bookingId || !transactionId) {
        setError('Booking information not available')
        return
      }

      const response = await processWalletPayment(token!, {
        transactionId,
        bookingId
      })

      console.log('Wallet payment response:', response)

      if (response.success) {
        // Show success component
        setPaymentSuccess(true)
      } else {
        setError(response.message || 'Payment failed')
      }

    } catch (err: any) {
      console.error('Error processing wallet payment:', err)
      setError(err.message || 'Failed to process wallet payment')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleGatewayPayment = () => {
    if (!prebookData) {
      setError('Payment data not available')
      return
    }

    const bookingId = prebookData.data?.booking_id || prebookData.data?.prebook_id || prebookData.data?.id || prebookData.data?.transactionid
    if (bookingId) {
      window.location.href = `${process.env.NEXT_PUBLIC_API_PATH}/api/hotels/process-payment/${bookingId}`
    } else {
      setError('Booking ID not found for payment processing')
    }
  }

  useEffect(() => {
    // Check if user is authenticated
    if (isAuthenticated()) {
      const token = getAuthToken()
      setUserToken(token)
      // Only fetch booking policy if we have a token
      fetchBookingPolicy()
    } else {
      // If no token, show authentication error
      handleAuthError()
    }
  }, [])

  if (paymentSuccess) {
    // Calculate total price for payment success display
    const packageData = bookingPolicy?.data?.package
    const nights = calculateNights(checkIn!, checkOut!)
    const packagePrice = getPackagePrice(packageData)
    const totalPrice = packagePrice * rooms * nights

    return (
      <div className="min-h-screen">
        <Navbar />
        <PaymentSuccess
          bookingId={prebookData?.data?.booking_id || prebookData?.data?.id || ''}
          amount={totalPrice}
          currency="INR"
          paymentMethod={paymentMethod || 'wallet'}
          hotelName={hotelName || ''}
          checkIn={checkIn || ''}
          checkOut={checkOut || ''}
        />
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              {error.includes('Authentication required') && (
                <button 
                  onClick={() => router.push('/login')}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                >
                  Login
                </button>
              )}
              <button 
                onClick={handleBackToDetails}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Back to Hotel Details
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!bookingPolicy) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-600 mb-4">Booking Policy Not Found</h1>
            <button 
              onClick={handleBackToDetails}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Back to Hotel Details
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const packageData = bookingPolicy.data.package
  const nights = calculateNights(checkIn!, checkOut!)
  const packagePrice = getPackagePrice(packageData)
  const totalPrice = packagePrice * rooms * nights

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button 
          onClick={handleBackToDetails}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Hotel Details
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Hotel Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Review Your Booking</h1>
              
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{hotelName}</h2>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Check-in:</span> {formatDate(checkIn!)}</p>
                  <p><span className="font-medium">Check-out:</span> {formatDate(checkOut!)}</p>
                  <p><span className="font-medium">Duration:</span> {nights} night{nights > 1 ? 's' : ''}</p>
                  <p><span className="font-medium">Rooms:</span> {rooms} | <span className="font-medium">Adults:</span> {adults} | <span className="font-medium">Children:</span> {children}</p>
                </div>
              </div>

              {/* Room Details */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Room Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">{getPackageName(packageData)}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Meal Plan:</span> {getMealPlan(packageData)}</p>
                    <p><span className="font-medium">Cancellation:</span> {packageData.room_details?.non_refundable ? 'Non-refundable' : 'Refundable'}</p>
                    <p><span className="font-medium">Rate per night:</span> {formatPrice(packagePrice)}</p>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={contactDetail.name}
                      onChange={(e) => handleContactDetailChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={contactDetail.last_name}
                      onChange={(e) => handleContactDetailChange('last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={contactDetail.email}
                      onChange={(e) => handleContactDetailChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                    <input
                      type="tel"
                      value={contactDetail.mobile}
                      onChange={(e) => handleContactDetailChange('mobile', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Guest Details */}
              {rooms > 1 && (
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Guest Details</h3>
                  <div className="space-y-4">
                    {guests.map((guest, roomIndex) => (
                      <div key={roomIndex} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-3">Room {roomIndex + 1} - Lead Guest</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                              type="text"
                              value={guest.room_guest[0]?.firstname || ''}
                              onChange={(e) => handleGuestChange(roomIndex, 0, 'firstname', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                              type="text"
                              value={guest.room_guest[0]?.lastname || ''}
                              onChange={(e) => handleGuestChange(roomIndex, 0, 'lastname', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                            <input
                              type="tel"
                              value={guest.room_guest[0]?.mobile || ''}
                              onChange={(e) => handleGuestChange(roomIndex, 0, 'mobile', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                            <select
                              value={guest.room_guest[0]?.nationality || 'IN'}
                              onChange={(e) => handleGuestChange(roomIndex, 0, 'nationality', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="IN">India</option>
                              <option value="US">United States</option>
                              <option value="UK">United Kingdom</option>
                              <option value="CA">Canada</option>
                              <option value="AU">Australia</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Policy */}
              {bookingPolicy.data.cancellation_policy && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Cancellation Policy</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      {bookingPolicy.data.cancellation_policy.remarks}
                    </p>
                  </div>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="mb-6">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 mr-3"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the terms and conditions and cancellation policy. I understand that this booking is subject to the hotel's policies and any applicable fees.
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Summary</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate per night</span>
                  <span className="font-medium">{formatPrice(packagePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Number of rooms</span>
                  <span className="font-medium">{rooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Number of nights</span>
                  <span className="font-medium">{nights}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {!showPaymentSelector ? (
                <button
                  onClick={handlePrebook}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Confirm Booking'}
                </button>
              ) : (
                <PaymentMethodSelector
                  amount={totalPrice}
                  currency="INR"
                  onPaymentMethodSelect={handlePaymentMethodSelect}
                  selectedMethod={paymentMethod}
                  transactionId={prebookData?.data?.transactionid || prebookData?.data?.id || ''}
                  bookingId={prebookData?.data?.booking_id || prebookData?.data?.prebook_id || prebookData?.data?.id || ''}
                  onWalletPayment={handleWalletPayment}
                  onGatewayPayment={handleGatewayPayment}
                  loading={paymentLoading}
                />
              )}

              <p className="text-xs text-gray-500 mt-3 text-center">
                By clicking "Confirm Booking", you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <ReviewPageContent />
    </Suspense>
  )
}
