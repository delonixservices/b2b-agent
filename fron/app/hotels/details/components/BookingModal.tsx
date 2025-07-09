'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hotelApi, BookingPolicyRequest, PrebookRequest } from '../../../services/hotelApi'
import WalletPaymentModal from '../../components/WalletPaymentModal'

interface Guest {
  room_guest: [{
    firstname: string
    lastname: string
    mobile: string
    nationality: string
  }]
}

interface ContactDetail {
  name: string
  last_name: string
  email: string
  mobile: string
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPackage: any
  hotel: any
  searchParams: any
  transactionIdentifier?: string
}

export default function BookingModal({
  isOpen,
  onClose,
  selectedPackage,
  hotel,
  searchParams,
  transactionIdentifier
}: BookingModalProps) {
  const router = useRouter()
  const [step, setStep] = useState<'policy' | 'guest-info' | 'payment' | 'confirmation'>('policy')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingPolicy, setBookingPolicy] = useState<any>(null)
  const [prebookData, setPrebookData] = useState<any>(null)
  const [contactDetail, setContactDetail] = useState<ContactDetail>({
    name: '',
    last_name: '',
    email: '',
    mobile: ''
  })
  const [guests, setGuests] = useState<Guest[]>([])
  const [coupon, setCoupon] = useState<{
    code: string;
    type: 'fixed' | 'percentage';
    value: number;
  }>({
    code: '',
    type: 'fixed',
    value: 0
  })
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'gateway' | 'wallet'>('gateway')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price)
  }

  // Initialize guests array based on room count
  useEffect(() => {
    const roomCount = parseInt(searchParams.get('rooms') || '1')
    const initialGuests: Guest[] = Array.from({ length: roomCount }, () => ({
      room_guest: [{
        firstname: '',
        lastname: '',
        mobile: '',
        nationality: 'IN'
      }]
    }))
    setGuests(initialGuests)
  }, [searchParams])

  const getBookingPolicy = async () => {
    try {
      setLoading(true)
      setError(null)

      const search = {
        adult_count: parseInt(searchParams.get('adults') || '1'),
        child_count: parseInt(searchParams.get('children') || '0'),
        room_count: parseInt(searchParams.get('rooms') || '1'),
        check_in_date: searchParams.get('checkIn'),
        check_out_date: searchParams.get('checkOut'),
        source_market: 'IN',
        currency: 'INR',
        locale: 'en-US'
      }

      const payload: BookingPolicyRequest = {
        transaction_id: transactionIdentifier || '',
        search,
        bookingKey: selectedPackage.booking_key || '',
        hotelId: hotel.hotelId || hotel.id
      }

      console.log('Booking policy payload:', payload)

      const data = await hotelApi.getBookingPolicy(payload)
      setBookingPolicy(data)
      setStep('guest-info')
    } catch (err) {
      console.error('Error getting booking policy:', err)
      setError(err instanceof Error ? err.message : 'Failed to get booking policy')
    } finally {
      setLoading(false)
    }
  }

  const handlePrebook = async () => {
    try {
      setLoading(true)
      setError(null)

      const payload: PrebookRequest = {
        booking_policy_id: bookingPolicy.data.booking_policy_id || '',
        transaction_id: transactionIdentifier || '',
        contactDetail,
        guest: guests
      }

      console.log('Prebook payload:', payload)

      const data = await hotelApi.prebookHotel(payload)
      console.log('Prebook response:', data)
      setPrebookData(data)
      setStep('payment')
    } catch (err) {
      console.error('Error prebooking:', err)
      setError(err instanceof Error ? err.message : 'Failed to prebook')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentGateway = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await hotelApi.confirmBooking({
        transactionId: prebookData.data.transaction_id,
        bookingId: prebookData.data.booking_id
      })

      if (response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl
      } else {
        setStep('confirmation')
      }
    } catch (err) {
      console.error('Error confirming booking:', err)
      setError(err instanceof Error ? err.message : 'Failed to process payment')
    } finally {
      setLoading(false)
    }
  }

  const handleWalletPayment = () => {
    setShowWalletModal(true)
  }

  const handleWalletPaymentSuccess = (data: any) => {
    setShowWalletModal(false)
    setStep('confirmation')
    // You can store the booking data or redirect to voucher
    if (data.voucherUrl) {
      window.location.href = data.voucherUrl
    }
  }

  const handleWalletPaymentError = (error: string) => {
    setError(error)
    setShowWalletModal(false)
  }

  const updateGuest = (roomIndex: number, field: string, value: string) => {
    const updatedGuests = [...guests]
    updatedGuests[roomIndex].room_guest[0] = {
      ...updatedGuests[roomIndex].room_guest[0],
      [field]: value
    }
    setGuests(updatedGuests)
  }

  const isFormValid = () => {
    if (!contactDetail.name || !contactDetail.last_name || !contactDetail.email || !contactDetail.mobile) {
      return false
    }
    
    return guests.every(guest => 
      guest.room_guest[0].firstname && 
      guest.room_guest[0].lastname && 
      guest.room_guest[0].mobile
    )
  }

  const getTotalAmount = () => {
    if (!prebookData?.data?.pricing) return 0
    return prebookData.data.pricing.total_chargeable_amount || 0
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">
              {step === 'policy' && 'Booking Policy'}
              {step === 'guest-info' && 'Guest Information'}
              {step === 'payment' && 'Payment Method'}
              {step === 'confirmation' && 'Booking Confirmation'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {step === 'policy' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Booking Policy</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 mb-4">
                      Please review the booking policy before proceeding with your reservation.
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>• Cancellation charges may apply based on hotel policy</p>
                      <p>• Payment is required to confirm your booking</p>
                      <p>• Please ensure all guest information is accurate</p>
                      <p>• Booking confirmation will be sent via email</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={getBookingPolicy}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Get Booking Policy'}
                  </button>
                </div>
              </div>
            )}

            {step === 'guest-info' && (
              <div>
                {/* Contact Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={contactDetail.name}
                        onChange={(e) => setContactDetail({...contactDetail, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={contactDetail.last_name}
                        onChange={(e) => setContactDetail({...contactDetail, last_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={contactDetail.email}
                        onChange={(e) => setContactDetail({...contactDetail, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile *
                      </label>
                      <input
                        type="tel"
                        value={contactDetail.mobile}
                        onChange={(e) => setContactDetail({...contactDetail, mobile: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Guest Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Guest Information</h3>
                  {guests.map((guest, roomIndex) => (
                    <div key={roomIndex} className="mb-4 p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium mb-3">Room {roomIndex + 1} - Lead Guest</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name *
                          </label>
                          <input
                            type="text"
                            value={guest.room_guest[0].firstname}
                            onChange={(e) => updateGuest(roomIndex, 'firstname', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            value={guest.room_guest[0].lastname}
                            onChange={(e) => updateGuest(roomIndex, 'lastname', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mobile *
                          </label>
                          <input
                            type="tel"
                            value={guest.room_guest[0].mobile}
                            onChange={(e) => updateGuest(roomIndex, 'mobile', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nationality
                          </label>
                          <select
                            value={guest.room_guest[0].nationality}
                            onChange={(e) => updateGuest(roomIndex, 'nationality', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                {/* Coupon Code */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Coupon Code (Optional)</h3>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={coupon.code}
                      onChange={(e) => setCoupon({...coupon, code: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                      Apply
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setStep('policy')}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePrebook}
                    disabled={loading || !isFormValid()}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Process Booking'}
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Choose Payment Method</h3>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-medium">Total Amount:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(getTotalAmount())}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Transaction ID: {prebookData?.data?.transaction_id}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="gateway"
                          checked={paymentMethod === 'gateway'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'gateway' | 'wallet')}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium">Payment Gateway</div>
                          <div className="text-sm text-gray-600">
                            Pay using credit/debit card, UPI, or net banking
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="wallet"
                          checked={paymentMethod === 'wallet'}
                          onChange={(e) => setPaymentMethod(e.target.value as 'gateway' | 'wallet')}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium">Wallet Payment</div>
                          <div className="text-sm text-gray-600">
                            Pay instantly using your wallet balance
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setStep('guest-info')}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={paymentMethod === 'wallet' ? handleWalletPayment : handlePaymentGateway}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : `Pay ${formatPrice(getTotalAmount())}`}
                  </button>
                </div>
              </div>
            )}

            {step === 'confirmation' && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Booking Confirmed!</h3>
                  <p className="text-gray-600">Your booking has been successfully confirmed. You will receive a confirmation email shortly.</p>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Payment Modal */}
      {showWalletModal && prebookData && (
        <WalletPaymentModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          transactionId={prebookData.data.transaction_id}
          bookingId={prebookData.data.booking_id}
          amount={getTotalAmount()}
          onSuccess={handleWalletPaymentSuccess}
          onError={handleWalletPaymentError}
        />
      )}
    </>
  )
} 