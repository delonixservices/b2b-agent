'use client'

import HotelCard from './HotelCard'
import { Hotel } from '../types/hotel'

interface HotelListProps {
  hotels: Hotel[]
  loading: boolean
  pollingStatus: string
  totalHotels: number
  onLoadMore: () => void
  transactionIdentifier?: string
  loadedBatches?: number
  totalBatches?: number
}

export default function HotelList({ 
  hotels, 
  loading, 
  pollingStatus, 
  totalHotels, 
  onLoadMore, 
  transactionIdentifier,
  loadedBatches = 0,
  totalBatches = 0
}: HotelListProps) {
  
  // Debug logging
  console.log('HotelList received:', {
    hotelsCount: hotels.length,
    loading,
    pollingStatus,
    totalHotels,
    firstHotel: hotels[0]
  })
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

  // Calculate progress for hotel ID-based pagination
  const showBatchProgress = totalBatches > 0
  const progressPercentage = showBatchProgress ? Math.round((loadedBatches / totalBatches) * 100) : 0
  const remainingBatches = totalBatches - loadedBatches
  const hotelsLoaded = hotels.length
  const hotelsPerBatch = totalBatches > 0 ? Math.ceil(totalHotels / totalBatches) : 0

  console.log('🔄 Rendering hotels:', hotels.length)

  return (
    <div className="space-y-4">
      {hotels.map((hotel) => (
        <HotelCard key={hotel.id} hotel={hotel} transactionIdentifier={transactionIdentifier} />
      ))}
      
      {/* Load More Button */}
      {pollingStatus === 'in-progress' && (
        <div className="text-center py-6">
          {showBatchProgress && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Loaded {loadedBatches} of {totalBatches} batches</span>
                <span>{progressPercentage}% complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {hotelsLoaded} of {totalHotels} hotels loaded
                {remainingBatches > 0 && ` • ${remainingBatches} more batches available`}
              </p>
            </div>
          )}
          
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading More Hotels...
              </div>
            ) : (
              showBatchProgress 
                ? `Load Next ${hotelsPerBatch} Hotels (${remainingBatches} batches left)`
                : 'Load More Hotels'
            )}
          </button>
        </div>
      )}
      
      {/* End of Results */}
      {pollingStatus === 'complete' && hotels.length > 0 && (
        <div className="text-center py-6 text-gray-500">
          {showBatchProgress ? (
            <div>
              <p className="font-semibold text-green-600 mb-2">All hotels loaded successfully!</p>
              <p>End of results ({totalHotels} hotels from {totalBatches} batches)</p>
            </div>
          ) : (
            <p>End of results ({totalHotels} hotels)</p>
          )}
        </div>
      )}
    </div>
  )
} 