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
import { splitHotelIdsIntoBatches } from '../../utils/hotelUtils'

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
  const [totalHotels, setTotalHotels] = useState(0)
  const [transactionIdentifier, setTransactionIdentifier] = useState('')
  const [sort, setSort] = useState('popular')
  
  // Hotel ID pagination state
  const [allHotelIds, setAllHotelIds] = useState<string[]>([])
  const [hotelIdBatches, setHotelIdBatches] = useState<string[][]>([])
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0)
  const [hasMoreBatches, setHasMoreBatches] = useState(false)

  // Extract search parameters from URL
  const getSearchParams = () => {
    const area = searchParams.get('area')
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const rooms = searchParams.get('rooms')
    const adults = searchParams.get('adults')
    const children = searchParams.get('children')
    const childrenAges = searchParams.get('childrenAges')
    const hotelIds = searchParams.get('hotelIds')

    if (!area || !checkIn || !checkOut || !rooms || !adults) {
      throw new Error('Missing required search parameters')
    }

    const areaData = JSON.parse(decodeURIComponent(area))
    
    // Extract hotel IDs from area.id if they exist
    let extractedHotelIds: string[] = []
    if (hotelIds) {
      // If hotelIds parameter exists, use it
      extractedHotelIds = JSON.parse(decodeURIComponent(hotelIds))
    } else if (areaData.id && typeof areaData.id === 'string') {
      // If hotel IDs are in area.id as comma-separated string, split them
      extractedHotelIds = areaData.id.split(',').filter(id => id.trim() !== '')
    }

    return {
      area: areaData,
      checkIn,
      checkOut,
      rooms: parseInt(rooms),
      adults: parseInt(adults),
      children: children ? parseInt(children) : 0,
      childrenAges: childrenAges ? JSON.parse(decodeURIComponent(childrenAges)) : [],
      hotelIds: extractedHotelIds
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
        // Add children ages if available
        const roomChildrenAges = childrenAges.slice(i * childrenPerRoom, (i + 1) * childrenPerRoom)
        if (roomChildrenAges.length > 0) {
          roomDetail.children = roomChildrenAges.map(age => ({ age }))
        }
      }
      
      details.push(roomDetail)
    }
    
    return details
  }

  // Search hotels API call
  const searchHotels = async (hotelIdsToSearch: string[], isLoadMore: boolean = false) => {
    try {
      setLoading(true)
      const params = getSearchParams()
      
      const roomDetails = buildRoomDetails(params.rooms, params.adults, params.children, params.childrenAges)
      
      // Create area object with ONLY the current batch of hotel IDs in area.id
      const areaWithCurrentBatch = {
        id: hotelIdsToSearch.join(','), // Send only current batch as comma-separated string
        type: params.area.type,
        name: params.area.name,
        transaction_identifier: params.area.transaction_identifier || transactionIdentifier || undefined
      }
      
      // Always send price filter with min: 0, max: 0 regardless of user selection
      const cleanFilters = { 
        ...filters,
        price: { min: 0, max: 0 }
      }
      
      // Search payload with hotel IDs in area.id field
      const searchPayload = {
        details: roomDetails,
        area: areaWithCurrentBatch,
        checkindate: params.checkIn,
        checkoutdate: params.checkOut,
        page: 1, // Always use page 1 since we're handling pagination via hotel IDs
        perPage: 50,
        currentHotelsCount: 0, // Always send 0
        transaction_identifier: params.area.transaction_identifier || transactionIdentifier || undefined,
        filters: cleanFilters
      }

      console.log(`🔍 Searching for ${hotelIdsToSearch.length} hotel IDs in area.id:`, hotelIdsToSearch.join(','))
      console.log('📤 Search payload:', JSON.stringify(searchPayload, null, 2))

      // Get authentication token from localStorage
      const token = localStorage.getItem('token')
      
      const data: SearchResponse = await hotelApi.searchHotels(searchPayload, token || undefined)
      
      if (data.success) {
        console.log(`✅ Search successful - received ${data.data.hotels.length} hotels`)
        
        if (isLoadMore) {
          // Load more - append hotels
          setHotels(prev => [...prev, ...data.data.hotels])
          console.log(`📈 Appended ${data.data.hotels.length} hotels. Total now: ${hotels.length + data.data.hotels.length}`)
        } else {
          // Initial load - replace hotels
          setHotels(data.data.hotels)
          console.log(`📊 Initial load complete - ${data.data.hotels.length} hotels loaded`)
        }
        
        // Update price range on initial load
        if (!isLoadMore && data.data.price) {
          setPriceRange({
            min: data.data.price.minPrice,
            max: data.data.price.maxPrice
          })
          setFilters(prev => ({
            ...prev,
            price: { min: data.data.price.minPrice, max: data.data.price.maxPrice }
          }))
        }
        
        if (data.data.transaction_identifier) {
          setTransactionIdentifier(data.data.transaction_identifier)
          console.log('Setting transaction_identifier from search response:', data.data.transaction_identifier)
        }
      } else {
        throw new Error(data.message || 'Search failed')
      }
    } catch (err) {
      console.error('❌ Search error:', err)
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

  // Load more hotels (next batch)
  const loadMoreHotels = () => {
    if (loading || !hasMoreBatches) return
    
    const nextBatchIndex = currentBatchIndex + 1
    if (nextBatchIndex < hotelIdBatches.length) {
      const nextBatch = hotelIdBatches[nextBatchIndex]
      console.log(`🔄 Loading batch ${nextBatchIndex + 1} of ${hotelIdBatches.length}:`, nextBatch)
      console.log(`📊 Batch contains ${nextBatch.length} hotel IDs`)
      setCurrentBatchIndex(nextBatchIndex)
      
      // Check if this is the last batch
      if (nextBatchIndex === hotelIdBatches.length - 1) {
        setHasMoreBatches(false)
        console.log('⚠️ This is the final batch - no more batches available')
      }
      
      searchHotels(nextBatch, true)
    } else {
      console.log('✅ All batches have been loaded')
      setHasMoreBatches(false)
    }
  }

  // Initialize search and pagination
  const initializeSearch = async () => {
    try {
      const params = getSearchParams()
      
      // Set up hotel ID pagination
      if (params.hotelIds && params.hotelIds.length > 0) {
        console.log(`🏨 Found ${params.hotelIds.length} hotel IDs in URL`)
        setAllHotelIds(params.hotelIds)
        setTotalHotels(params.hotelIds.length)
        
        // Split hotel IDs into batches of 50
        const batches = splitHotelIdsIntoBatches(params.hotelIds, 50)
        console.log(`📦 Split into ${batches.length} batches of 50 hotels each:`, batches.map(batch => batch.length))
        setHotelIdBatches(batches)
        setCurrentBatchIndex(0)
        setHasMoreBatches(batches.length > 1)
        
        // Load first batch only
        if (batches.length > 0) {
          const firstBatch = batches[0]
          console.log(`🚀 Loading initial batch 1 of ${batches.length}:`, firstBatch)
          console.log(`📊 First batch contains ${firstBatch.length} hotel IDs`)
          await searchHotels(firstBatch, false)
        }
      } else {
        // No hotel IDs - fallback to regular search
        console.log('🔍 No hotel IDs found in URL - performing regular search')
        setTotalHotels(0)
        setHasMoreBatches(false)
        await searchHotels([], false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid search parameters')
      setLoading(false)
    }
  }

  // Apply filters
  const applyFilters = (newFilters: Partial<Filters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    setHotels([])
    setCurrentBatchIndex(0)
    initializeSearch()
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
    initializeSearch()
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
              pollingStatus={hasMoreBatches ? 'in-progress' : 'complete'}
              totalHotels={totalHotels}
              onLoadMore={loadMoreHotels}
              transactionIdentifier={transactionIdentifier}
              loadedBatches={currentBatchIndex + 1}
              totalBatches={hotelIdBatches.length}
            />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
} 