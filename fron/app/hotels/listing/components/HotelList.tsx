'use client'

import HotelCard from './HotelCard'
import { Hotel } from '../types/hotel'

interface HotelListProps {
  hotels: Hotel[]
  loading: boolean
  pollingStatus: string
  totalHotels: number
  onLoadMore: () => void
}

export default function HotelList({ hotels, loading, pollingStatus, totalHotels, onLoadMore }: HotelListProps) {
  if (loading && hotels.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (hotels.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-600">No hotels found</h3>
        <p className="text-gray-500">Try adjusting your search criteria</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hotels.map((hotel) => (
        <HotelCard key={hotel.id} hotel={hotel} />
      ))}
      
      {/* Load More Button */}
      {pollingStatus === 'in-progress' && (
        <div className="text-center py-6">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More Hotels'}
          </button>
        </div>
      )}
      
      {/* End of Results */}
      {pollingStatus === 'complete' && hotels.length > 0 && (
        <div className="text-center py-6 text-gray-500">
          <p>End of results ({totalHotels} hotels)</p>
        </div>
      )}
    </div>
  )
} 