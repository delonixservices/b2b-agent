'use client'

import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import HotelIdSearchExample from '../components/HotelIdSearchExample'

export default function TestHotelIdsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Hotel ID Search Test
          </h1>
          <p className="text-lg text-gray-600">
            Test the new hotel ID search functionality with pagination
          </p>
        </div>
        
        <HotelIdSearchExample />
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Sample Hotel IDs for Testing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Small List (5 hotels):</h3>
              <code className="text-sm bg-gray-100 p-2 rounded block">
                hotel_001,hotel_002,hotel_003,hotel_004,hotel_005
              </code>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Medium List (60 hotels):</h3>
              <code className="text-sm bg-gray-100 p-2 rounded block">
                hotel_001,hotel_002,hotel_003,hotel_004,hotel_005,hotel_006,hotel_007,hotel_008,hotel_009,hotel_010,hotel_011,hotel_012,hotel_013,hotel_014,hotel_015,hotel_016,hotel_017,hotel_018,hotel_019,hotel_020,hotel_021,hotel_022,hotel_023,hotel_024,hotel_025,hotel_026,hotel_027,hotel_028,hotel_029,hotel_030,hotel_031,hotel_032,hotel_033,hotel_034,hotel_035,hotel_036,hotel_037,hotel_038,hotel_039,hotel_040,hotel_041,hotel_042,hotel_043,hotel_044,hotel_045,hotel_046,hotel_047,hotel_048,hotel_049,hotel_050,hotel_051,hotel_052,hotel_053,hotel_054,hotel_055,hotel_056,hotel_057,hotel_058,hotel_059,hotel_060
              </code>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Expected Behavior:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Small list: All 5 hotels shown on first page, no "Load More" button</li>
              <li>• Medium list: First 50 hotels shown, "Load More" button appears</li>
              <li>• Click "Load More": Next 10 hotels (51-60) are loaded</li>
              <li>• After loading all hotels: "End of results" message appears</li>
            </ul>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
} 