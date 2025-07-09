'use client'

import { Hotel } from '../types/hotel'
import { useRouter, useSearchParams } from 'next/navigation'

interface HotelCardProps {
  hotel: Hotel
  transactionIdentifier?: string
}

export default function HotelCard({ hotel, transactionIdentifier }: HotelCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

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

  const getMinPrice = (hotel: Hotel) => {
    const prices = hotel.rates.packages.map(pkg => {
      if (pkg.chargeable_rate && pkg.chargeable_rate > 0) return pkg.chargeable_rate
      if (pkg.chargeable_rate_with_tax_excluded && pkg.chargeable_rate_with_tax_excluded > 0) return pkg.chargeable_rate_with_tax_excluded
      if (pkg.room_rate && pkg.room_rate > 0) return pkg.room_rate
      return pkg.base_amount || 0
    }).filter(price => price > 0)
    
    return prices.length > 0 ? Math.min(...prices) : 0
  }

  const getHotelImage = (hotel: Hotel) => {
    if (hotel.image) return hotel.image
    if (hotel.imageDetails?.images && hotel.imageDetails.images.length > 0) {
      return hotel.imageDetails.images[0]
    }
    // Use the provided placeholder image if no image is available
    return 'https://www.hoteldel.com/wp-content/uploads/2021/01/hotel-del-coronado-views-suite-K1TOS1-K1TOJ1-1600x900-1.jpg'
  }

  const getHotelAddress = (hotel: Hotel) => {
    if (hotel.address) return hotel.address
    if (hotel.location?.address) return hotel.location.address
    return `${hotel.city}, ${hotel.location?.stateProvince || hotel.state || ''}`
  }

  const handleBookNow = () => {
    // Get current search parameters
    const area = searchParams.get('area')
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const rooms = searchParams.get('rooms')
    const adults = searchParams.get('adults')
    const children = searchParams.get('children')
    const childrenAges = searchParams.get('childrenAges')

    // Build the details array for the API call
    const details = []
    const adultsPerRoom = Math.ceil(parseInt(adults || '1') / parseInt(rooms || '1'))
    const childrenPerRoom = Math.ceil(parseInt(children || '0') / parseInt(rooms || '1'))
    const childrenAgesArray = childrenAges ? JSON.parse(decodeURIComponent(childrenAges)) : []
    
    for (let i = 0; i < parseInt(rooms || '1'); i++) {
      const roomDetail: any = {
        adult_count: adultsPerRoom
      }
      
      if (parseInt(children || '0') > 0) {
        roomDetail.child_count = childrenPerRoom
        roomDetail.children = childrenAgesArray.slice(i * childrenPerRoom, (i + 1) * childrenPerRoom)
      }
      
      details.push(roomDetail)
    }

    // Navigate to details page with all necessary parameters
    const params = new URLSearchParams({
      hotelId: hotel.id,
      hotelName: hotel.name,
      checkIn: checkIn || '',
      checkOut: checkOut || '',
      rooms: rooms || '1',
      adults: adults || '1',
      children: children || '0',
      childrenAges: childrenAges || '',
      details: JSON.stringify(details),
      area: area || ''
    })

    // Add transaction_identifier if available
    if (transactionIdentifier) {
      params.append('transaction_identifier', transactionIdentifier)
      console.log('Adding transaction_identifier to URL:', transactionIdentifier)
    } else {
      console.log('No transaction_identifier available')
    }

    router.push(`/hotels/details?${params.toString()}`)
  }

  const handleViewDetails = () => {
    // Navigate to details page without booking (view mode)
    const params = new URLSearchParams({
      hotelId: hotel.id,
      hotelName: hotel.name,
      viewMode: 'true'
    })

    router.push(`/hotels/details?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Hotel Image */}
        <div className="md:w-1/3">
          <img
            src={getHotelImage(hotel)}
            alt={hotel.name}
            className="w-full h-48 md:h-full object-cover"
          />
        </div>
        
        {/* Hotel Details */}
        <div className="md:w-2/3 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{hotel.name}</h2>
              <div className="flex items-center mb-2">
                {renderStars(hotel.starRating)}
                <span className="ml-2 text-sm text-gray-600">
                  {hotel.starRating > 0 ? `${hotel.starRating} Star Hotel` : 'Hotel'}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-2">
                {getHotelAddress(hotel)}
              </p>
              {hotel.amenities && hotel.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {hotel.amenities.slice(0, 5).map((amenity, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {amenity}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Price */}
            <div className="text-right">
              {/* Main Price: chargeable_rate of the first package */}
              {hotel.rates.packages && hotel.rates.packages.length > 0 ? (
                <>
                  <div className="text-3xl font-extrabold text-gray-900">
                    {Math.round(hotel.rates.packages[0].chargeable_rate || 0)}
                  </div>
                  <div className="text-gray-500 text-base">
                    + {Math.round((hotel.rates.packages[0].service_component || 0) + (hotel.rates.packages[0].gst || 0))} taxes & fees
                  </div>
                  <div className="text-gray-500 text-base">
                    Per Night
                  </div>
                </>
              ) : (
                <div className="text-2xl font-bold text-blue-600">
                  N/A
                </div>
              )}
              {hotel.rates.packages.length > 1 && (
                <div className="text-xs text-gray-400">
                  {hotel.rates.packages.length} room types available
                </div>
              )}
            </div>
          </div>
          
          {/* Room Packages */}
          <div className="space-y-2">
            {hotel.rates.packages.slice(0, 3).map((pkg, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-sm">
                    {pkg.room_details?.room_type || pkg.room_details?.description || 'Standard Room'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {pkg.room_details?.food || 'Room Only'}
                    {pkg.room_details?.non_refundable ? ' • Non-refundable' : ' • Refundable'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">
                    {formatPrice(pkg.chargeable_rate || pkg.chargeable_rate_with_tax_excluded || pkg.room_rate || pkg.base_amount || 0)}
                  </div>
                  {pkg.markup_amount && pkg.markup_amount > 0 && (
                    <div className="text-xs text-gray-500">
                      +{formatPrice(pkg.markup_amount)} markup
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <button 
              onClick={handleViewDetails}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View Details
            </button>
            <button 
              onClick={handleBookNow}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 