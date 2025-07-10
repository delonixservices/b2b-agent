'use client'

import { useSearchParams } from 'next/navigation'
import dayjs from 'dayjs'

interface SearchSummaryProps {
  totalHotels: number
  cityFallback?: { used: boolean; city: string }
}

export default function SearchSummary({ totalHotels, cityFallback }: SearchSummaryProps) {
  const searchParams = useSearchParams()

  return (
    <div className="bg-white rounded-md shadow p-2 mb-6">
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        <span className="font-semibold text-gray-800">Search Results:</span>
        <span>{totalHotels} hotels found</span>
        <span>•</span>
        <span>{searchParams.get('area') ? JSON.parse(decodeURIComponent(searchParams.get('area')!)).name : ''}</span>
        {cityFallback?.used && (
          <>
            <span>•</span>
            <span className="text-blue-600 font-medium">
              Showing hotels in {cityFallback.city} (city fallback)
            </span>
          </>
        )}
        <span>•</span>
        <span>{dayjs(searchParams.get('checkIn')).format('MMM DD')} - {dayjs(searchParams.get('checkOut')).format('MMM DD')}</span>
        <span>•</span>
        <span>{searchParams.get('rooms')} room(s), {searchParams.get('adults')} adult(s)</span>
      </div>
    </div>
  )
} 