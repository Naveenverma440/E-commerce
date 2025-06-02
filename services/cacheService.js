const redis = require('redis');

let redisClient = null;
let isRedisConnected = false;

const initializeRedis = async () => {
  try {
    if (!process.env.REDIS_HOST) {
      console.log('Redis configuration not found, caching disabled');
      return false;
    }

    redisClient = redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('Redis connection refused');
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          console.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          console.error('Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
      isRedisConnected = true;
    });

    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
      isRedisConnected = false;
    });

    redisClient.on('end', () => {
      console.log('Redis client disconnected');
      isRedisConnected = false;
    });

    await redisClient.connect();
    return true;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    isRedisConnected = false;
    return false;
  }
};

const isRedisAvailable = () => {
  return isRedisConnected && redisClient;
};

const get = async (key) => {
  try {
    if (!isRedisAvailable()) {
      return null;
    }

    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

const set = async (key, data, expireInSeconds = 3600) => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }

    await redisClient.setEx(key, expireInSeconds, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
};

// Delete data from cache
const del = async (key) => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }

    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
};

// Delete multiple keys matching a pattern
const delPattern = async (pattern) => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Redis delete pattern error:', error);
    return false;
  }
};

// Check if key exists
const exists = async (key) => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }

    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    console.error('Redis exists error:', error);
    return false;
  }
};

// Set expiration for a key
const expire = async (key, seconds) => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }

    await redisClient.expire(key, seconds);
    return true;
  } catch (error) {
    console.error('Redis expire error:', error);
    return false;
  }
};

// Get time to live for a key
const ttl = async (key) => {
  try {
    if (!isRedisAvailable()) {
      return -1;
    }

    return await redisClient.ttl(key);
  } catch (error) {
    console.error('Redis TTL error:', error);
    return -1;
  }
};

// Increment a counter
const incr = async (key) => {
  try {
    if (!isRedisAvailable()) {
      return 0;
    }

    return await redisClient.incr(key);
  } catch (error) {
    console.error('Redis increment error:', error);
    return 0;
  }
};

// Cache middleware for Express routes
const cacheMiddleware = (expireInSeconds = 3600) => {
  return async (req, res, next) => {
    if (!isRedisAvailable()) {
      return next();
    }

    try {
      const cacheKey = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;
      const cachedData = await get(cacheKey);

      if (cachedData) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return res.json(cachedData);
      }

      // Store original res.json function
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function(data) {
        // Cache the response data
        set(cacheKey, data, expireInSeconds)
          .then(() => console.log(`Cached data for key: ${cacheKey}`))
          .catch(err => console.error('Failed to cache data:', err));

        // Call original res.json
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Product-specific cache functions
const cacheProduct = async (productId, productData, expireInSeconds = 3600) => {
  const key = `product:${productId}`;
  return await set(key, productData, expireInSeconds);
};

const getCachedProduct = async (productId) => {
  const key = `product:${productId}`;
  return await get(key);
};

const invalidateProductCache = async (productId) => {
  const key = `product:${productId}`;
  await del(key);
  // Also invalidate product list caches
  await delPattern('cache:/api/products*');
};

// Category-specific cache functions
const cacheCategories = async (categoriesData, expireInSeconds = 7200) => {
  const key = 'categories:list';
  return await set(key, categoriesData, expireInSeconds);
};

const getCachedCategories = async () => {
  const key = 'categories:list';
  return await get(key);
};

const invalidateCategoriesCache = async () => {
  await del('categories:list');
  await delPattern('cache:/api/products*');
};

// User session cache functions
const cacheUserSession = async (userId, sessionData, expireInSeconds = 86400) => {
  const key = `session:${userId}`;
  return await set(key, sessionData, expireInSeconds);
};

const getCachedUserSession = async (userId) => {
  const key = `session:${userId}`;
  return await get(key);
};

const invalidateUserSession = async (userId) => {
  const key = `session:${userId}`;
  return await del(key);
};

// Cart cache functions
const cacheUserCart = async (userId, cartData, expireInSeconds = 3600) => {
  const key = `cart:${userId}`;
  return await set(key, cartData, expireInSeconds);
};

const getCachedUserCart = async (userId) => {
  const key = `cart:${userId}`;
  return await get(key);
};

const invalidateUserCart = async (userId) => {
  const key = `cart:${userId}`;
  return await del(key);
};

// Rate limiting functions
const incrementRateLimit = async (identifier, windowInSeconds = 900) => {
  const key = `rate_limit:${identifier}`;
  const current = await incr(key);
  
  if (current === 1) {
    await expire(key, windowInSeconds);
  }
  
  return current;
};

const getRateLimit = async (identifier) => {
  const key = `rate_limit:${identifier}`;
  const count = await get(key);
  const remaining = await ttl(key);
  
  return {
    count: count || 0,
    remaining: remaining > 0 ? remaining : 0
  };
};

// Close Redis connection
const closeRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      console.log('Redis connection closed');
    }
  } catch (error) {
    console.error('Error closing Redis connection:', error);
  }
};

module.exports = {
  initializeRedis,
  isRedisAvailable,
  get,
  set,
  del,
  delPattern,
  exists,
  expire,
  ttl,
  incr,
  cacheMiddleware,
  cacheProduct,
  getCachedProduct,
  invalidateProductCache,
  cacheCategories,
  getCachedCategories,
  invalidateCategoriesCache,
  cacheUserSession,
  getCachedUserSession,
  invalidateUserSession,
  cacheUserCart,
  getCachedUserCart,
  invalidateUserCart,
  incrementRateLimit,
  getRateLimit,
  closeRedis
};