const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3334';

// Interfaces for hotel data
export interface HotelPackage {
  hotel_id?: string;
  rate_type?: string;
  booking_key?: string;
  chargeable_rate_currency?: string;
  room_details?: {
    room_type?: string;
    description?: string;
    food?: string;
    non_refundable?: boolean;
    supplier_description?: string;
    room_code?: number;
    room_view?: string;
    rate_plan_code?: number;
    beds?: any;
  };
  room_rate_currency?: string;
  client_commission?: number;
  client_commission_currency?: string;
  room_rate?: number;
  taxes_and_fees?: {
    estimated_total?: {
      currency?: string;
      value?: number;
    };
  };
  indicative_market_rates?: Array<{
    market_rate_supplier?: string;
    market_rate?: number;
    market_rate_currency?: string;
  }>;
  chargeable_rate?: number;
  base_amount?: number;
  service_component?: number;
  gst?: number;
  chargeable_rate_with_tax_excluded?: number;
  markup_amount?: number;
  markup_details?: {
    id?: string;
    name?: string;
    type?: string;
    value?: number;
  };
  cancellation_policy?: string;
  meal_plan?: string;
  room_type?: string;
  description?: string;
  client_commission_percentage?: number;
  guest_discount_percentage?: number;
  guest_discount_with_tax_excluded_percentage?: number;
}

export interface HotelDetails {
  id: string;
  name: string;
  originalName?: string;
  starRating?: number;
  address?: string;
  city?: string;
  state?: string;
  location?: {
    address?: string;
    stateProvince?: string;
    country?: string;
    countryCode?: string;
    postalCode?: string;
    latLng?: {
      lat: string;
      lng: string;
    };
  };
  image?: string;
  imageDetails?: {
    images?: string[];
    count?: number;
  };
  amenities?: string[];
  moreDetails?: {
    checkInTime?: string;
    checkOutTime?: string;
    description?: string;
    phone?: string;
    email?: string;
  };
  rates: {
    packages: HotelPackage[];
  };
  hotelId?: string;
  policy?: string;
}

export interface SearchRequest {
  details: Array<{
    adult_count: number;
    child_count?: number;
    children?: Array<{
      age: number;
    }>;
  }>;
  area: {
    id: string;
    type: string;
    name: string;
  };
  checkindate: string;
  checkoutdate: string;
  page?: number;
  perPage?: number;
  currentHotelsCount?: number;
  transaction_identifier?: string;
  filters?: {
    roomType?: string[];
    foodType?: string[];
    refundable?: boolean[];
    starRating?: number[];
    price?: {
      min: number;
      max: number;
    };
  };
}

export interface SearchResponse {
  success: boolean;
  message: string;
  data: {
    search: any;
    region: any;
    hotels: HotelDetails[];
    price: {
      minPrice: number;
      maxPrice: number;
    };
    pagination: {
      currentHotelsCount: number;
      totalHotelsCount: number;
      totalPages: number;
      pollingStatus: string;
      page: number;
      perPage: number;
    };
    transaction_identifier?: string;
  };
}

export interface BookingPolicyRequest {
  transaction_id: string;
  search: {
    adult_count: number;
    check_in_date: string;
    check_out_date: string;
    child_count: number;
    currency?: string;
    hotel_id_list?: string[];
    locale?: string;
    room_count: number;
    source_market?: string;
  };
  bookingKey: string;
  hotelId: string;
}

export interface BookingPolicyResponse {
  data: {
    booking_policy_id: string;
    package: HotelPackage;
    event_id: string;
    statusToken: string;
    session_id: string;
    cancellation_policy: {
      cancellation_policies: Array<{
        penalty_percentage: number;
        date_to: string;
        date_from: string;
      }>;
      remarks: string;
    };
  };
  transaction_identifier: string;
  id: string;
  api: string;
  version: string;
}

export interface PrebookRequest {
  booking_policy_id: string;
  transaction_id: string;
  contactDetail: {
    name: string;
    last_name: string;
    email: string;
    mobile: string;
  };
  guest?: Array<{
    room_guest: Array<{
      firstname: string;
      lastname: string;
      mobile: string;
      nationality: string;
    }>;
  }>;
}

export interface PrebookResponse {
  data: {
    prebook: {
      prebook_id: string;
      status: string;
      booking_policy_id: string;
      transaction_identifier: string;
    };
    transaction_identifier: string;
  };
  transactionid?: string;
}

// Hotel API functions
export const hotelApi = {
  // Search hotels
  searchHotels: async (searchData: SearchRequest, token?: string): Promise<SearchResponse> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/hotels/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify(searchData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('401: Authentication required');
      }
      throw new Error(`Failed to search hotels: ${response.status}`);
    }

    return response.json();
  },

  // Get hotel packages
  searchPackages: async (requestData: {
    hotelId: string;
    checkindate: string;
    checkoutdate: string;
    details: Array<{
      adult_count: number;
      child_count?: number;
      children?: Array<{
        age: number;
      }>;
    }>;
    transaction_identifier?: string;
    referenceId?: string;
  }, token?: string): Promise<{
    data: {
      search: any;
      hotel: HotelDetails;
      currentPackagesCount?: number;
      totalPackagesCount?: number;
      page?: number;
      perPage?: number;
      totalPages?: number;
      status?: string;
      transaction_identifier?: string;
    };
  }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/hotels/packages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('401: Authentication required');
      }
      throw new Error(`Failed to get hotel packages: ${response.status}`);
    }

    return response.json();
  },

  // Get booking policy
  getBookingPolicy: async (requestData: BookingPolicyRequest, token?: string): Promise<BookingPolicyResponse> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/hotels/bookingpolicy`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('401: Authentication required');
      }
      throw new Error(`Failed to get booking policy: ${response.status}`);
    }

    return response.json();
  },

  // Prebook hotel
  prebookHotel: async (requestData: PrebookRequest, token?: string): Promise<PrebookResponse> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/hotels/prebook`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('401: Authentication required');
      }
      
      // Try to get error message from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to prebook hotel: ${response.status}`);
      } catch (parseError) {
        throw new Error(`Failed to prebook hotel: ${response.status}`);
      }
    }

    return response.json();
  },

  // Auto suggest
  suggest: async (requestData: {
    query: string;
    page?: number;
    perPage?: number;
    currentItemsCount?: number;
  }, token?: string): Promise<{
    data: any[];
    status: string;
    currentItemsCount: number;
    totalItemsCount: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/hotels/suggest`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('401: Authentication required');
      }
      throw new Error(`Failed to get suggestions: ${response.status}`);
    }

    return response.json();
  },
};

export default hotelApi;
