'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { DemoContainer } from '@mui/x-date-pickers/internals/demo'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { Dayjs } from 'dayjs'
import { hotelApi } from '../../services/hotelApi'

interface SuggestionItem {
  id: string
  name: string
  displayName: string
  hotelCount?: number
  transaction_identifier: string
}

interface SuggestResponse {
  data: SuggestionItem[]
  status: string
  currentItemsCount: number
  totalItemsCount: number
  page: number
  perPage: number
  totalPages: number
}

interface GuestInfo {
  adults: number
  children: number
  childrenAges: number[]
}

export default function HotelSearchBar() {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<'upto4' | 'group'>('upto4')
  const [rooms, setRooms] = useState(1)
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    adults: 2,
    children: 0,
    childrenAges: []
  })
  const [checkInDate, setCheckInDate] = useState<Dayjs | null>(dayjs())
  const [checkOutDate, setCheckOutDate] = useState<Dayjs | null>(dayjs().add(2, 'day'))
  const [showGuestSelector, setShowGuestSelector] = useState(false)
  const [selectedArea, setSelectedArea] = useState<any>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const guestRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
      if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
        setShowGuestSelector(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch suggestions from API
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }
    setIsLoading(true)
    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem('token')
      
      const data = await hotelApi.suggest({
        query: query,
        page: 1,
        perPage: 10,
        currentItemsCount: 0
      }, token || undefined)
      
      setSuggestions(data.data)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
      // Handle 401 errors specifically
      if (error instanceof Error && error.message.includes('401')) {
        console.error('Authentication required for hotel suggestions')
        // You can add a toast notification or redirect to login here
        // For now, we'll just log the error
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        fetchSuggestions(searchTerm)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    setSelectedLocation(suggestion.name)
    setSelectedCountry(suggestion.name.includes('|') ? suggestion.name.split('|')[1]?.trim() || '' : '')
    setSelectedArea({
      id: suggestion.id,
      type: suggestion.id.includes('city') ? 'city' : suggestion.id.includes('hotel') ? 'hotel' : 'poi',
      name: suggestion.name,
      transaction_identifier: suggestion.transaction_identifier
    })
    setSearchTerm('')
    setShowSuggestions(false)
  }

  const updateGuestInfo = (type: 'adults' | 'children', value: number) => {
    if (type === 'adults') {
      setGuestInfo(prev => ({
        ...prev,
        adults: Math.max(1, Math.min(10, value))
      }))
    } else if (type === 'children') {
      const newChildren = Math.max(0, Math.min(6, value))
      setGuestInfo(prev => ({
        ...prev,
        children: newChildren,
        childrenAges: prev.childrenAges.slice(0, newChildren)
      }))
    }
  }

  const updateChildAge = (index: number, age: number) => {
    setGuestInfo(prev => ({
      ...prev,
      childrenAges: prev.childrenAges.map((childAge, i) => i === index ? age : childAge)
    }))
  }

  // Handler for deal selection
  const handleDealChange = (deal: 'upto4' | 'group') => {
    setSelectedDeal(deal)
    if (deal === 'upto4') {
      setRooms(1)
      setGuestInfo(prev => ({ ...prev, adults: 2 }))
    } else if (deal === 'group') {
      setRooms(5)
      setGuestInfo(prev => ({ ...prev, adults: 10 }))
    }
  }

  // Handle search
  const handleSearch = () => {
    if (!selectedArea || !checkInDate || !checkOutDate) {
      alert('Please select location, check-in and check-out dates')
      return
    }

    const searchParams = new URLSearchParams({
      area: encodeURIComponent(JSON.stringify(selectedArea)),
      checkIn: checkInDate.format('YYYY-MM-DD'),
      checkOut: checkOutDate.format('YYYY-MM-DD'),
      rooms: rooms.toString(),
      adults: guestInfo.adults.toString(),
      children: guestInfo.children.toString(),
      childrenAges: encodeURIComponent(JSON.stringify(guestInfo.childrenAges))
    })

    router.push(`/hotels/listing?${searchParams.toString()}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{zIndex: 1}}>
      {/* Hotels & Homestays Tab Bar overlapping the search card */}
      <div style={{position: 'absolute', left: '50%', top: 0, transform: 'translate(-50%, -50%)', zIndex: 2}}>
        <div className="flex bg-white rounded-t-2xl shadow-lg px-8 py-4 items-end" style={{minWidth: 200}}>
          <div className="flex flex-col items-center px-8 cursor-pointer">
            <span className="mb-1">
              <img src="https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRSFwB4oRyOL_OSnuZq0taSYHcprDY0fcgWXqm9kCE3QGRrlXpd" alt="Hotels Icon" className="w-10 h-10 object-contain" />
            </span>
            <span className="text-base font-bold text-blue-600">Hotels & Homestays</span>
            <span className="block w-8 h-1 bg-blue-500 rounded-full mt-1"></span>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-lg mt-12" style={{paddingTop: '3.5rem'}}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" checked={selectedDeal === 'upto4'} onChange={() => handleDealChange('upto4')} className="form-radio text-black" />
              <span className="font-bold text-base bg-blue-100 text-black px-3 py-1 rounded-full">Upto 4 Rooms</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" checked={selectedDeal === 'group'} onChange={() => handleDealChange('group')} className="form-radio text-black" />
              <span className="text-black">Group Deals</span>
              <span className="ml-1 text-xs bg-pink-200 text-pink-800 rounded px-2 py-0.5">new</span>
            </label>
          </div>
          <div className="text-right text-xs text-black font-medium hidden md:block">
            Last Search:
          </div>
        </div>
        
        <div className="text-center mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-black mb-2">Book Domestic and International hotels</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Location Search */}
          <div className="relative flex flex-col justify-center" ref={searchRef}>
            <label className="block text-xs text-black mb-1">CITY/AREA/LANDMARK/PROPERTY NAME</label>
            <div className="relative">
              {selectedLocation ? (
                <div className="text-3xl font-bold text-black leading-tight">{selectedLocation}</div>
              ) : (
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Hotel"
                className="w-full text-3xl font-bold text-black bg-transparent border-0 focus:ring-0 focus:outline-none p-0 placeholder-black"
                style={{ minHeight: '2.5rem' }}
              />
              )}
              {isLoading && !selectedLocation && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                </div>
              )}
            </div>
            {/* Suggestions Dropdown */}
            {!selectedLocation && showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-black rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.id}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-black last:border-b-0"
                  >
                    <div className="font-medium text-black">{suggestion.displayName}</div>
                    {suggestion.hotelCount && (
                      <div className="text-sm text-black">{suggestion.hotelCount} hotels available</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Selected Location Display */}
            {selectedLocation && (
                <div className="text-black text-sm">{selectedCountry}</div>
            )}
          </div>
          
          {/* Check-In */}
          <div className="flex flex-col justify-center">
            <label className="block text-xs text-black mb-1">Check-In</label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                value={checkInDate}
                onChange={(newValue) => setCheckInDate(newValue)}
                minDate={dayjs()}
                slotProps={{
                  textField: {
                    variant: 'standard',
                    InputProps: {
                      style: {
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'black',
                        border: 'none',
                        outline: 'none',
                        padding: 0,
                        cursor: 'pointer'
                      }
                    },
                    sx: {
                      '& .MuiInput-underline:before': { borderBottom: 'none' },
                      '& .MuiInput-underline:after': { borderBottom: 'none' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
                    }
                  }
                }}
            />
            </LocalizationProvider>
            {checkInDate && (
              <div className="text-black text-sm">
                {checkInDate.format('dddd')}
              </div>
            )}
          </div>
          
          {/* Check-Out */}
          <div className="flex flex-col justify-center">
            <label className="block text-xs text-black mb-1">Check-Out</label>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                value={checkOutDate}
                onChange={(newValue) => setCheckOutDate(newValue)}
                minDate={checkInDate || dayjs()}
                slotProps={{
                  textField: {
                    variant: 'standard',
                    InputProps: {
                      style: {
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'black',
                        border: 'none',
                        outline: 'none',
                        padding: 0,
                        cursor: 'pointer'
                      }
                    },
                    sx: {
                      '& .MuiInput-underline:before': { borderBottom: 'none' },
                      '& .MuiInput-underline:after': { borderBottom: 'none' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
                    }
                  }
                }}
            />
            </LocalizationProvider>
            {checkOutDate && (
              <div className="text-black text-sm">
                {checkOutDate.format('dddd')}
              </div>
            )}
          </div>
          
          {/* Rooms & Guests */}
          <div className="flex flex-col justify-center relative" ref={guestRef}>
            <label className="block text-xs text-black mb-1">
              Rooms & Guests
            </label>
            <div 
              className={`cursor-pointer rounded p-2 bg-white transition`}
              onClick={() => setShowGuestSelector(!showGuestSelector)}
            >
              {(rooms && guestInfo.adults) ? (
                <span className="text-2xl font-bold text-black">
                  <span className="font-extrabold text-black">{rooms}</span> Room{rooms > 1 ? 's' : ''} 
                  <span className="font-extrabold text-black ml-2">{guestInfo.adults}</span> Adult{guestInfo.adults > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-black">Select number of people</span>
              )}
            </div>
            {/* Guest Selector Dropdown */}
            {showGuestSelector && (
              <div className="absolute z-50 w-80 mt-2 bg-white border border-black rounded-md shadow-lg p-6">
                <div className="space-y-6">
                  {/* Room */}
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-black">Room</div>
                    <select
                      value={rooms}
                      onChange={e => setRooms(Number(e.target.value))}
                      className="w-12 h-8 border border-black rounded shadow-sm text-base text-center focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                    >
                      {[1,2,3,4,5].map(r => <option key={r} value={r} className="text-black">{r}</option>)}
                    </select>
                  </div>
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-black">Adults</div>
                    <select
                      value={guestInfo.adults}
                      onChange={e => updateGuestInfo('adults', Number(e.target.value))}
                      className="w-12 h-8 border border-black rounded shadow-sm text-base text-center focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                    >
                      {Array.from({length: 10}, (_, i) => i+1).map(a => <option key={a} value={a} className="text-black">{a}</option>)}
                    </select>
                  </div>
                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-black">Children</div>
                      <div className="text-xs text-black">0 - 17 Years Old</div>
                    </div>
                    <select
                      value={guestInfo.children}
                      onChange={e => updateGuestInfo('children', Number(e.target.value))}
                      className="w-12 h-8 border border-black rounded shadow-sm text-base text-center focus:outline-none focus:ring-2 focus:ring-blue-400 text-black"
                    >
                      {Array.from({length: 7}, (_, i) => i).map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                    </select>
                  </div>
                  {/* Children Ages */}
                  {guestInfo.children > 0 && (
                    <div className="space-y-2">
                      <div className="font-medium text-sm text-black">Children's Ages</div>
                      {Array.from({ length: guestInfo.children }, (_, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-black">Child {index + 1}</span>
                          <select
                            value={guestInfo.childrenAges[index] || 0}
                            onChange={(e) => updateChildAge(index, parseInt(e.target.value))}
                            className="border border-black rounded px-2 py-1 text-sm text-black"
                          >
                            {Array.from({ length: 18 }, (_, age) => (
                              <option key={age} value={age} className="text-black">{age} years</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-black mt-2">Please provide right number of children along with their right age for best options and prices.</div>
                  <div className="flex justify-end pt-2">
                    <button
                      className="bg-gradient-to-r from-blue-400 to-blue-700 text-white font-bold px-8 py-2 rounded-full shadow hover:from-blue-500 hover:to-blue-800 transition text-lg"
                      onClick={() => setShowGuestSelector(false)}
                    >
                      APPLY
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-center mt-2">
          <button 
            onClick={handleSearch}
            className="bg-blue-500 text-white text-2xl font-bold py-3 px-20 rounded-full shadow hover:bg-blue-600 transition uppercase tracking-wide"
          >
            SEARCH
          </button>
        </div>
      </div>
    </div>
  )
} 