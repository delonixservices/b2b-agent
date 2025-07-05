const redis = require('redis');

let redisClient = null;

const createRedisClient = async () => {
  console.log('=== CREATING REDIS CLIENT ===');
  try {
    // Get Redis configuration from environment variables
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || 6379;
    const password = process.env.REDIS_AUTH;
    
    console.log('Redis config:', {
      host,
      port,
      hasPassword: !!password,
      hasRedisUrl: !!process.env.REDIS_URL
    });
    
    // Build Redis URL or use individual config
    let redisConfig;
    
    if (password) {
      // Use password authentication
      redisConfig = {
        socket: {
          host: host,
          port: port,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis connection failed after 10 retries');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        },
        password: password
      };
    } else {
      // Use URL format if REDIS_URL is provided
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        redisConfig = {
          url: redisUrl,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                console.error('Redis connection failed after 10 retries');
                return false;
              }
              return Math.min(retries * 100, 3000);
            }
          }
        };
      } else {
        // Default configuration without password
        redisConfig = {
          socket: {
            host: host,
            port: port,
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                console.error('Redis connection failed after 10 retries');
                return false;
              }
              return Math.min(retries * 100, 3000);
            }
          }
        };
      }
    }

    console.log('Redis config created, attempting to create client...');
    const client = redis.createClient(redisConfig);

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    client.on('end', () => {
      console.log('Redis Client Disconnected');
    });

    console.log('Attempting to connect to Redis...');
    const connectStartTime = Date.now();
    await client.connect();
    const connectEndTime = Date.now();
    console.log('Redis connection established in:', connectEndTime - connectStartTime, 'ms');
    console.log('=== REDIS CLIENT CREATED SUCCESSFULLY ===');
    return client;
  } catch (error) {
    console.error('=== REDIS CLIENT CREATION FAILED ===');
    console.error('Failed to create Redis client:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return null;
  }
};

const getRedisClient = async () => {
  console.log('=== GETTING REDIS CLIENT ===');
  console.log('Current redisClient state:', {
    exists: !!redisClient,
    isOpen: redisClient ? redisClient.isOpen : false
  });
  
  if (!redisClient) {
    console.log('No existing Redis client, creating new one...');
    redisClient = await createRedisClient();
  }
  
  if (redisClient && !redisClient.isOpen) {
    console.log('Redis client exists but not open, attempting to reconnect...');
    try {
      const reconnectStartTime = Date.now();
      await redisClient.connect();
      const reconnectEndTime = Date.now();
      console.log('Redis reconnection successful in:', reconnectEndTime - reconnectStartTime, 'ms');
    } catch (error) {
      console.error('Failed to reconnect to Redis:', error);
      redisClient = null;
    }
  }
  
  console.log('Returning Redis client:', {
    exists: !!redisClient,
    isOpen: redisClient ? redisClient.isOpen : false
  });
  console.log('=== REDIS CLIENT RETRIEVED ===');
  return redisClient;
};

const closeRedisClient = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
};

module.exports = {
  getRedisClient,
  closeRedisClient
}; 