const api = require('../utils/api');

// Helper function to limit region IDs (if needed)
const limitRegionIds = (id, limit) => {
  if (Array.isArray(id)) {
    return id.slice(0, limit);
  }
  return id;
};

exports.suggest = async (req, res, next) => {
  const term = req.body.query;
  let page = +req.body.page;
  let perPage = +req.body.perPage;
  let currentItemsCount = +req.body.currentItemsCount;

  console.log('currentItemsCount ' + currentItemsCount);

  // Validate and set default values for pagination
  if (!page || page < 1) {
    page = 1;
  }

  // minimum items allowed = 10
  if (!perPage || perPage < 10) {
    perPage = 10;
  }

  // maximum items allowed at one time = 50
  if (perPage > 50) {
    return res.status(400).json({
      'message': 'perPage should not be greater than 50'
    });
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
    return res.json(defaultResponse);
  }

  let responseData = [];

  try {
    // Prepare request payload
    const requestPayload = {
      "autosuggest": {
        "query": term,
        "locale": "en-US"
      }
    };

    console.log('=== DELONIX API REQUEST ===');
    console.log('URL:', process.env.HOTEL_APIURL + '/autosuggest');
    console.log('Auth Key:', process.env.HOTEL_APIAUTH ? '***' + process.env.HOTEL_APIAUTH.slice(-4) : 'NOT SET');
    console.log('Request Payload:', JSON.stringify(requestPayload, null, 2));
    console.log('==========================');

    // Make request to external API
    const data = await api.post("/autosuggest", requestPayload);

    console.log('=== DELONIX API RESPONSE ===');
    console.log('served from api');
    console.log(JSON.stringify(data, null, 2));
    console.log('===========================');

    if (data && data.data) {
      // Process cities auto suggest
      if (data.data.city && data.data.city.results) {
        data.data.city.results.forEach((item) => {
          item.transaction_identifier = data.transaction_identifier;
          item.displayName = `${item.name} | (${item.hotelCount})`;
          // Limit region IDs to maximum 50 to avoid backend issues
          item.id = limitRegionIds(item.id, 50);
          responseData.push(item);
        });
      }

      // Process hotels auto suggest
      if (data.data.hotel && data.data.hotel.results) {
        data.data.hotel.results.forEach((item) => {
          item.transaction_identifier = data.data.transaction_identifier;
          item.displayName = `${item.name}`;
          responseData.push(item);
        });
      }

      // Process POI auto suggest
      if (data.data.poi && data.data.poi.results) {
        data.data.poi.results.forEach((item) => {
          item.transaction_identifier = data.data.transaction_identifier;
          item.displayName = `${item.name} | (${item.hotelCount})`;
          responseData.push(item);
        });
      }
    }

  } catch (err) {
    console.error('Error fetching suggestions:', err);
    return next(err);
  }

  // Calculate pagination
  const nextItemsCount = page * perPage > responseData.length ? responseData.length : page * perPage;

  const paginationObj = {
    'currentItemsCount': nextItemsCount,
    'totalItemsCount': responseData.length,
    'totalPages': Math.ceil(responseData.length / perPage),
    'pollingStatus': '',
  };

  let pollingStatus;

  if (page > paginationObj.totalPages) {
    console.log('page: ' + page);
    console.log(paginationObj);
    return res.json(defaultResponse);
  }

  if (page === paginationObj.totalPages) {
    pollingStatus = "complete";
  } else {
    pollingStatus = "in-progress";
  }

  paginationObj.pollingStatus = pollingStatus;

  let lowerBound = currentItemsCount;
  let upperBound = lowerBound + perPage;

  // upperBound should not be greater than totalItems + 1
  if (upperBound > paginationObj.totalItemsCount + 1) {
    upperBound = paginationObj.totalItemsCount + 1;
  }

  console.log(paginationObj);
  console.log(page);
  console.log(perPage);
  console.log(lowerBound);
  console.log(upperBound);

  // Select only requested no of items in current iteration
  const selectedItems = responseData.slice(lowerBound, upperBound);

  const response = {
    'data': selectedItems,
    'status': paginationObj.pollingStatus,
    'currentItemsCount': paginationObj.currentItemsCount,
    'totalItemsCount': paginationObj.totalItemsCount,
    'page': page,
    'perPage': perPage,
    'totalPages': paginationObj.totalPages,
  };

  res.json(response);
}; 