import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function HotelsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Domestic and International hotels</h1>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input type="radio" checked readOnly className="form-radio text-blue-600" />
                  <span className="font-semibold">Upto 4 Rooms</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="radio" disabled className="form-radio text-blue-600" />
                  <span>Group Deals</span>
                  <span className="ml-1 text-xs bg-pink-200 text-pink-800 rounded px-2 py-0.5">new</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-xs text-gray-500 mb-1">CITY/AREA/LANDMARK/PROPERTY NAME</label>
                <div className="text-3xl font-bold text-gray-900">Delhi</div>
                <div className="text-gray-600 text-sm">India</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Check-In</label>
                <div className="text-2xl font-bold">2 <span className="text-base font-normal">Jul'25</span></div>
                <div className="text-gray-600 text-sm">Wednesday</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Check-Out</label>
                <div className="text-2xl font-bold">4 <span className="text-base font-normal">Jul'25</span></div>
                <div className="text-gray-600 text-sm">Friday</div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Rooms & Guests</label>
                <div className="text-2xl font-bold">1 <span className="text-base font-normal">Rooms</span> 2 <span className="text-base font-normal">Adults</span></div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm text-gray-500 mr-2">Popular Filters</span>
              <label className="flex items-center space-x-1">
                <input type="checkbox" className="form-checkbox" />
                <span>Full Board</span>
              </label>
              <label className="flex items-center space-x-1">
                <input type="checkbox" className="form-checkbox" />
                <span>Half Board</span>
              </label>
              <label className="flex items-center space-x-1">
                <input type="checkbox" className="form-checkbox" />
                <span>Partner Exclusive Rate</span>
              </label>
              <label className="flex items-center space-x-1">
                <input type="checkbox" className="form-checkbox" />
                <span>Free Cancellation</span>
              </label>
              <label className="flex items-center space-x-1">
                <input type="checkbox" className="form-checkbox" />
                <span>Free Breakfast</span>
              </label>
            </div>
            <div className="flex justify-center">
              <button className="bg-blue-500 text-white text-xl font-bold py-3 px-12 rounded-full shadow hover:bg-blue-600 transition">SEARCH</button>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-72 md:h-96 relative">
        <img src="/hotel-hero.jpg" alt="Hotel Hero" className="object-cover w-full h-full" />
        {/* Replace /hotel-hero.jpg with the actual hero image path or import */}
      </div>
      <Footer />
    </div>
  )
} 