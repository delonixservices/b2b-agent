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