export interface HotelPackage {
  base_amount: number
  chargeable_rate: number
  markup_amount: number
  markup_details?: {
    id: string
    name: string
    type: string
    value: number
  }
  room_details?: {
    room_type: string
    food: string
    non_refundable: boolean
    description?: string
    supplier_description?: string
  }
  service_component?: number
  gst?: number
  room_rate?: number
  chargeable_rate_with_tax_excluded?: number
  taxes_and_fees?: {
    estimated_total: {
      currency: string
      value: number
    }
  }
}

export interface Hotel {
  _id?: string
  id: string
  hotelId?: string
  name: string
  originalName?: string
  starRating: number
  address?: string
  city: string
  state?: string
  stateProvince?: string
  country: string
  countryCode?: string
  image?: string
  imageDetails?: {
    images: string[]
    count: number
  }
  amenities: string[]
  rates: {
    packages: HotelPackage[]
  }
  description?: string
  location?: {
    latitude?: number
    longitude?: number
    latLng?: {
      lat: string
      lng: string
    }
    address?: string
    city?: string
    stateProvince?: string
    country?: string
    postalCode?: string
  }
  moreDetails?: {
    description?: string
    checkInTime?: string
    checkOutTime?: string
    phone?: string
    email?: string
    website?: string
  }
  policy?: string
  dailyRates?: {
    highest: number
    lowest: number
  }
}

export interface Filters {
  roomType: string[]
  foodType: string[]
  refundable: boolean[]
  starRating: number[]
  price: {
    min: number
    max: number
  }
}

export interface SearchResponse {
  success: boolean
  message: string
  data: {
    search: any
    region: any
    hotels: Hotel[]
    price?: {
      minPrice: number
      maxPrice: number
    }
    pagination?: {
      currentHotelsCount: number
      totalHotelsCount: number
      totalPages: number
      pollingStatus: string
      page: number
      perPage: number
    }
    transaction_identifier?: string
  }
} 