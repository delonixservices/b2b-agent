'use client'

import { Hotel } from '../types/hotel'

interface DebugInfoProps {
  hotels: Hotel[]
  loading: boolean
  error: string | null
  totalHotels: number
}

export default function DebugInfo({ hotels, loading, error, totalHotels }: DebugInfoProps) {
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
      <h3 className="font-bold mb-2">🔍 Debug Info</h3>
      <div className="text-sm space-y-1">
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Error: {error || 'None'}</div>
        <div>Total Hotels: {totalHotels}</div>
        <div>Hotels in State: {hotels.length}</div>
        {hotels.length > 0 && (
          <div>
            <div>First Hotel:</div>
            <pre className="text-xs bg-yellow-200 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify({
                id: hotels[0].id,
                name: hotels[0].name,
                packagesCount: hotels[0].rates?.packages?.length || 0,
                firstPackage: hotels[0].rates?.packages?.[0] ? {
                  base_amount: hotels[0].rates.packages[0].base_amount,
                  chargeable_rate: hotels[0].rates.packages[0].chargeable_rate,
                  room_details: hotels[0].rates.packages[0].room_details
                } : null
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
} 