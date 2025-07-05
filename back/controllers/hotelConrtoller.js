const { getRedisClient } = require('../loaders/redis');
const Api = require('../utils/api');
const Markup = require('../models/markup');
const Hotel = require('../models/hotels');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { Employee } = require('../models/user');
const BookingPolicy = require('../models/booking');
const Transaction = require('../models/hoteltransactions');

const limitRegionIds = (regionIds, maxCount = 50) => {
    if (!regionIds || typeof regionIds !== 'string') {
      return regionIds;
    }
    
    const ids = regionIds.split(',');
    if (ids.length <= maxCount) {
      return regionIds;
    }
    
    const limitedIds = ids.slice(0, maxCount).join(',');
    console.log(`Region IDs limited from ${ids.length} to ${maxCount}: ${limitedIds.substring(0, 100)}...`);
    return limitedIds;
  };

// Timeout wrapper function
const withTimeout = (promise, timeoutMs, operationName) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
};

/**
 * Apply owner markup to a hotel package
 * @param {Object} hotelPackage - The hotel package to apply markup to
 * @returns {Object} - Updated hotel package with markup applied
 */
const applyOwnerMarkup = async (hotelPackage) => {
  try {
    // Get the active global markup
    const markup = await Markup.findOne({ isActive: true });
    
    if (!markup) {
      console.log('No active markup found, returning original package');
      return hotelPackage;
    }

    const baseAmount = hotelPackage.base_amount || 0;
    let markupAmount = 0;

    // Calculate markup based on type
    if (markup.type === 'percentage') {
      markupAmount = (baseAmount * markup.value) / 100;
    } else {
      markupAmount = markup.value;
    }

    // Apply markup to the package
    const updatedPackage = {
      ...hotelPackage,
      base_amount: baseAmount,
      markup_amount: markupAmount,
      markup_details: {
        id: markup._id,
        name: markup.name,
        type: markup.type,
        value: markup.value
      },
      chargeable_rate: baseAmount + markupAmount
    };

    // Update other price fields if they exist
    if (hotelPackage.service_component !== undefined) {
      updatedPackage.service_component = hotelPackage.service_component;
    }
    if (hotelPackage.gst !== undefined) {
      updatedPackage.gst = hotelPackage.gst;
    }

    return updatedPackage;
  } catch (error) {
    console.error('Error applying owner markup:', error);
    // Return original package if markup application fails
    return hotelPackage;
  }
};

/**
 * Validate search request parameters
 * @param {Object} req - Express request object
 * @returns {Object} - Validation result
 */
const validateSearchRequest = (req) => {
  const errors = [];
  const { details, area, checkindate, checkoutdate, page, perPage, currentHotelsCount } = req.body;

  // Validate required fields
  if (!details || !Array.isArray(details) || details.length === 0) {
    errors.push('Details array is required and must not be empty');
  }

  if (!area || !area.id || !area.type || !area.name) {
    errors.push('Valid area information is required');
  }

  if (!checkindate || !checkoutdate) {
    errors.push('Check-in and check-out dates are required');
  }

  // Validate dates
  if (checkindate && checkoutdate) {
    const checkIn = new Date(checkindate);
    const checkOut = new Date(checkoutdate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      errors.push('Check-in date cannot be in the past');
    }

    if (checkOut <= checkIn) {
      errors.push('Check-out date must be after check-in date');
    }
  }

  // Validate pagination
  const pageNum = parseInt(page) || 1;
  const perPageNum = parseInt(perPage) || 10;
  const currentCount = parseInt(currentHotelsCount) || 0;

  if (pageNum < 1) {
    errors.push('Page number must be at least 1');
  }

  if (perPageNum < 10 || perPageNum > 50) {
    errors.push('Per page must be between 10 and 50');
  }

  if (currentCount < 0) {
    errors.push('Current hotels count cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedData: {
      page: pageNum,
      perPage: perPageNum,
      currentHotelsCount: currentCount
    }
  };
};

/**
 * Process room details and calculate totals
 * @param {Array} details - Room details array
 * @returns {Object} - Processed room details and totals
 */
const processRoomDetails = (details) => {
  let totalAdult = 0;
  let totalChild = 0;
  const processedDetails = details.map((room, index) => {
    const adultCount = Number(room.adult_count) || 0;
    const childCount = Number(room.child_count) || 0;
    
    totalAdult += adultCount;
    if (childCount > 0) {
      totalChild += childCount;
    }

    const processedRoom = {
      ...room,
      adult_count: adultCount
    };

    // Only include child-related fields if there are children
    if (childCount > 0) {
      processedRoom.child_count = childCount;
      processedRoom.children = room.children || [];
    } else {
      delete processedRoom.child_count;
      delete processedRoom.children;
    }

    return processedRoom;
  });

  return {
    details: processedDetails,
    totalAdult,
    totalChild,
    totalRooms: details.length
  };
};

/**
 * Get cached search data or fetch from API
 * @param {Object} searchObj - Search object
 * @param {Object} client - Redis client
 * @returns {Object} - Search data
 */
const getSearchData = async (searchObj, client) => {
  try {
    // Try to get cached data
    if (client && client.isOpen) {
      const redisKey = JSON.stringify(searchObj.search);
      const cachedData = await withTimeout(
        client.get(`hotels_search:${redisKey}`),
        5000,
        'Redis cache retrieval'
      );

      if (cachedData) {
        console.log('Serving from Redis cache');
        return JSON.parse(cachedData);
      }
    }

    // Fetch from API
    console.log('Fetching from external API');
    const data = await withTimeout(
      Api.post("/search", searchObj),
      30000, // 30 second timeout
      'External API call'
    );

    // Cache the response if valid
    if (data && data.data && data.data.totalHotelsCount >= 1 && client && client.isOpen) {
      try {
        const redisKey = JSON.stringify(searchObj.search);
        await withTimeout(
          client.setEx(`hotels_search:${redisKey}`, 300, JSON.stringify(data)), // 5 minutes cache
          5000,
          'Redis cache set'
        );
        console.log('Data cached successfully');
      } catch (cacheError) {
        console.log('Failed to cache data:', cacheError);
      }
    }

    return data;
  } catch (error) {
    console.error('Error getting search data:', error);
    throw error;
  }
};

/**
 * Apply filters to hotels
 * @param {Array} hotels - Hotels array
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered hotels
 */
const applyFilters = (hotels, filters) => {
  if (!filters || Object.keys(filters).length === 0) {
    return hotels;
  }

  return hotels.filter(hotel => {
    // Room type filter
    if (filters.roomType && filters.roomType.length > 0) {
      const hasMatchingRoomType = hotel.rates.packages.some(pkg => 
        filters.roomType.includes(pkg.room_details?.room_type)
      );
      if (!hasMatchingRoomType) return false;
    }

    // Food type filter
    if (filters.foodType && filters.foodType.length > 0) {
      const hasMatchingFoodType = hotel.rates.packages.some(pkg => 
        filters.foodType.includes(pkg.room_details?.food)
      );
      if (!hasMatchingFoodType) return false;
    }

    // Refundable filter
    if (filters.refundable && filters.refundable.length > 0) {
      const hasMatchingRefundable = hotel.rates.packages.some(pkg => {
        const isNonRefundable = pkg.room_details?.non_refundable ?? true;
        return filters.refundable.includes(!isNonRefundable);
      });
      if (!hasMatchingRefundable) return false;
    }

    // Star rating filter
    if (filters.starRating && filters.starRating.length > 0) {
      const hotelStarRating = hotel.starRating || 0;
      if (!filters.starRating.includes(hotelStarRating)) return false;
    }

    // Price filter
    if (filters.price && filters.price.min >= 0 && filters.price.max > 0) {
      const hasMatchingPrice = hotel.rates.packages.some(pkg => 
        pkg.base_amount >= filters.price.min && pkg.base_amount <= filters.price.max
      );
      if (!hasMatchingPrice) return false;
    }

    return true;
  });
};

/**
 * Calculate pagination information
 * @param {number} totalItems - Total number of items
 * @param {number} page - Current page
 * @param {number} perPage - Items per page
 * @param {number} currentCount - Current items count
 * @returns {Object} - Pagination information
 */
const calculatePagination = (totalItems, page, perPage, currentCount) => {
  const totalPages = Math.ceil(totalItems / perPage);
  const nextItemsCount = Math.min(page * perPage, totalItems);
  const pollingStatus = page >= totalPages ? "complete" : "in-progress";

  return {
    currentItemsCount: nextItemsCount,
    totalItemsCount: totalItems,
    totalPages,
    pollingStatus,
    page,
    perPage
  };
};

exports.suggest = async (req, res, next) => {
  console.log('=== SUGGEST FUNCTION START ===');
  console.log('Request from:', req.user.type, 'ID:', req.user.id);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  const startTime = Date.now();

  let client;
  try {
    console.log('Attempting Redis connection...');
    client = await withTimeout(getRedisClient(), 10000, 'Redis connection');
    console.log('Redis connection successful:', client ? 'Yes' : 'No');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    // Continue without Redis cache if connection fails
  }

  // const term = Object.values(req.query).join('');

  const term = req.body.query;
  let page = +req.body.page;
  let perPage = +req.body.perPage;
  let currentItemsCount = +req.body.currentItemsCount;

  console.log('Parsed parameters:', {
    term,
    page,
    perPage,
    currentItemsCount,
    termLength: term ? term.length : 0
  });

  if (!page || page < 1) {
    page = 1;
  }

  // minimum items allowed = 10
  if (!perPage || perPage < 10) {
    perPage = 10;
  }

  // maximum items allowed at one time = 50
  if (perPage > 50) {
    console.log('PerPage validation failed:', perPage);
    return res.status(400).json({
      'message': 'perPage should not be greater than 50'
    })
  }

  if (!currentItemsCount || currentItemsCount < 0) {
    currentItemsCount = 0;
  }

  const defaultResponse = {
    'data': [],
    'status': 'complete',
    'currentItemsCount': 0,
    'totalItemsCount': 0,
    'page': page,
    'perPage': perPage,
    'totalPages': 0,
  };

  // dont allow empty strings and string length less than three
  if (!term || term.length < 3) {
    console.log('Term validation failed - returning default response');
    return res.json(defaultResponse);
  }

  let responseData = [];

  try {
    console.log('Starting data retrieval process...');
    
    let cachedData;
    if (client && client.isOpen) {
      try {
        console.log('Attempting to get cached data for term:', term);
        const cacheStartTime = Date.now();
        cachedData = await withTimeout(
          client.get(`autosuggest:${term}`), 
          5000, 
          'Redis cache retrieval'
        );
        console.log('Cache retrieval time:', Date.now() - cacheStartTime, 'ms');
        console.log('Cached data found:', cachedData ? 'Yes' : 'No');
      } catch (err) {
        console.log('Redis get error:', err);
      }
    } else {
      console.log('Redis client not available or not open');
    }

    let parsedData = null;
    if (cachedData) {
      try {
        console.log('Parsing cached data...');
        parsedData = JSON.parse(cachedData);
        console.log('Cached data parsed successfully, length:', parsedData ? parsedData.length : 0);
      } catch (parseErr) {
        console.log('Redis data parse error:', parseErr);
        // If cached data is corrupted, delete it
        if (client && client.isOpen) {
          try {
            await withTimeout(client.del(`autosuggest:${term}`), 5000, 'Redis cache deletion');
            console.log('Deleted corrupted cache data');
          } catch (delErr) {
            console.log('Cannot delete corrupted cache:', delErr);
          }
        }
      }
    }

    if (Array.isArray(parsedData)) {
      console.log('Using cached data, items count:', parsedData.length);
      responseData = parsedData;
    } else {
      console.log('No valid cached data, making external API call...');
      console.log('API request payload:', JSON.stringify({
        "autosuggest": {
          "query": term,
          "locale": "en-US"
        }
      }, null, 2));
      
      const apiStartTime = Date.now();
      console.log('Making API call to /autosuggest at:', new Date().toISOString());
      
      const data = await withTimeout(
        Api.post("/autosuggest", {
          "autosuggest": {
            "query": term,
            "locale": "en-US"
          }
        }),
        100000, // 25 second timeout for API call
        'External API call'
      );
      
      const apiEndTime = Date.now();
      console.log('API call completed in:', apiEndTime - apiStartTime, 'ms');
      console.log('API response received at:', new Date().toISOString());
      console.log('API response structure:', Object.keys(data || {}));

      if (data && data.data) {
        console.log('Processing API response data...');
        console.log('Available data types:', Object.keys(data.data));
        
        // list of cities auto suggest
        if (data.data.city) {
          console.log('Processing city data, results count:', data.data.city.results ? data.data.city.results.length : 0);
          data.data.city.results.map((item, _index) => {
            item.transaction_identifier = data.transaction_identifier;
            item.displayName = `${item.name} | (${item.hotelCount})`;
            // Limit region IDs to maximum 50 to avoid Spring Boot backend issues
            item.id = limitRegionIds(item.id, 50);
            responseData.push(item);
          })
        }

        // list of hotels auto suggest
        if (data.data.hotel) {
          console.log('Processing hotel data, results count:', data.data.hotel.results ? data.data.hotel.results.length : 0);
          data.data.hotel.results.map((item, _index) => {
            // console.log(item);
            item.transaction_identifier = data.data.transaction_identifier;
            item.displayName = `${item.name}`;
            responseData.push(item);
          })
        }

        // list of poi auto suggest
        if (data.data.poi) {
          console.log('Processing POI data, results count:', data.data.poi.results ? data.data.poi.results.length : 0);
          data.data.poi.results.map((item, _index) => {
            item.transaction_identifier = data.data.transaction_identifier;
            item.displayName = `${item.name} | (${item.hotelCount})`;
            responseData.push(item);
          })
        }

        console.log('Total processed items:', responseData.length);

        // cache the response data
        if (responseData && responseData.length > 0 && client && client.isOpen) {
          try {
            console.log('Caching response data...');
            const cacheSetStartTime = Date.now();
            // cache will expire in 2 hrs i.e. 2 * 60 * 60 = 7200 seconds
            await withTimeout(
              client.setEx(`autosuggest:${term}`, 7200, JSON.stringify(responseData)),
              5000,
              'Redis cache set'
            );
            console.log('Cache set completed in:', Date.now() - cacheSetStartTime, 'ms');
          } catch (err) {
            console.log('redis set error: ', err);
          }
        } else {
          console.log('Skipping cache - conditions not met:', {
            hasResponseData: responseData && responseData.length > 0,
            hasClient: !!client,
            isOpen: client ? client.isOpen : false
          });
        }
      } else {
        console.log('No data or data.data in API response');
      }
    }
    
    console.log('Data processing completed, total items:', responseData.length);

  } catch (err) {
    console.error('=== ERROR IN SUGGEST FUNCTION ===');
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      response: err.response ? {
        status: err.response.status,
        statusText: err.response.statusText,
        data: err.response.data
      } : null
    });

    // delete redis cache
    if (client && client.isOpen) {
      try {
        await withTimeout(client.del(`autosuggest:${term}`), 5000, 'Redis cache deletion on error');
        console.log("Deleted cache on error successfully!")
      } catch (delErr) {
        console.log("Cannot delete cache:", delErr)
      }
    }

    return next(err);
  }

  console.log('Calculating pagination...');
  const nextItemsCount = page * perPage > responseData.length ? responseData.length : page * perPage;

  const paginaionObj = {
    'currentItemsCount': nextItemsCount,
    'totalItemsCount': responseData.length,
    'totalPages': Math.ceil(responseData.length / perPage),
    'pollingStatus': '',
  }

  let pollingStatus;

  if (page > paginaionObj.totalPages) {
    console.log('Page exceeds total pages, returning default response');
    console.log('page: ' + page);
    console.log(paginaionObj);
    return res.json(defaultResponse);
  }

  if (page === paginaionObj.totalPages) {
    pollingStatus = "complete";
  } else {
    pollingStatus = "in-progress";
  }

  paginaionObj.pollingStatus = pollingStatus;

  let lowerBound = currentItemsCount;
  let upperBound = lowerBound + perPage;

  // upperBound should not be greated than totalItems + 1
  if (upperBound > paginaionObj.totalItemsCount + 1) {
    upperBound = paginaionObj.totalItemsCount + 1;
  }

  console.log('Pagination details:', {
    paginaionObj,
    page,
    perPage,
    lowerBound,
    upperBound
  });

  // select only requested no of items in current iteration
  const selectedItems = responseData.slice(lowerBound, upperBound);
  console.log('Selected items count:', selectedItems.length);

  const response = {
    'data': selectedItems,
    'status': paginaionObj.pollingStatus,
    'currentItemsCount': paginaionObj.currentItemsCount,
    'totalItemsCount': paginaionObj.totalItemsCount,
    'page': page,
    'perPage': perPage,
    'totalPages': paginaionObj.totalPages,
  }

  const totalTime = Date.now() - startTime;
  console.log('=== SUGGEST FUNCTION COMPLETED ===');
  console.log('Total execution time:', totalTime, 'ms');
  console.log('Response data length:', selectedItems.length);
  console.log('Final response status:', paginaionObj.pollingStatus);

  res.json(response);
}

exports.searchHotels = async (req, res, next) => {
  console.log('=== SEARCH HOTELS FUNCTION START ===');
  console.log('Request from:', req.user.type, 'ID:', req.user.id);
  const startTime = Date.now();

  try {
    // Validate request parameters
    const validation = validateSearchRequest(req);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    const { page, perPage, currentHotelsCount } = validation.validatedData;
    const { details, area, checkindate, checkoutdate, transaction_identifier, filters = {} } = req.body;

    console.log('Validated parameters:', { page, perPage, currentHotelsCount });

    // Process room details
    const roomInfo = processRoomDetails(details);
    console.log('Room details processed:', roomInfo);

    // Limit region IDs to maximum 50 to avoid Spring Boot backend issues
    const limitedAreaId = limitRegionIds(area.id, 50);

    // Build search object
    const searchObj = {
      search: {
        source_market: "IN",
        type: area.type,
        id: limitedAreaId,
        name: area.name,
        check_in_date: checkindate,
        check_out_date: checkoutdate,
        total_adult_count: roomInfo.totalAdult.toString(),
        total_child_count: roomInfo.totalChild.toString(),
        total_room_count: roomInfo.totalRooms.toString(),
        details: roomInfo.details
      }
    };

    if (transaction_identifier && transaction_identifier !== "undefined") {
      searchObj.search.transaction_identifier = transaction_identifier;
    }

    console.log('Search object:', JSON.stringify(searchObj, null, 2));

    // Get Redis client
    let client;
    try {
      client = await withTimeout(getRedisClient(), 10000, 'Redis connection');
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
      // Continue without Redis cache if connection fails
    }

    // Get search data (cached or from API)
    let data;
    try {
      data = await getSearchData(searchObj, client);
    } catch (err) {
      console.error('Error fetching search data:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch hotel data'
      });
    }

    // Validate API response
    if (!data || !data.data) {
      console.log('No data received from API:', data);
      return res.status(404).json({
        success: false,
        message: 'No hotels found'
      });
    }

    if (!data.data.hotels || data.data.hotels.length === 0) {
      console.log('No hotels in API response');
      return res.status(404).json({
        success: false,
        message: 'No hotels found for the given criteria'
      });
    }

    // Process hotels with pagination
    const hotelsList = [...data.data.hotels];
    console.log(`Total hotels received: ${hotelsList.length}`);

    // Calculate pagination
    const pagination = calculatePagination(hotelsList.length, page, perPage, currentHotelsCount);
    
    if (page > pagination.totalPages) {
      return res.status(422).json({
        success: false,
        message: 'Invalid page number'
      });
    }

    // Select hotels for current page
    const lowerBound = currentHotelsCount;
    const upperBound = Math.min(lowerBound + perPage, hotelsList.length);
    const selectedHotels = hotelsList.slice(lowerBound, upperBound);

    console.log(`Processing ${selectedHotels.length} hotels for page ${page}`);

    // Process hotels with markup
    let processedHotels = [];
    let minPrice = Infinity;
    let maxPrice = 0;

    try {
      // Process each hotel with markup (skip database insertion)
      const hotelPromises = selectedHotels.map(async (hotel) => {
        try {
          hotel.hotelId = hotel._id;
          
          // Process all packages for the hotel
          const processedPackages = [];
          let hotelMinPrice = Infinity;
          let hotelMaxPrice = 0;

          for (const hotelPackage of hotel.rates.packages) {
            if (!hotelPackage) {
              console.log(`Skipping invalid package for hotel ${hotel.name}`);
              continue;
            }

            try {
              // Apply owner markup to package
              const updatedPackage = await applyOwnerMarkup(hotelPackage);
              processedPackages.push(updatedPackage);
              
              // Update hotel price range
              const packagePrice = updatedPackage.chargeable_rate || updatedPackage.base_amount || 0;
              if (packagePrice < hotelMinPrice) {
                hotelMinPrice = packagePrice;
              }
              if (packagePrice > hotelMaxPrice) {
                hotelMaxPrice = packagePrice;
              }
            } catch (err) {
              console.log(`Error applying markup to package in hotel ${hotel.name}:`, err);
              // Include package without markup if markup fails
              processedPackages.push(hotelPackage);
            }
          }

          // Update hotel packages
          hotel.rates.packages = processedPackages.length > 0 ? processedPackages : [{
            base_amount: 0,
            service_component: 0,
            gst: 0,
            chargeable_rate: 0
          }];

          // Update global price range
          if (hotelMinPrice < minPrice) {
            minPrice = hotelMinPrice;
          }
          if (hotelMaxPrice > maxPrice) {
            maxPrice = hotelMaxPrice;
          }

          return hotel;
        } catch (err) {
          console.error(`Error processing hotel ${hotel.name}:`, err);
          return null;
        }
      });

      const processedResults = await Promise.all(hotelPromises);
      processedHotels = processedResults.filter(hotel => hotel !== null);

    } catch (err) {
      console.error('Error processing hotels:', err);
      return res.status(500).json({
        success: false,
        message: 'Error processing hotel data'
      });
    }

    // Apply filters
    const filteredHotels = applyFilters(processedHotels, filters);
    console.log(`Hotels after filtering: ${filteredHotels.length}`);

    // Update pagination for filtered results
    const actualHotelsCount = filteredHotels.length;
    const actualCurrentHotelsCount = currentHotelsCount + actualHotelsCount;
    
    const finalPagination = {
      currentHotelsCount: actualCurrentHotelsCount,
      totalHotelsCount: hotelsList.length, // Keep original total for pagination
      totalPages: Math.ceil(hotelsList.length / perPage),
      pollingStatus: pagination.pollingStatus,
      page,
      perPage
    };

    // Prepare response
    const response = {
      success: true,
      message: 'Hotels retrieved successfully',
      data: {
        search: data.data.search,
        region: data.data.region,
        hotels: filteredHotels,
        price: {
          minPrice: Math.floor(minPrice === Infinity ? 0 : minPrice),
          maxPrice: Math.ceil(maxPrice === 0 ? 1 : maxPrice)
        },
        pagination: finalPagination,
        transaction_identifier: data.transaction_identifier
      }
    };

    const totalTime = Date.now() - startTime;
    console.log('=== SEARCH HOTELS FUNCTION COMPLETED ===');
    console.log(`Total execution time: ${totalTime}ms`);
    console.log(`Hotels returned: ${filteredHotels.length}`);

    res.json(response);

  } catch (error) {
    console.error('=== ERROR IN SEARCH HOTELS FUNCTION ===');
    console.error('Error details:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.searchPackages = async (req, res, next) => {
  console.log('Request from:', req.user.type, 'ID:', req.user.id);

const checkInDate = req.body.checkindate;
const checkOutDate = req.body.checkoutdate;
// const area = req.body.area;
const details = req.body.details;
const hotelId = req.body.hotelId;

// also allow req if there is no transaction identifier
const transaction_identifier = req.body.transaction_identifier;

const referenceId = req.body.referenceId;

if (!hotelId || !checkInDate || !checkOutDate || !details) {
return res.status(400).json({
'message': 'validation failed!'
})
}

// Try to find hotel in database first
let hotel = await Hotel.findOne({ id: hotelId });

// If hotel doesn't exist in database, we'll create a minimal hotel object for the API call
if (!hotel) {
console.log(`Hotel with id ${hotelId} not found in database, will use external API directly`);
hotel = {
id: hotelId,
name: `Hotel ${hotelId}` // Use hotel ID as fallback name
};
} else {
console.log(`Found hotel in database: ${hotel.name} (ID: ${hotel.id})`);
}

let total_adult = 0;
let total_child = 0;
let i = 0;
for (let room of details) {
total_adult = total_adult + Number(room.adult_count);
if (Number(room.child_count) > 0) {
total_child = total_child + Number(room.child_count);
} else {
delete details[i].child_count;
delete details[i].children;
}
i = i + 1;
}

// console.log(checkInDate, checkOutDate, total_adult, total_child, area.id, area.type, area.name);

const searchObj = {
"source_market": "IN",
"type": "hotel",
"id": hotel.id,
"name": hotel.name || `Hotel ${hotel.id}`,
"check_in_date": checkInDate,
"check_out_date": checkOutDate,
"total_adult_count": total_adult.toString(),
"total_child_count": total_child.toString(),
"total_room_count": details.length.toString(),
"details": details
}

if (transaction_identifier && transaction_identifier != "undefined") {
searchObj.transaction_identifier = transaction_identifier;
}

console.log('Hotel object:', hotel);
console.log('Search object name field:', searchObj.name);

let data;
try {
data = await Api.post("/search", {
'search': searchObj
});
} catch (err) {
return next(err);
}

console.log('Search object:', searchObj);
console.log('API response:', JSON.stringify(data, null, 2));

if (!data || !data.data) {
console.log('No data in API response');
console.log('Search object:', searchObj);
console.log('API response:', data);
return res.status(404).json({
'message': 'Hotel not Found'
});
}

if (!data.data.hotels || !Array.isArray(data.data.hotels) || data.data.hotels.length === 0) {
console.log('No hotels in API response');
console.log('API response data:', data.data);
return res.status(404).json({
'message': 'No hotels found in API response'
});
}

console.log('Hotels found:', data.data.hotels.length);
console.log('First hotel packages:', data.data.hotels[0].rates?.packages?.length || 0);

// If user is directly searching hotel
if (data.data && data.data.totalPackagesCount < 1) {
console.log(`Error: Searched hotel cannot be found`);
console.log(data);
return res.status(404).json({
'message': "Hotel cannot be found"
});
}

// console.log(data.data.hotels[0].rates.packages);

// hotel which will be sent to the client
// making deep copy of an object
let selectedHotel = JSON.parse(JSON.stringify(data.data.hotels[0]));

const promiseArray = selectedHotel.rates.packages.map(async (pkg) => {
// console.log(pkg.booking_key);
// console.log(pkg.chargeable_rate);
try {
// addMarkup method will apply markup and other charges on hotelPackage
const updatedPackage = await applyOwnerMarkup(pkg);
Object.assign(pkg, updatedPackage);
} catch (err) {
return res.status(500).json({
'message': `${err}`
})
}
return pkg;
});

const hotelPackages = await Promise.all(promiseArray);

// update hotel packages with updated rates
selectedHotel.rates.packages = hotelPackages;
// console.log(selectedHotel.rates.packages[0]);
// console.log(data.data.hotels[0].rates.packages)
// add hotel to the db

try {
// Update or create hotel in database
await Hotel.findOneAndUpdate({ id: hotelId }, {
'$set': {
'rates.packages': data.data.hotels[0].rates.packages
}
}, {
new: true,
upsert: true,
setDefaultsOnInsert: true
});
} catch (err) {
console.log('Error updating hotel in database:', err);
// Don't fail the request if database update fails
}

const dataObj = {
'data': {
'search': data.data.search,
// 'hotel': data.data.hotels[0],
// 'hotel': hotelObj,
'hotel': selectedHotel,
'currentPackagesCount:': data.data.currentPackagesCount,
'totalPackagesCount:': data.data.totalPackagesCount,
'page': data.data.page,
'perPage': data.data.perPage,
'totalPages': data.data.totalPages,
'status': data.data.status,
'transaction_identifier': data.transaction_identifier
}
}
dataObj.data.hotel.hotelId = hotel.id;
// console.log(dataObj);

res.json(dataObj);
};

exports.bookingpolicy = async (req, res, next) => {
  console.log('Request from:', req.user.type, 'ID:', req.user.id);
  
  const transaction_id = req.body.transaction_id;
  const search = req.body.search;
  const bookingKey = req.body.bookingKey;
  const hotelId = req.body.hotelId;
  
  if (!search || !bookingKey || !hotelId) {
    return res.status(400).send("Validation failed...");
  }
  
  if (!transaction_id) {
    console.error('transaction_identifier is required in bookingPolicy... ');
    return res.status(400).send("Validation failed... transaction_id is required..");
  }
  
  let data;
  let hotel;
  
  try {
    hotel = await Hotel.findOne({ id: hotelId });
    if (!hotel) {
      console.error('Hotel not found with id:', hotelId);
      return res.status(404).json({
        'message': 'Hotel not found'
      });
    }
    let package = hotel.rates.packages.filter((package) => package.booking_key === bookingKey)[0];
    
    // Add logging to check hotel and package data
    console.log('Hotel and Package Data:', {
      hotelId,
      bookingKey,
      hotelFound: !!hotel,
      packageFound: !!package,
      totalPackages: hotel?.rates?.packages?.length
    });

    if (!package) {
      console.error('Package not found:', {
        hotelId,
        bookingKey,
        availableBookingKeys: hotel?.rates?.packages?.map(p => p.booking_key)
      });
      return res.status(404).json({
        'message': 'Package not found for the given booking key'
      });
    }

    // Get the actual package data from _doc
    const packageData = package._doc || package;

    // Remove _id field from package object
    if (packageData) {
      const { _id, ...packageWithoutId } = packageData;
      package = packageWithoutId;
    } else {
      console.error('Invalid package data structure');
      return res.status(500).json({
        'message': 'Invalid package data structure'
      });
    }
    
    // Format package object with exact structure
    const formattedPackage = {
      booking_key: package.booking_key,
      chargeable_rate: package.chargeable_rate,
      chargeable_rate_currency: package.chargeable_rate_currency || "INR",
      chargeable_rate_with_tax_excluded: package.chargeable_rate_with_tax_excluded || 0,
      client_commission: package.client_commission,
      client_commission_currency: package.client_commission_currency || "INR",
      client_commission_percentage: package.client_commission_percentage || 0,
      guest_discount_with_tax_excluded_percentage: package.guest_discount_with_tax_excluded_percentage || 0,
      hotel_id: package.hotel_id || hotel.id,
      indicative_market_rates: package.indicative_market_rates || [],
      rate_type: package.rate_type || "net",
      room_details: {
        beds: package.room_details?.beds || { queen: 1 },
        description: package.room_details?.description || "Standard Room",
        food: package.room_details?.food || 1,
        non_refundable: package.room_details?.non_refundable || false,
        rate_plan_code: package.room_details?.rate_plan_code || "",
        room_code: package.room_details?.room_code || "",
        room_type: package.room_details?.room_type || "Standard",
        room_view: package.room_details?.room_view || "",
        supplier_description: package.room_details?.supplier_description || "Standard Room"
      },
      room_rate: package.room_rate,
      room_rate_currency: package.room_rate_currency || "INR"
    };

    // Log the package data for debugging
    console.log('Package Data:', {
      originalPackage: packageData,
      formattedPackage: formattedPackage,
      missingFields: {
        chargeable_rate: !package.chargeable_rate,
        client_commission: !package.client_commission,
        room_rate: !package.room_rate
      }
    });

    // Format search object
    const formattedSearch = {
      adult_count: search.adult_count,
      check_in_date: search.check_in_date,
      check_out_date: search.check_out_date,
      child_count: search.child_count,
      currency: search.currency || "INR",
      hotel_id_list: [hotel.id], // Use hotel.id instead of search.hotel_id_list
      locale: search.locale || "en-US",
      room_count: search.room_count,
      source_market: search.source_market || "IN"
    };

    // Create final payload
    const payload = {
      bookingpolicy: {
        package: formattedPackage,
        search: formattedSearch,
        transaction_identifier: transaction_id
      }
    };

    // Log the bookingpolicy request data
    console.log('BookingPolicy Request Data:', payload);
    
    try {
      data = await Api.post("/bookingpolicy", payload);
      console.log('BookingPolicy API Response:', {
        status: 'success',
        hasData: !!data,
        hasResponseData: !!data?.data
      });
    } catch (apiError) {
      console.error('BookingPolicy API Error:', {
        error: apiError.message,
        response: apiError.response?.data,
        status: apiError.response?.status
      });
      throw new Error(`Booking policy API error: ${apiError.message}`);
    }

    if (!data || !data.data) {
      console.error('Invalid API Response:', {
        data: data,
        hasData: !!data,
        hasResponseData: !!data?.data
      });
      return res.status(500).send("Unable to get the booking policy - Invalid API response");
    }
    
    // bookingPolicy = refrence of data.data
    const bookingPolicy = data.data;
    const hotelPackage = bookingPolicy.package;
    
    try {
      // addMarkup method will apply markup and other charges on hotelPackage
      await applyOwnerMarkup(hotelPackage);
    } catch (err) {
      return res.status(500).json({
        'message': `${err}`
      })
    }
    
    const booking_policy_id = bookingPolicy.booking_policy_id || `bp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const booking_policy = await new BookingPolicy({
      'booking_policy': bookingPolicy,
      'search': search,
      'transaction_identifier': transaction_id,
      "hotel": hotel._id,
      'booking_policy_id': booking_policy_id,
      'event_id': bookingPolicy.event_id || "",
      'statusToken': bookingPolicy.statusToken || "",
      'session_id': bookingPolicy.session_id || "",
      // Store user information
      'userType': req.user.type,
      'companyId': req.user.type === 'company' ? req.user.id : null,
      'employeeId': req.user.type === 'employee' ? req.user.id : null
    });
    
    await booking_policy.save();
    
    // Format the response to match the desired structure
    const formattedResponse = {
      data: {
        booking_policy_id: booking_policy_id,
        package: {
          ...hotelPackage,
          // Ensure all required fields are present
          rate_type: hotelPackage.rate_type || "Dynamic",
          booking_key: hotelPackage.booking_key || bookingKey,
          chargeable_rate_currency: hotelPackage.chargeable_rate_currency || "INR",
          hotel_id: hotelPackage.hotel_id || hotel.id,
          room_details: {
            supplier_description: hotelPackage.room_details?.supplier_description || "Standard",
            room_code: hotelPackage.room_details?.room_code || 1,
            room_view: hotelPackage.room_details?.room_view || "",
            description: hotelPackage.room_details?.description || "Classic",
            rate_plan_code: hotelPackage.room_details?.rate_plan_code || 0,
            non_refundable: hotelPackage.room_details?.non_refundable || false,
            beds: hotelPackage.room_details?.beds || {},
            food: hotelPackage.room_details?.food || "",
            room_type: hotelPackage.room_details?.room_type || "Classic"
          },
          room_rate_currency: hotelPackage.room_rate_currency || "INR",
          client_commission: hotelPackage.client_commission || 0,
          client_commission_currency: hotelPackage.client_commission_currency || "INR",
          room_rate: hotelPackage.room_rate || 0,
          taxes_and_fees: hotelPackage.taxes_and_fees || {
            estimated_total: {
              value: 0
            }
          },
          indicative_market_rates: hotelPackage.indicative_market_rates || [],
          chargeable_rate: hotelPackage.chargeable_rate || 0,
          base_amount: hotelPackage.base_amount || 0,
          service_component: hotelPackage.service_component || 0,
          gst: hotelPackage.gst || 0
        },
        event_id: booking_policy.event_id || "",
        statusToken: booking_policy.statusToken || "",
        session_id: booking_policy.session_id || "",
        cancellation_policy: bookingPolicy.cancellation_policy || {
          cancellation_policies: [
            {
              penalty_percentage: 0,
              date_to: "",
              date_from: ""
            }
          ],
          remarks: "Standard cancellation policy applies. Please check with the hotel for specific terms."
        }
      },
      transaction_identifier: transaction_id,
      id: booking_policy_id,
      api: "post::bookingpolicy",
      version: "v1"
    };
    
    res.json(formattedResponse);
  } catch (err) {
    console.error('BookingPolicy Error:', {
      error: err.message,
      stack: err.stack
    });
    return res.status(500).json({
      'message': err.message
    });
  }
};

exports.prebook = async (req, res, next) => {
  const booking_policy_id = req.body.booking_policy_id;
  const transaction_id = req.body.transaction_id;
  const contactDetail = req.body.contactDetail;
  const guests = req.body.guest;
  
  console.log('Prebook request from:', req.user.type, 'ID:', req.user.id);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  if (!booking_policy_id || !transaction_id || !contactDetail) {
    return res.status(400).json({
      'message': 'Booking cannot be completed! Please try again. booking_policy_id, transaction_id and contactDetail required..'
    });
  }
  
  // Validate booking policy ID format
  if (typeof booking_policy_id !== 'string' || booking_policy_id.trim() === '') {
    return res.status(400).json({
      'message': 'Invalid booking policy ID format'
    });
  }
  
  // Validate contact detail fields
  if (!contactDetail.name || !contactDetail.last_name || !contactDetail.email || !contactDetail.mobile) {
    return res.status(400).json({
      'message': 'All contact details (name, last_name, email, mobile) are required.'
    });
  }
  
  contactDetail.mobile = contactDetail.mobile.toString();
  
  // User is already authenticated via middleware
  // req.user contains the authenticated user information
  const { type: userType, id: userId } = req.user;
  
  console.log('Authenticated user:', { userType, userId });
  
  const bookingPolicy = await BookingPolicy.findOne({
    'booking_policy.booking_policy_id': booking_policy_id,
    'transaction_identifier': transaction_id
  }).populate('hotel');
  
  console.log('Found booking policy:', {
    found: !!bookingPolicy,
    booking_policy_id,
    transaction_identifier: transaction_id,
    has_booking_policy: !!bookingPolicy?.booking_policy,
    has_package: !!bookingPolicy?.booking_policy?.package,
    hotel_found: !!bookingPolicy?.hotel
  });
  
  // If booking policy doesn't have user info, update it
  if (bookingPolicy && (!bookingPolicy.userType || !bookingPolicy.companyId)) {
    bookingPolicy.userType = userType;
    if (userType === 'company') {
      bookingPolicy.companyId = userId;
    } else if (userType === 'employee') {
      bookingPolicy.employeeId = userId;
      const employee = await Employee.findById(userId);
      if (employee && employee.company) {
        bookingPolicy.companyId = employee.company;
      }
    }
    await bookingPolicy.save();
  }
  
  if (!bookingPolicy) {
    console.error('Booking policy not found:', {
      booking_policy_id,
      transaction_identifier: transaction_id
    });
    return res.status(404).json({
      'message': 'Booking policy not found. Please try again.'
    });
  }

  if (!bookingPolicy.booking_policy || !bookingPolicy.booking_policy.package) {
    console.error('Invalid booking policy data:', {
      booking_policy_id,
      transaction_identifier: transaction_id,
      has_booking_policy: !!bookingPolicy.booking_policy,
      has_package: !!bookingPolicy?.booking_policy?.package,
      booking_policy_structure: Object.keys(bookingPolicy || {}),
      package_structure: bookingPolicy?.booking_policy ? Object.keys(bookingPolicy.booking_policy) : []
    });
    return res.status(500).json({
      'message': 'Invalid booking policy data. Please try again.'
    });
  }
  
  // Validate that the booking policy has the required booking_policy_id
  if (!bookingPolicy.booking_policy.booking_policy_id) {
    console.error('Missing booking_policy_id in booking policy:', bookingPolicy.booking_policy);
    return res.status(500).json({
      'message': 'Invalid booking policy - missing booking policy ID'
    });
  }

  const hotelPackage = bookingPolicy.booking_policy.package;
  const hotel = bookingPolicy.hotel;
  
  // Get base values from hotel package after markup has been applied
  let baseAmount = +hotelPackage.base_amount;
  let serviceComponent = +hotelPackage.service_component;
  let gst = +hotelPackage.gst;
  
  const baseAmountIncDiscount = Math.ceil(baseAmount);
  const couponDiscount = 0;
  const totalChargeableAmount = Math.ceil(baseAmountIncDiscount - couponDiscount + serviceComponent + gst);
  
  const actual_room_rate = +hotelPackage.room_rate;
  const client_commission = +hotelPackage.client_commission;
  const base_amount_markup_excluded = Math.ceil(actual_room_rate + client_commission);
  const markup_applied = Math.ceil(baseAmount - base_amount_markup_excluded);
  
  const pricing = {
    base_amount_discount_included: baseAmountIncDiscount,
    base_amount_discount_excluded: baseAmountIncDiscount - couponDiscount,
    coupon_discount: couponDiscount,
    client_discount: 0,
    service_component: serviceComponent,
    gst: gst,
    total_chargeable_amount: totalChargeableAmount,
    actual_room_rate: actual_room_rate,
    client_commission: client_commission,
    base_amount_markup_excluded: base_amount_markup_excluded,
    markup_applied: markup_applied,
    currency: hotelPackage.chargeable_rate_currency
  };
  
  const transaction = new Transaction();
  
  // Set user information based on authentication type
  transaction.userType = userType;
  
  if (userType === 'company') {
    transaction.companyId = userId;
  } else if (userType === 'employee') {
    transaction.employeeId = userId;
    // Also store the company ID for employee bookings
    const employee = await Employee.findById(userId);
    if (employee && employee.company) {
      transaction.companyId = employee.company;
    }
  }
  
  transaction.search = bookingPolicy.search;
  transaction.booking_policy = bookingPolicy.booking_policy;
  transaction.transaction_identifier = transaction_id;
  transaction.contactDetail = contactDetail;
  transaction.hotel = hotel.toObject();
  transaction.hotelPackage = hotelPackage;
  transaction.status = 0;
  transaction.pricing = pricing;
  
  // for now passing same same lead guest for every room
  const room_lead_guests = [];
  let room_guests = [];
  
  const roomCount = transaction.search.room_count;
  
  for (let i = 0; i < roomCount; i++) {
    const leadGuest = {
      "first_name": contactDetail.name,
      "last_name": contactDetail.last_name,
      "nationality": "IN"
    }
    room_lead_guests.push(leadGuest);
  }
  
  console.log(room_lead_guests, roomCount)
  
  if (guests && guests.length > 0) {
    room_guests = guests.map((guest) => {
      // Handle case where guest data might be incomplete
      const guestData = guest.room_guest && guest.room_guest[0] ? guest.room_guest[0] : {};
      return {
        "first_name": guestData.firstname || contactDetail.name,
        "last_name": guestData.lastname || contactDetail.last_name,
        "contact_no": guestData.mobile || contactDetail.mobile,
        "nationality": guestData.nationality || "IN"
      }
    })
  }
  
  console.log(room_guests, roomCount)
  
  const payload = {
    "prebook": {
      "transaction_identifier": transaction_id,
      "booking_policy_id": bookingPolicy.booking_policy.booking_policy_id,
      "room_lead_guests": room_lead_guests,
      "contact_person": {
        "salutation": "Mr.",
        "first_name": contactDetail.name,
        "last_name": contactDetail.last_name,
        "email": contactDetail.email,
        "contact_no": contactDetail.mobile
      },
      "guests": room_guests
    }
  }
  
  console.log('Prebook payload:', JSON.stringify(payload, null, 2));
  try {
    const data = await Api.post("/prebook", payload);
    
    console.log('Prebook API response:', JSON.stringify(data, null, 2));
    if (data && data.data && data.data !== undefined) {
      try {
        transaction.prebook_response = data;
        await transaction.save();
        data.transactionid = transaction._id;
        res.json(data);
      } catch (e) {
        console.error('Error saving transaction:', e.message);
        res.status(500).json({
          'message': 'Cannot book selected hotel - Database error'
        });
      }
    } else {
      console.error('Invalid prebook API response:', data);
      console.log('Payload: ', payload);
      res.status(500).json({
        'message': 'Cannot book selected hotel - Invalid API response'
      });
    }
  } catch (err) {
    console.error('Prebook API error:', err);
    res.status(500).json({
      'message': `Booking failed: ${err.message}`
    });
  }
};
  