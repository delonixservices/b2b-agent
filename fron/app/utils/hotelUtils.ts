/**
 * Generate hotel listing URL with hotel IDs for pagination
 * @param searchParams - Current search parameters
 * @param hotelIds - Array of hotel IDs to search for
 * @returns URL string for hotel listing
 */
export const generateListingUrlWithHotelIds = (
  searchParams: {
    area: any;
    checkIn: string;
    checkOut: string;
    rooms: number;
    adults: number;
    children: number;
    childrenAges: number[];
  },
  hotelIds: string[]
): string => {
  const params = new URLSearchParams({
    area: encodeURIComponent(JSON.stringify(searchParams.area)),
    checkIn: searchParams.checkIn,
    checkOut: searchParams.checkOut,
    rooms: searchParams.rooms.toString(),
    adults: searchParams.adults.toString(),
    children: searchParams.children.toString(),
    childrenAges: encodeURIComponent(JSON.stringify(searchParams.childrenAges)),
    hotelIds: encodeURIComponent(JSON.stringify(hotelIds))
  });

  return `/hotels/listing?${params.toString()}`;
};

/**
 * Split hotel IDs into batches of 50 for pagination
 * @param hotelIds - Array of all hotel IDs
 * @param batchSize - Size of each batch (default: 50)
 * @returns Array of hotel ID batches
 */
export const splitHotelIdsIntoBatches = (hotelIds: string[], batchSize: number = 50): string[][] => {
  const batches: string[][] = [];
  for (let i = 0; i < hotelIds.length; i += batchSize) {
    batches.push(hotelIds.slice(i, i + batchSize));
  }
  return batches;
};

/**
 * Get hotel IDs for a specific page
 * @param allHotelIds - Array of all hotel IDs
 * @param page - Page number (1-based)
 * @param perPage - Number of hotels per page (default: 50)
 * @returns Array of hotel IDs for the specified page
 */
export const getHotelIdsForPage = (allHotelIds: string[], page: number, perPage: number = 50): string[] => {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  return allHotelIds.slice(startIndex, endIndex);
};

/**
 * Extract the last word from a city name
 * @param cityName - The full city name (e.g., "New Delhi", "Mumbai", "Bangalore")
 * @returns The last word of the city name (e.g., "Delhi", "Mumbai", "Bangalore")
 */
export const extractLastWordFromCityName = (cityName: string): string => {
  if (!cityName || typeof cityName !== 'string') {
    return cityName || '';
  }
  
  // Trim whitespace and split by spaces
  const trimmedName = cityName.trim();
  const words = trimmedName.split(/\s+/);
  
  // Return the last word
  return words[words.length - 1] || trimmedName;
};

/**
 * Test function to verify extractLastWordFromCityName works correctly
 * This function can be called to test various city name formats
 */
export const testExtractLastWordFromCityName = () => {
  const testCases = [
    { input: 'New Delhi', expected: 'Delhi' },
    { input: 'Mumbai', expected: 'Mumbai' },
    { input: 'Bangalore', expected: 'Bangalore' },
    { input: 'New York', expected: 'York' },
    { input: 'Los Angeles', expected: 'Angeles' },
    { input: 'San Francisco', expected: 'Francisco' },
    { input: '  New Delhi  ', expected: 'Delhi' },
    { input: '', expected: '' },
    { input: '   ', expected: '' },
    { input: 'Delhi', expected: 'Delhi' }
  ];

  console.log('Testing extractLastWordFromCityName function:');
  testCases.forEach(({ input, expected }) => {
    const result = extractLastWordFromCityName(input);
    const passed = result === expected;
    console.log(`${passed ? '✅' : '❌'} "${input}" -> "${result}" (expected: "${expected}")`);
  });
}; 