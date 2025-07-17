'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import SearchSummary from './components/SearchSummary'
import ListingSearchBar from './components/ListingSearchBar'
import HotelFilters from './components/HotelFilters'
import HotelList from './components/HotelList'
import SortBar from './components/SortBar'
import { Hotel, Filters, SearchResponse } from './types/hotel'
import { hotelApi, HotelDetails } from '../../services/hotelApi'
import { splitHotelIdsIntoBatches } from '../../utils/hotelUtils'

// Helper function to convert HotelDetails to Hotel
const convertHotelDetailsToHotel = (hotelDetails: HotelDetails): Hotel => {
  return {
    _id: hotelDetails.id,
    id: hotelDetails.id,
    hotelId: hotelDetails.hotelId,
    name: hotelDetails.name,
    originalName: hotelDetails.originalName,
    starRating: hotelDetails.starRating || 0,
    address: hotelDetails.address,
    city: hotelDetails.city || '',
    state: hotelDetails.state,
    stateProvince: hotelDetails.state,
    country: hotelDetails.location?.country || '',
    countryCode: hotelDetails.location?.countryCode,
    image: hotelDetails.image,
    imageDetails: hotelDetails.imageDetails ? {
      images: hotelDetails.imageDetails.images || [],
      count: hotelDetails.imageDetails.count || 0
    } : undefined,
    amenities: hotelDetails.amenities || [],
    rates: {
      packages: hotelDetails.rates.packages.map(pkg => ({
        base_amount: pkg.base_amount || 0,
        chargeable_rate: pkg.chargeable_rate || 0,
        markup_amount: pkg.markup_amount || 0,
        markup_details: pkg.markup_details && pkg.markup_details.id && pkg.markup_details.name && pkg.markup_details.type && pkg.markup_details.value !== undefined ? {
          id: pkg.markup_details.id,
          name: pkg.markup_details.name,
          type: pkg.markup_details.type,
          value: pkg.markup_details.value
        } : undefined,
        room_details: pkg.room_details ? {
          room_type: pkg.room_details.room_type || '',
          food: pkg.room_details.food || '',
          non_refundable: pkg.room_details.non_refundable || false,
          description: pkg.room_details.description,
          supplier_description: pkg.room_details.supplier_description
        } : undefined,
        service_component: pkg.service_component || 0,
        gst: pkg.gst,
        room_rate: pkg.room_rate,
        chargeable_rate_with_tax_excluded: pkg.chargeable_rate_with_tax_excluded,
        taxes_and_fees: pkg.taxes_and_fees && pkg.taxes_and_fees.estimated_total && pkg.taxes_and_fees.estimated_total.currency && pkg.taxes_and_fees.estimated_total.value !== undefined ? {
          estimated_total: {
            currency: pkg.taxes_and_fees.estimated_total.currency,
            value: pkg.taxes_and_fees.estimated_total.value
          }
        } : undefined
      }))
    },
    description: hotelDetails.moreDetails?.description,
    location: hotelDetails.location,
    moreDetails: hotelDetails.moreDetails,
    policy: hotelDetails.policy,
    dailyRates: {
      highest: 0,
      lowest: 0
    }
  }
}

function HotelListingPageContent() {
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

  // Add state to track if city fallback is used and city name
  const [cityFallback, setCityFallback] = useState<{used: boolean, city: string}>({used: false, city: ''})

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
      extractedHotelIds = areaData.id.split(',').filter((id: string) => id.trim() !== '')
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

  // Helper to extract last word from hotel name
  function extractCityFromHotelName(name: string) {
    if (!name) return '';
    
    // Remove common hotel prefixes/suffixes that might interfere with city extraction
    const cleanedName = name
      .replace(/\b(hotel|hotels|inn|resort|palace|tower|plaza|center|centre|lodge|guesthouse|motel)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Split by spaces and get the last meaningful word
    const parts = cleanedName.split(/\s+/);
    
    // Filter out common words that are not city names
    const commonWords = ['the', 'and', 'or', 'in', 'at', 'of', 'for', 'with', 'by', 'near', 'close', 'next', 'across', 'from'];
    const meaningfulParts = parts.filter(part => 
      part.length > 2 && !commonWords.includes(part.toLowerCase())
    );
    
    if (meaningfulParts.length > 0) {
      const lastWord = meaningfulParts[meaningfulParts.length - 1];
      console.log(`📍 Extracted city from "${name}" -> "${lastWord}"`);
      return lastWord;
    }
    
    // Fallback: return the last word from original name
    const originalParts = name.trim().split(/\s+/);
    const fallbackWord = originalParts[originalParts.length - 1];
    console.log(`📍 Fallback city extraction from "${name}" -> "${fallbackWord}"`);
    return fallbackWord;
  }

  // Search hotels API call (with parallel city search for hotel/POI types)
  const searchHotels = async (hotelIdsToSearch: string[], isLoadMore: boolean = false) => {
    try {
      setLoading(true)
      setCityFallback({used: false, city: ''})
      const params = getSearchParams()
      const roomDetails = buildRoomDetails(params.rooms, params.adults, params.children, params.childrenAges)
      const areaWithCurrentBatch = {
        id: hotelIdsToSearch.join(','),
        type: params.area.type,
        name: params.area.name,
        transaction_identifier: params.area.transaction_identifier || transactionIdentifier || undefined
      }
      const cleanFilters = { 
        ...filters,
        price: { min: 0, max: 0 }
      }
      const searchPayload = {
        details: roomDetails,
        area: areaWithCurrentBatch,
        checkindate: params.checkIn,
        checkoutdate: params.checkOut,
        page: 1,
        perPage: 50,
        currentHotelsCount: 0,
        transaction_identifier: params.area.transaction_identifier || transactionIdentifier || undefined,
        filters: cleanFilters
      }
      const token = localStorage.getItem('token')

      // Check if we should do parallel city search (for hotel or POI types)
      const shouldDoCitySearch = (params.hotelIds && params.hotelIds.length === 1) || 
                                params.area.type === 'hotel' || 
                                params.area.type === 'poi'

      console.log(`📤 Main search payload:`, JSON.stringify(searchPayload, null, 2))

      let citySearchPromise = null
      let extractedCity = ''

      if (shouldDoCitySearch) {
        console.log(`🔍 Type is ${params.area.type}, initiating parallel city search...`)
        
        // Extract city name (last word only)
        extractedCity = extractCityFromHotelName(params.area.name)
        console.log(`📍 Extracted city for parallel search: "${extractedCity}" from "${params.area.name}"`)
        
        if (extractedCity) {
          const cityPayload = {
            cityName: extractedCity, // Send only the last word
            checkindate: params.checkIn,
            checkoutdate: params.checkOut,
            details: roomDetails,
            page: 1,
            perPage: 50,
            currentHotelsCount: 0,
            transaction_identifier: params.area.transaction_identifier || transactionIdentifier || undefined,
            filters: cleanFilters
          }
          
          console.log(`🏙️ Starting parallel city search for: ${extractedCity}`)
          console.log(`📤 City search payload:`, JSON.stringify(cityPayload, null, 2))
          citySearchPromise = hotelApi.searchHotelsByCity(cityPayload, token || undefined)
        } else {
          console.log(`❌ Could not extract city name from: ${params.area.name}`)
        }
      }

      // Make both API calls in parallel
      const promises = [hotelApi.searchHotels(searchPayload, token || undefined)]
      if (citySearchPromise) {
        promises.push(citySearchPromise)
      }

      console.log(`🚀 Making ${promises.length} parallel API calls...`)
      const results = await Promise.allSettled(promises)
      
      // Process main search results
      const mainSearchResult = results[0]
      let mainHotels: Hotel[] = []
      let mainSuccess = false
      
      if (mainSearchResult.status === 'fulfilled' && mainSearchResult.value.success && mainSearchResult.value.data.hotels.length > 0) {
        console.log(`✅ Main search successful! Found ${mainSearchResult.value.data.hotels.length} hotels`)
        mainHotels = mainSearchResult.value.data.hotels.map(convertHotelDetailsToHotel)
        mainSuccess = true
        
        if (!isLoadMore && mainSearchResult.value.data.price) {
          setPriceRange({ min: mainSearchResult.value.data.price.minPrice, max: mainSearchResult.value.data.price.maxPrice })
          setFilters(prev => ({ ...prev, price: { min: mainSearchResult.value.data.price.minPrice, max: mainSearchResult.value.data.price.maxPrice } }))
        }
        if (mainSearchResult.value.data.transaction_identifier) {
          setTransactionIdentifier(mainSearchResult.value.data.transaction_identifier)
        }
      } else {
        console.log(`❌ Main search failed or no results`)
      }

      // Process city search results (if it was made)
      let cityHotels: Hotel[] = []
      let citySuccess = false
      
      if (citySearchPromise && results[1]) {
        const citySearchResult = results[1]
        if (citySearchResult.status === 'fulfilled' && citySearchResult.value.success && citySearchResult.value.data.hotels.length > 0) {
          console.log(`✅ City search successful! Found ${citySearchResult.value.data.hotels.length} hotels in ${extractedCity}`)
          cityHotels = citySearchResult.value.data.hotels.map(convertHotelDetailsToHotel)
          citySuccess = true
        } else {
          console.log(`❌ City search failed or no results for ${extractedCity}`)
        }
      }

      // Combine results based on priority
      let finalHotels: Hotel[] = []
      let usedCityFallback = false

      if (mainSuccess) {
        // If main search succeeded, use those results
        finalHotels = mainHotels
        console.log(`🎯 Using main search results (${finalHotels.length} hotels)`)
      } else if (citySuccess) {
        // If main search failed but city search succeeded, use city results
        finalHotels = cityHotels
        usedCityFallback = true
        console.log(`🎯 Using city search results (${finalHotels.length} hotels) - city fallback`)
        
        // Set city search data
        const citySearchResult = results[1]
        if (citySearchResult.status === 'fulfilled' && citySearchResult.value.data.price) {
          setPriceRange({ min: citySearchResult.value.data.price.minPrice, max: citySearchResult.value.data.price.maxPrice })
          setFilters(prev => ({ ...prev, price: { min: citySearchResult.value.data.price.minPrice, max: citySearchResult.value.data.price.maxPrice } }))
        }
        if (citySearchResult.status === 'fulfilled' && citySearchResult.value.data.transaction_identifier) {
          setTransactionIdentifier(citySearchResult.value.data.transaction_identifier)
        }
      }

      // Update state
      if (isLoadMore) {
        setHotels(prev => [...prev, ...finalHotels])
      } else {
        setHotels(finalHotels)
      }
      
      if (usedCityFallback) {
        setCityFallback({used: true, city: extractedCity})
        setTotalHotels(finalHotels.length)
      } else if (mainSuccess) {
        setTotalHotels(finalHotels.length)
      } else {
        setHotels([])
        setTotalHotels(0)
        setError(null)
      }

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Search failed'
      setError(errMsg)
      if (err instanceof Error && err.message.includes('401')) {
        console.error('Authentication required for hotel search')
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
      
      console.log('🚀 Initializing search with params:', {
        areaType: params.area.type,
        areaName: params.area.name,
        hotelIdsCount: params.hotelIds?.length || 0,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        rooms: params.rooms,
        adults: params.adults,
        children: params.children
      })
      
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
        console.log(`📍 Area type: ${params.area.type}, Area name: ${params.area.name}`)
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
  function getMinPrice(hotel: Hotel) {
    const prices = hotel.rates.packages.map(pkg => {
      if (pkg.chargeable_rate && pkg.chargeable_rate > 0) return pkg.chargeable_rate;
      if (pkg.chargeable_rate_with_tax_excluded && pkg.chargeable_rate_with_tax_excluded > 0) return pkg.chargeable_rate_with_tax_excluded;
      if (pkg.room_rate && pkg.room_rate > 0) return pkg.room_rate;
      if (pkg.base_amount && pkg.base_amount > 0) return pkg.base_amount;
      return 0;
    }).filter(price => price > 0)
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
        <SearchSummary totalHotels={totalHotels} cityFallback={cityFallback} />

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
            {/* Show 'No hotels found' message if no results and not loading */}
            {!loading && hotels.length === 0 && !error && (
              <div className="text-center text-gray-500 py-12">
                <h2 className="text-xl font-semibold mb-2">No hotels found</h2>
                <p>Try changing your search criteria or filters.</p>
              </div>
            )}

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

export default function HotelListingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading hotels...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <HotelListingPageContent />
    </Suspense>
  )
} 