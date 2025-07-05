'use client'

import { useMemo } from 'react'
import { Hotel, Filters } from '../types/hotel'

interface HotelFiltersProps {
  hotels: Hotel[]
  filters: Filters
  priceRange: { min: number; max: number }
  onFiltersChange: (filters: Filters) => void
}

export default function HotelFilters({ hotels, filters, priceRange, onFiltersChange }: HotelFiltersProps) {
  // Get unique values dynamically
  const uniqueStarRatings = useMemo(() => {
    const set = new Set<number>()
    hotels.forEach(h => set.add(h.starRating))
    return Array.from(set).sort((a, b) => b - a)
  }, [hotels])

  const uniqueRoomTypes = useMemo(() => {
    const set = new Set<string>()
    hotels.forEach(hotel => {
      hotel.rates.packages.forEach(pkg => {
        if (pkg.room_details?.room_type) set.add(pkg.room_details.room_type)
      })
    })
    return Array.from(set)
  }, [hotels])

  const uniqueFoodTypes = useMemo(() => {
    const set = new Set<string>()
    hotels.forEach(hotel => {
      hotel.rates.packages.forEach(pkg => {
        if (pkg.room_details?.food) set.add(pkg.room_details.food)
      })
    })
    return Array.from(set)
  }, [hotels])

  // Handlers
  const handleStarChange = (rating: number) => {
    const newRatings = filters.starRating.includes(rating)
      ? filters.starRating.filter(r => r !== rating)
      : [...filters.starRating, rating]
    onFiltersChange({ ...filters, starRating: newRatings })
  }
  const handleRoomTypeChange = (type: string) => {
    const newTypes = filters.roomType.includes(type)
      ? filters.roomType.filter(t => t !== type)
      : [...filters.roomType, type]
    onFiltersChange({ ...filters, roomType: newTypes })
  }
  const handleFoodTypeChange = (type: string) => {
    const newTypes = filters.foodType.includes(type)
      ? filters.foodType.filter(t => t !== type)
      : [...filters.foodType, type]
    onFiltersChange({ ...filters, foodType: newTypes })
  }
  const handleRefundableChange = (val: boolean) => {
    const newRefundable = filters.refundable.includes(val)
      ? filters.refundable.filter(v => v !== val)
      : [...filters.refundable, val]
    onFiltersChange({ ...filters, refundable: newRefundable })
  }
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, price: { ...filters.price, max: parseInt(e.target.value) } })
  }

  return (
    <div className="lg:w-1/4">
      <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        {/* Price Range */}
        <div className="mb-4">
          <h3 className="font-medium mb-2">Price Range</h3>
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            value={filters.price.max}
            onChange={handlePriceChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>₹{priceRange.min}</span>
            <span>₹{filters.price.max}</span>
          </div>
        </div>
        {/* Star Rating */}
        {uniqueStarRatings.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Star Rating</h3>
            <div className="space-y-1">
              {uniqueStarRatings.map(rating => (
                <label key={rating} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.starRating.includes(rating)}
                    onChange={() => handleStarChange(rating)}
                    className="mr-2"
                  />
                  <span className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    ))}
                    <span className="ml-1 text-xs">{rating} Star</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        {/* Room Type */}
        {uniqueRoomTypes.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Room Type</h3>
            <div className="space-y-1">
              {uniqueRoomTypes.map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.roomType.includes(type)}
                    onChange={() => handleRoomTypeChange(type)}
                    className="mr-2"
                  />
                  <span className="text-xs">{type}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {/* Food Type */}
        {uniqueFoodTypes.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Food Type</h3>
            <div className="space-y-1">
              {uniqueFoodTypes.map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.foodType.includes(type)}
                    onChange={() => handleFoodTypeChange(type)}
                    className="mr-2"
                  />
                  <span className="text-xs">{type}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {/* Refundable */}
        <div className="mb-4">
          <h3 className="font-medium mb-2">Refundable</h3>
          <div className="space-y-1">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.refundable.includes(true)}
                onChange={() => handleRefundableChange(true)}
                className="mr-2"
              />
              <span className="text-xs">Refundable</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.refundable.includes(false)}
                onChange={() => handleRefundableChange(false)}
                className="mr-2"
              />
              <span className="text-xs">Non-Refundable</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
} 