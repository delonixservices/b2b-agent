'use client'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HotelSearchBar from './components/HotelSearchBar'
import './datepicker-custom.css'

export default function HotelsPage() {
  return (
    <div className="min-h-screen relative">
      <Navbar />
      {/* Background Image */}
      <div className="absolute inset-0 z-0 h-64 md:h-80">
        <img 
          src="https://www.itchotels.com/content/dam/itchotels/in/umbrella/destinations/images/desktop/mussoorie.jpg" 
          alt="ITC Hotels Mussoorie" 
          className="object-cover w-full h-full" 
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>
      {/* Main Content */}
      <div className="relative z-10 pt-20 pb-16">
        <HotelSearchBar />
      </div>
      <Footer />
    </div>
  )
} 