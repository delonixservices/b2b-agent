'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { hotelApi } from '../../services/hotelApi'
import { isAuthenticated, clearAuthData, getAuthToken } from '../../utils/authUtils'

interface HotelPackage {
  hotel_id?: string
  room_details?: {
    room_type?: string
    description?: string
    food?: string
    non_refundable?: boolean
    supplier_description?: string
    room_code?: number
    room_view?: string
    rate_plan_code?: number
    beds?: any
  }
  chargeable_rate?: number
  chargeable_rate_with_tax_excluded?: number
  room_rate?: number
  base_amount?: number
  markup_amount?: number
  markup_details?: {
    id?: string
    name?: string
    type?: string
    value?: number
  }
  cancellation_policy?: string
  meal_plan?: string
  room_type?: string
  description?: string
  booking_key?: string
  room_rate_currency?: string
  chargeable_rate_currency?: string
  client_commission?: number
  client_commission_currency?: string
  client_commission_percentage?: number
  guest_discount_percentage?: number
  guest_discount_with_tax_excluded_percentage?: number
  taxes_and_fees?: {
    estimated_total?: {
      currency?: string
      value?: number
    }
  }
  indicative_market_rates?: Array<{
    market_rate_supplier?: string
    market_rate?: number
    market_rate_currency?: string
  }>
  service_component?: number;
  gst?: number;
}

interface HotelDetails {
  id: string
  name: string
  originalName?: string
  starRating?: number
  address?: string
  city?: string
  state?: string
  location?: {
    address?: string
    stateProvince?: string
    country?: string
    countryCode?: string
    postalCode?: string
    latLng?: {
      lat: string
      lng: string
    }
  }
  image?: string
  imageDetails?: {
    images?: string[]
    count?: number
  }
  amenities?: string[]
  moreDetails?: {
    checkInTime?: string
    checkOutTime?: string
    description?: string
    phone?: string
    email?: string
  }
  rates: {
    packages: HotelPackage[]
  }
  hotelId?: string
  policy?: string
}

interface SearchResponse {
  data: {
    search: any
    hotel: HotelDetails
    currentPackagesCount?: number
    totalPackagesCount?: number
    page?: number
    perPage?: number
    totalPages?: number
    status?: string
    transaction_identifier?: string
  }
}

function HotelDetailsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [hotel, setHotel] = useState<HotelDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<HotelPackage | null>(null)
  const [userToken, setUserToken] = useState<string | null>(null)
  const [transactionIdentifier, setTransactionIdentifier] = useState<string | null>(null)

  // Utility function to handle authentication errors
  const handleAuthError = () => {
    clearAuthData()
    setError('Authentication required. Please login to view hotel details.')
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  const getHotelImage = (hotel: HotelDetails) => {
    if (hotel.image) return hotel.image
    if (hotel.imageDetails?.images && hotel.imageDetails.images.length > 0) {
      return hotel.imageDetails.images[0]
    }
    // Use the requested placeholder image if no image is available
    return 'https://www.hoteldel.com/wp-content/uploads/2021/01/hotel-del-coronado-views-suite-K1TOS1-K1TOJ1-1600x900-1.jpg'
  }

  const getHotelAddress = (hotel: HotelDetails) => {
    if (hotel.address) return hotel.address
    if (hotel.location?.address) return hotel.location.address
    return `${hotel.city}, ${hotel.location?.stateProvince || hotel.state || ''}`
  }

  const getRateBreakdown = (pkg: HotelPackage) => {
    const breakdown = [];
    
    if (pkg.base_amount && pkg.base_amount > 0) {
      breakdown.push(`Base: ${formatPrice(pkg.base_amount)}`);
    }
    
    if (pkg.service_component && pkg.service_component > 0) {
      breakdown.push(`Service: ${formatPrice(pkg.service_component)}`);
    }
    
    if (pkg.gst && pkg.gst > 0) {
      breakdown.push(`GST: ${formatPrice(pkg.gst)}`);
    }
    
    return breakdown;
  }

  const getPackagePrice = (pkg: HotelPackage) => {
    // Use chargeable_rate as primary price (this includes all taxes and fees)
    // If that's not available, fall back to base_amount + service_component + gst
    if (pkg.chargeable_rate && pkg.chargeable_rate > 0) {
      return pkg.chargeable_rate;
    }
    
    // Calculate total from components if chargeable_rate is not available
    const baseAmount = pkg.base_amount || 0;
    const serviceComponent = pkg.service_component || 0;
    const gst = pkg.gst || 0;
    
    return baseAmount + serviceComponent + gst;
  }

  const getPackageName = (pkg: HotelPackage) => {
    return pkg.room_details?.room_type || 
           pkg.room_details?.description || 
           pkg.room_type || 
           pkg.description || 
           'Standard Room'
  }

  const getMealPlan = (pkg: HotelPackage) => {
    return pkg.room_details?.food || 
           pkg.meal_plan || 
           'Room Only'
  }

  const fetchHotelDetails = async () => {
    try {
      setLoading(true)
      
      const hotelId = searchParams.get('hotelId')
      const checkIn = searchParams.get('checkIn')
      const checkOut = searchParams.get('checkOut')
      const details = searchParams.get('details')
      const viewMode = searchParams.get('viewMode')
      const transactionIdentifier = searchParams.get('transaction_identifier')

      if (!hotelId) {
        throw new Error('Hotel ID is required')
      }

      // If in view mode, don't fetch packages
      if (viewMode === 'true') {
        setLoading(false)
        return
      }

      if (!checkIn || !checkOut || !details) {
        throw new Error('Missing required booking parameters')
      }

      // Check if user is authenticated before making API call
      if (!isAuthenticated()) {
        handleAuthError()
        return
      }
      
      const token = getAuthToken()

      const searchPayload = {
        hotelId,
        checkindate: checkIn,
        checkoutdate: checkOut,
        details: JSON.parse(details),
        transaction_identifier: transactionIdentifier || undefined
      }

      console.log('🔍 Hotel ID from URL:', hotelId)
      console.log('📤 Search packages payload:', searchPayload)
      console.log('🔑 Transaction identifier from URL:', transactionIdentifier)
      console.log('🔐 Using authentication token:', token ? 'Token present' : 'No token')

      const data: SearchResponse = await hotelApi.searchPackages(searchPayload, token!)
      
      console.log('📥 Packages API response:', {
        hasData: !!data.data,
        hasHotel: !!data.data?.hotel,
        hotelId: data.data?.hotel?.id,
        hotelMongoId: data.data?.hotel?._id,
        packagesCount: data.data?.hotel?.rates?.packages?.length || 0,
        transactionIdentifier: data.data?.transaction_identifier
      })
      
      if (data.data && data.data.hotel) {
        setHotel(data.data.hotel)
        if (data.data.hotel.rates.packages.length > 0) {
          setSelectedPackage(data.data.hotel.rates.packages[0])
        }
        // Store the transaction identifier from the packages API response
        if (data.data.transaction_identifier) {
          setTransactionIdentifier(data.data.transaction_identifier)
        }
      } else {
        throw new Error('Failed to fetch hotel details')
      }
    } catch (err) {
      console.error('Error fetching hotel details:', err)
      
      // Handle authentication errors specifically
      if (err instanceof Error && err.message.includes('401')) {
        handleAuthError()
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch hotel details')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBookPackage = (pkg: HotelPackage) => {
    if (!hotel) return;
    // Gather all necessary params
    const params = new URLSearchParams({
      hotelId: hotel.hotelId || hotel.id,
      hotelName: hotel.name,
      bookingKey: pkg.booking_key || '',
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      rooms: searchParams.get('rooms') || '1',
      adults: searchParams.get('adults') || '1',
      children: searchParams.get('children') || '0',
    })
    
    // Add transaction identifier if available
    if (transactionIdentifier) {
      params.append('transactionId', transactionIdentifier)
    }
    
    router.push(`/hotels/review?${params.toString()}`)
  }

  const handleBackToSearch = () => {
    router.back()
  }

  useEffect(() => {
    // Check if user is authenticated
    if (isAuthenticated()) {
      const token = getAuthToken()
      setUserToken(token)
      // Only fetch hotel details if we have a token
      fetchHotelDetails()
    } else {
      // If no token, show authentication error
      handleAuthError()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading hotel details...</p>
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
                onClick={handleBackToSearch}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
              >
                Back to Search
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!hotel) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-600 mb-4">Hotel Not Found</h1>
            <button 
              onClick={handleBackToSearch}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Back to Search
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button 
          onClick={handleBackToSearch}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Search
        </button>

        {/* Hotel Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="flex flex-col lg:flex-row">
            {/* Hotel Image */}
            <div className="lg:w-1/2">
              <img
                src={getHotelImage(hotel)}
                alt={hotel.name}
                className="w-full h-64 lg:h-full object-cover"
              />
            </div>
            
            {/* Hotel Info */}
            <div className="lg:w-1/2 p-6">
              <div className="flex items-center mb-4">
                {renderStars(hotel.starRating || 0)}
                <span className="ml-2 text-sm text-gray-600">
                  {(hotel.starRating || 0) > 0 ? `${hotel.starRating} Star Hotel` : 'Hotel'}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{hotel.name}</h1>
              
              <p className="text-gray-600 mb-4">
                {getHotelAddress(hotel)}
              </p>

              {/* Reviews Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Guest Reviews</h3>
                </div>
                <div className="flex items-center mb-2">
                  {renderStars(hotel.starRating || 0)}
                  <span className="ml-2 text-sm text-gray-600">
                    {(hotel.starRating || 0) > 0 ? `${hotel.starRating}/5` : 'No ratings yet'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Based on guest reviews and ratings
                </p>
              </div>

              {/* Search Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Your Search</h3>
                <div className="text-sm text-gray-600">
                  <p>Check-in: {searchParams.get('checkIn')}</p>
                  <p>Check-out: {searchParams.get('checkOut')}</p>
                  <p>Rooms: {searchParams.get('rooms')} | Adults: {searchParams.get('adults')} | Children: {searchParams.get('children') || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Packages */}
        {hotel.rates.packages.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Room Packages</h2>
            <div className="space-y-4">
              {hotel.rates.packages.map((pkg, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-6 cursor-pointer transition-all ${
                    selectedPackage === pkg 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleBookPackage(pkg)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* Package Image on the left, small */}
                    <div className="mb-4 lg:mb-0 lg:mr-6 flex-shrink-0">
                      <img
                        src={getHotelImage(hotel)}
                        alt={getPackageName(pkg)}
                        className="w-28 h-20 object-cover rounded shadow"
                      />
                    </div>
                    <div className="flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between w-full">
                      <div className="lg:w-2/3">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {getPackageName(pkg)}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p><span className="font-medium">Meal Plan:</span> {getMealPlan(pkg)}</p>
                          <p>
                            <span className="font-medium">Cancellation:</span> 
                            {pkg.room_details?.non_refundable ? ' Non-refundable' : ' Refundable'}
                          </p>
                          {pkg.cancellation_policy && (
                            <p><span className="font-medium">Policy:</span> {pkg.cancellation_policy}</p>
                          )}
                        </div>
                      </div>
                      <div className="lg:w-1/3 text-right mt-4 lg:mt-0 flex flex-col items-end">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {formatPrice(getPackagePrice(pkg))}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">per night</div>
                        
                        {/* Rate Breakdown */}
                        {getRateBreakdown(pkg).length > 0 && (
                          <div className="text-xs text-gray-500 mb-2 text-right">
                            {getRateBreakdown(pkg).map((item, idx) => (
                              <div key={idx}>{item}</div>
                            ))}
                          </div>
                        )}
                        
                        {(pkg.markup_amount || 0) > 0 && (
                          <div className="text-xs text-gray-500 mb-3">
                            +{formatPrice(pkg.markup_amount || 0)} markup applied
                          </div>
                        )}
                        <button 
                          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition mt-2"
                          onClick={() => handleBookPackage(pkg)}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Map Section: separate, outside the package card */}
        {hotel.location?.latLng?.lat && hotel.location?.latLng?.lng && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h3 className="text-xl font-bold text-black mb-2">Location</h3>
            <div className="bg-gray-200 rounded-t px-4 py-2 text-lg font-semibold text-gray-700">
              {hotel.location.address || getHotelAddress(hotel)}
            </div>
            <div className="w-full h-64 rounded-b overflow-hidden">
              <iframe
                title="Hotel Location Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${hotel.location.latLng.lat},${hotel.location.latLng.lng}&hl=en&z=16&output=embed`}
              ></iframe>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  )
}

export default function HotelDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading hotel details...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <HotelDetailsContent />
    </Suspense>
  )
} 