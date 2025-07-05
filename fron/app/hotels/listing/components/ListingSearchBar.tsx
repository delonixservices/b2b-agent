'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { Dayjs } from 'dayjs'

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

export default function ListingSearchBar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
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

  // Initialize with current search params
  useEffect(() => {
    const area = searchParams.get('area')
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const roomsParam = searchParams.get('rooms')
    const adults = searchParams.get('adults')
    const children = searchParams.get('children')
    const childrenAges = searchParams.get('childrenAges')

    if (area) {
      const areaData = JSON.parse(decodeURIComponent(area))
      setSelectedArea(areaData)
      setSelectedLocation(areaData.name)
    }
    if (checkIn) setCheckInDate(dayjs(checkIn))
    if (checkOut) setCheckOutDate(dayjs(checkOut))
    if (roomsParam) setRooms(parseInt(roomsParam))
    if (adults) setGuestInfo(prev => ({ ...prev, adults: parseInt(adults) }))
    if (children) setGuestInfo(prev => ({ ...prev, children: parseInt(children) }))
    if (childrenAges) {
      const ages = JSON.parse(decodeURIComponent(childrenAges))
      setGuestInfo(prev => ({ ...prev, childrenAges: ages }))
    }
  }, [searchParams])

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
      const response = await fetch('http://localhost:3334/api/hotels/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          page: 1,
          perPage: 10,
          currentItemsCount: 0
        })
      })
      if (response.ok) {
        const data: SuggestResponse = await response.json()
        setSuggestions(data.data)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      setSuggestions([])
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
      name: suggestion.name
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
    <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex flex-col md:flex-row items-center gap-4 md:gap-2" style={{border: '1px solid #e5e7eb'}}>
      {/* Location Search */}
      <div className="relative flex-1 min-w-[200px]" ref={searchRef}>
        <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">CITY, AREA OR PROPERTY</label>
        <input
          type="text"
          value={searchTerm || selectedLocation}
          onChange={e => {
            setSearchTerm(e.target.value)
            setSelectedLocation('')
            setSelectedArea(null)
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Enter location"
          className="w-full text-lg font-bold text-gray-800 bg-transparent border-0 focus:ring-0 focus:outline-none p-0 placeholder-gray-400"
          style={{ minHeight: '2.5rem' }}
        />
        {isLoading && !selectedLocation && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.id}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
              >
                <div className="font-medium text-gray-800">{suggestion.displayName}</div>
                {suggestion.hotelCount && (
                  <div className="text-sm text-gray-600">{suggestion.hotelCount} hotels available</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Check-In */}
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">CHECK-IN</label>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={checkInDate}
            onChange={newValue => setCheckInDate(newValue)}
            minDate={dayjs()}
            slotProps={{
              textField: {
                variant: 'standard',
                InputProps: {
                  style: {
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#1f2937',
                    border: 'none',
                    outline: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background: 'transparent',
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
          <div className="text-xs text-gray-500 mt-1">{checkInDate.format('ddd, D MMM YYYY')}</div>
        )}
      </div>
      {/* Check-Out */}
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">CHECK-OUT</label>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={checkOutDate}
            onChange={newValue => setCheckOutDate(newValue)}
            minDate={checkInDate || dayjs()}
            slotProps={{
              textField: {
                variant: 'standard',
                InputProps: {
                  style: {
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#1f2937',
                    border: 'none',
                    outline: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background: 'transparent',
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
          <div className="text-xs text-gray-500 mt-1">{checkOutDate.format('ddd, D MMM YYYY')}</div>
        )}
      </div>
      {/* Rooms & Guests */}
      <div className="flex-1 min-w-[180px] relative" ref={guestRef}>
        <label className="block text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">ROOMS & GUESTS</label>
        <div
          className="w-full text-lg font-bold text-gray-800 bg-transparent border-0 focus:ring-0 focus:outline-none p-0 cursor-pointer"
          style={{ minHeight: '2.5rem' }}
          onClick={() => setShowGuestSelector(!showGuestSelector)}
        >
          {rooms} Room{rooms > 1 ? 's' : ''}, {guestInfo.adults} Adult{guestInfo.adults > 1 ? 's' : ''}
        </div>
        {/* Guest Selector Dropdown */}
        {showGuestSelector && (
          <div className="absolute z-50 w-80 mt-2 bg-white border border-gray-300 rounded-md shadow-lg p-6">
            <div className="space-y-4">
              {/* Room */}
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-800">Room</div>
                <select
                  value={rooms}
                  onChange={e => setRooms(Number(e.target.value))}
                  className="w-12 h-8 border border-gray-300 rounded shadow-sm text-base text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {[1,2,3,4,5].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {/* Adults */}
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-800">Adults</div>
                <select
                  value={guestInfo.adults}
                  onChange={e => updateGuestInfo('adults', Number(e.target.value))}
                  className="w-12 h-8 border border-gray-300 rounded shadow-sm text-base text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {Array.from({length: 10}, (_, i) => i+1).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              {/* Children */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">Children</div>
                  <div className="text-xs text-gray-600">0 - 17 Years Old</div>
                </div>
                <select
                  value={guestInfo.children}
                  onChange={e => updateGuestInfo('children', Number(e.target.value))}
                  className="w-12 h-8 border border-gray-300 rounded shadow-sm text-base text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {Array.from({length: 7}, (_, i) => i).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* Children Ages */}
              {guestInfo.children > 0 && (
                <div className="space-y-2">
                  <div className="font-medium text-sm text-gray-800">Children's Ages</div>
                  {Array.from({ length: guestInfo.children }, (_, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Child {index + 1}</span>
                      <select
                        value={guestInfo.childrenAges[index] || 0}
                        onChange={e => updateChildAge(index, parseInt(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        {Array.from({ length: 18 }, (_, age) => (
                          <option key={age} value={age}>{age} years</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs text-gray-600 mt-2">Please provide right number of children along with their right age for best options and prices.</div>
              <div className="flex justify-end pt-2">
                <button
                  className="bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-blue-600 transition"
                  onClick={() => setShowGuestSelector(false)}
                >
                  APPLY
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Search Button */}
      <div className="flex-shrink-0 mt-6 md:mt-7">
        <button
          onClick={handleSearch}
          className="bg-gradient-to-r from-blue-400 to-blue-700 text-white font-bold text-lg px-8 py-3 rounded-lg shadow hover:from-blue-500 hover:to-blue-800 transition uppercase tracking-wide"
          style={{ minWidth: 120 }}
        >
          SEARCH
        </button>
      </div>
    </div>
  )
} 