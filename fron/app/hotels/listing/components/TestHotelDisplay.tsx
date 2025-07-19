'use client'

import { Hotel } from '../types/hotel'

interface TestHotelDisplayProps {
  hotels: Hotel[]
}

export default function TestHotelDisplay({ hotels }: TestHotelDisplayProps) {
  if (hotels.length === 0) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <h3 className="font-bold mb-2">❌ No Hotels Found</h3>
        <p>Hotels array is empty</p>
      </div>
    )
  }

  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      <h3 className="font-bold mb-2">✅ Hotels Found ({hotels.length})</h3>
      {hotels.map((hotel, index) => (
        <div key={hotel.id || index} className="mb-2 p-2 bg-green-200 rounded">
          <div><strong>Hotel {index + 1}:</strong> {hotel.name}</div>
          <div><strong>ID:</strong> {hotel.id}</div>
          <div><strong>City:</strong> {hotel.city}</div>
          <div><strong>Packages:</strong> {hotel.rates?.packages?.length || 0}</div>
          {hotel.rates?.packages?.[0] && (
            <div><strong>Price:</strong> ₹{hotel.rates.packages[0].chargeable_rate || 'N/A'}</div>
          )}
        </div>
      ))}
    </div>
  )
} 