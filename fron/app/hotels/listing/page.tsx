'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import SearchSummary from './components/SearchSummary'
import ListingSearchBar from './components/ListingSearchBar'
import HotelFilters from './components/HotelFilters'
import HotelList from './components/HotelList'
import SortBar from './components/SortBar'
import { Hotel, Filters, SearchResponse } from './types/hotel'
import { hotelApi } from '../../services/hotelApi'

export default function HotelListingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    roomType: [],
    foodType: [],
    refundable: [],
    starRating: [],
    price: { min: 0, max: 0 }
  })
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalHotels, setTotalHotels] = useState(0)
  const [pollingStatus, setPollingStatus] = useState('in-progress')
  const [transactionIdentifier, setTransactionIdentifier] = useState('')
  const [sort, setSort] = useState('popular')

  // Extract search parameters from URL
  const getSearchParams = () => {
    const area = searchParams.get('area')
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const rooms = searchParams.get('rooms')
    const adults = searchParams.get('adults')
    const children = searchParams.get('children')
    const childrenAges = searchParams.get('childrenAges')

    if (!area || !checkIn || !checkOut || !rooms || !adults) {
      throw new Error('Missing required search parameters')
    }

    return {
      area: JSON.parse(decodeURIComponent(area)),
      checkIn,
      checkOut,
      rooms: parseInt(rooms),
      adults: parseInt(adults),
      children: children ? parseInt(children) : 0,
      childrenAges: childrenAges ? JSON.parse(decodeURIComponent(childrenAges)) : []
    }
  }

  // Build room details for API
  const buildRoomDetails = (rooms: number, adults: number, children: number, childrenAges: number[]) => {
    const details = []
    const adultsPerRoom = Math.ceil(adults / rooms)
    const childrenPerRoom = Math.ceil(children / rooms)
    
    for (let i = 0; i < rooms; i++) {
      const roomDetail: any = {
        adult_count: adultsPerRoom
      }
      
      if (children > 0) {
        roomDetail.child_count = childrenPerRoom
        roomDetail.children = childrenAges.slice(i * childrenPerRoom, (i + 1) * childrenPerRoom)
      }
      
      details.push(roomDetail)
    }
    
    return details
  }

  // Search hotels API call
  const searchHotels = async (page: number = 1, currentHotelsCount: number = 0) => {
    try {
      setLoading(true)
      const params = getSearchParams()
      
      const roomDetails = buildRoomDetails(params.rooms, params.adults, params.children, params.childrenAges)
      
      const searchPayload = {
        details: roomDetails,
        area: params.area,
        checkindate: params.checkIn,
        checkoutdate: params.checkOut,
        page,
        perPage: 50, // Increased to show all 50 hotels
        currentHotelsCount,
        transaction_identifier: transactionIdentifier || undefined,
        filters
      }

      console.log('Search payload:', searchPayload)

      // Get authentication token from localStorage
      const token = localStorage.getItem('token')
      
      const data: SearchResponse = await hotelApi.searchHotels(searchPayload, token || undefined)
      
      if (data.success) {
        if (page === 1) {
          setHotels(data.data.hotels)
          if (data.data.price) {
            setPriceRange({
              min: data.data.price.minPrice,
              max: data.data.price.maxPrice
            })
            setFilters(prev => ({
              ...prev,
              price: { min: data.data.price.minPrice, max: data.data.price.maxPrice }
            }))
          }
        } else {
          setHotels(prev => [...prev, ...data.data.hotels])
        }
        
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages)
          setTotalHotels(data.data.pagination.totalHotelsCount)
          setPollingStatus(data.data.pagination.pollingStatus)
        } else {
          setTotalHotels(data.data.hotels.length)
          setPollingStatus('complete')
        }
        
        if (data.data.transaction_identifier) {
          setTransactionIdentifier(data.data.transaction_identifier)
        }
        setCurrentPage(page)
      } else {
        throw new Error(data.message || 'Search failed')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      // Handle 401 errors specifically
      if (err instanceof Error && err.message.includes('401')) {
        console.error('Authentication required for hotel search')
        // You can add a toast notification or redirect to login here
      }
    } finally {
      setLoading(false)
    }
  }

  // Load more hotels (pagination)
  const loadMoreHotels = () => {
    if (pollingStatus === 'in-progress' && !loading) {
      searchHotels(currentPage + 1, hotels.length)
    }
  }

  // Apply filters
  const applyFilters = (newFilters: Partial<Filters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    setCurrentPage(1)
    setHotels([])
    searchHotels(1, 0)
  }

  // Sort hotels client-side for now
  const getSortedHotels = () => {
    let sorted = [...hotels]
    if (sort === 'rating_desc') {
      sorted.sort((a, b) => (b.starRating || 0) - (a.starRating || 0))
    } else if (sort === 'price_desc') {
      sorted.sort((a, b) => getMinPrice(b) - getMinPrice(a))
    } else if (sort === 'price_asc') {
      sorted.sort((a, b) => getMinPrice(a) - getMinPrice(b))
    }
    return sorted
  }

  // Helper to get min price
  function getMinPrice(hotel) {
    const prices = hotel.rates.packages.map(pkg =>
      pkg.chargeable_rate > 0 ? pkg.chargeable_rate :
      pkg.chargeable_rate_with_tax_excluded > 0 ? pkg.chargeable_rate_with_tax_excluded :
      pkg.room_rate > 0 ? pkg.room_rate : pkg.base_amount
    ).filter(price => price > 0)
    return prices.length > 0 ? Math.min(...prices) : 0
  }

  // Initialize search on component mount
  useEffect(() => {
    try {
      searchHotels()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid search parameters')
      setLoading(false)
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Search Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => router.push('/hotels')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
            >
              Back to Search
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar for modifying search */}
        <div className="mt-8">
          <ListingSearchBar />
        </div>
        
        {/* Search Summary */}
        <SearchSummary totalHotels={totalHotels} />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <HotelFilters 
            hotels={hotels}
            filters={filters}
            priceRange={priceRange}
            onFiltersChange={applyFilters}
          />

          {/* Hotel Results */}
          <div className="lg:w-3/4">
            <SortBar selected={sort} onSortChange={setSort} />
            <HotelList 
              hotels={getSortedHotels()}
              loading={loading}
              pollingStatus={pollingStatus}
              totalHotels={totalHotels}
              onLoadMore={loadMoreHotels}
            />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
} 