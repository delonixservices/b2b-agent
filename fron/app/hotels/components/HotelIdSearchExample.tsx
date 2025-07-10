'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateListingUrlWithHotelIds } from '../../utils/hotelUtils'

export default function HotelIdSearchExample() {
  const router = useRouter()
  const [hotelIds, setHotelIds] = useState<string>('')
  const [searchParams, setSearchParams] = useState({
    area: {
      id: 'city_123',
      type: 'city',
      name: 'Mumbai, Maharashtra, India',
      transaction_identifier: 'test_transaction'
    },
    checkIn: '2024-01-15',
    checkOut: '2024-01-17',
    rooms: 1,
    adults: 2,
    children: 0,
    childrenAges: []
  })

  const handleSearchWithHotelIds = () => {
    try {
      // Parse hotel IDs from input
      const parsedHotelIds = hotelIds.split(',').map(id => id.trim()).filter(id => id)
      
      if (parsedHotelIds.length === 0) {
        alert('Please enter at least one hotel ID')
        return
      }

      // Generate URL with hotel IDs
      const url = generateListingUrlWithHotelIds(searchParams, parsedHotelIds)
      
      // Navigate to listing page
      router.push(url)
    } catch (error) {
      console.error('Error generating URL:', error)
      alert('Error generating search URL')
    }
  }

  const handleSearchWithoutHotelIds = () => {
    // Regular search without hotel IDs
    const params = new URLSearchParams({
      area: encodeURIComponent(JSON.stringify(searchParams.area)),
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      rooms: searchParams.rooms.toString(),
      adults: searchParams.adults.toString(),
      children: searchParams.children.toString(),
      childrenAges: encodeURIComponent(JSON.stringify(searchParams.childrenAges))
    })

    router.push(`/hotels/listing?${params.toString()}`)
  }

  const loadExample = (exampleType: 'small' | 'medium' | 'large') => {
    let exampleIds = ''
    
    switch (exampleType) {
      case 'small':
        exampleIds = 'hotel_001,hotel_002,hotel_003,hotel_004,hotel_005'
        break
      case 'medium':
        // Generate 60 hotel IDs
        exampleIds = Array.from({ length: 60 }, (_, i) => `hotel_${String(i + 1).padStart(3, '0')}`).join(',')
        break
      case 'large':
        // Generate 150 hotel IDs
        exampleIds = Array.from({ length: 150 }, (_, i) => `hotel_${String(i + 1).padStart(3, '0')}`).join(',')
        break
    }
    
    setHotelIds(exampleIds)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Hotel ID-Based Pagination Demo</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hotel IDs (comma-separated)
            </label>
            <textarea
              value={hotelIds}
              onChange={(e) => setHotelIds(e.target.value)}
              placeholder="Enter hotel IDs separated by commas (e.g., hotel_123, hotel_456, hotel_789)"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={6}
            />
            <p className="text-sm text-gray-500 mt-1">
              Current count: {hotelIds.split(',').filter(id => id.trim()).length} hotels
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleSearchWithHotelIds}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Search with Hotel IDs
            </button>
            
            <button
              onClick={handleSearchWithoutHotelIds}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Regular Search
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Quick Examples</h3>
            <div className="space-y-2">
              <button
                onClick={() => loadExample('small')}
                className="w-full text-left p-3 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
              >
                <div className="font-medium text-green-800">Small List (5 hotels)</div>
                <div className="text-sm text-green-600">All hotels load on first page, no pagination needed</div>
              </button>
              
              <button
                onClick={() => loadExample('medium')}
                className="w-full text-left p-3 bg-yellow-50 border border-yellow-200 rounded-md hover:bg-yellow-100 transition-colors"
              >
                <div className="font-medium text-yellow-800">Medium List (60 hotels)</div>
                <div className="text-sm text-yellow-600">First 50 hotels + "Load More" for remaining 10</div>
              </button>
              
              <button
                onClick={() => loadExample('large')}
                className="w-full text-left p-3 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
              >
                <div className="font-medium text-red-800">Large List (150 hotels)</div>
                <div className="text-sm text-red-600">3 batches: 50 + 50 + 50 hotels with progress tracking</div>
              </button>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-semibold mb-2 text-blue-800">How Pagination Works</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Batch Size:</strong> 50 hotels per API call</li>
              <li>• <strong>First Load:</strong> Shows first 50 hotels</li>
              <li>• <strong>Load More:</strong> Fetches next 50 hotel IDs</li>
              <li>• <strong>Progress:</strong> Shows "Loaded X of Y batches"</li>
              <li>• <strong>Completion:</strong> "All hotels loaded successfully!"</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 p-4 rounded-md">
        <h3 className="font-semibold mb-2">Expected Behavior by Example</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-green-700">Small List (5 hotels)</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• All 5 hotels shown immediately</li>
              <li>• No "Load More" button</li>
              <li>• Shows "End of results"</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-yellow-700">Medium List (60 hotels)</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• First 50 hotels shown</li>
              <li>• "Load More" button appears</li>
              <li>• Click loads remaining 10</li>
              <li>• Progress: "1 of 2 batches"</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-red-700">Large List (150 hotels)</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• First 50 hotels shown</li>
              <li>• Multiple "Load More" clicks</li>
              <li>• Progress bar shows completion</li>
              <li>• "3 of 3 batches" when complete</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-blue-50 p-4 rounded-md">
        <h3 className="font-semibold mb-2 text-blue-800">Current Search Parameters</h3>
        <pre className="text-xs text-blue-700 overflow-auto bg-blue-100 p-2 rounded">
          {JSON.stringify(searchParams, null, 2)}
        </pre>
      </div>
    </div>
  )
} 