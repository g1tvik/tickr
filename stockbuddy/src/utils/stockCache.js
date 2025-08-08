// Shared stock cache utility for StockBuddy
// This prevents duplicate API calls and provides consistent caching across components

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const CACHE_KEY = 'stockbuddy_stock_cache';
const CACHE_TIMESTAMP_KEY = 'stockbuddy_cache_timestamp';

// Helper function to get formatted timestamp
const getTimestamp = () => {
  return new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

// In-memory cache
let stockCache = {};
let cacheTimestamp = 0;

// Load cache from localStorage
const loadCacheFromStorage = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cachedData && cachedTimestamp) {
      const parsedData = JSON.parse(cachedData);
      const timestamp = parseInt(cachedTimestamp);
      const now = Date.now();
      
      // Check if cache is still valid
      if ((now - timestamp) < CACHE_DURATION) {
        stockCache.data = parsedData;
        cacheTimestamp = timestamp;
        console.log(`[${getTimestamp()}] 📊 Loaded stock data from cache`);
        return true;
      } else {
        // Clear expired cache
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        console.log(`[${getTimestamp()}] 📊 Cache expired, will fetch fresh data`);
      }
    }
  } catch (error) {
    console.warn(`[${getTimestamp()}] Failed to load cache from localStorage:`, error);
  }
  return false;
};

// Save cache to localStorage
const saveCacheToStorage = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`[${getTimestamp()}] 📊 Saved stock data to cache`);
  } catch (error) {
    console.warn(`[${getTimestamp()}] Failed to save cache to localStorage:`, error);
  }
};

// Check if cache is valid
const isCacheValid = () => {
  const now = Date.now();
  return stockCache.data && (now - cacheTimestamp) < CACHE_DURATION;
};

// Get cached data
const getCachedData = () => {
  if (isCacheValid()) {
    console.log(`[${getTimestamp()}] 📊 Using cached stock data`);
    return stockCache.data;
  }
  return null;
};

// Set cache data
const setCacheData = (data) => {
  const now = Date.now();
  stockCache.data = data;
  cacheTimestamp = now;
  saveCacheToStorage(data);
};

// Clear cache
const clearCache = () => {
  stockCache = {};
  cacheTimestamp = 0;
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  console.log(`[${getTimestamp()}] 📊 Cache cleared`);
};

// Fetch stock data with caching
const fetchStockData = async (symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'SPY']) => {
  // Check cache first
  const cachedData = getCachedData();
  if (cachedData) {
    return cachedData;
  }
  
  console.log(`[${getTimestamp()}] 📊 Fetching fresh stock data from API`);
  
  try {
    // Fetch quotes for stocks in parallel
    const stockPromises = symbols.map(async (symbol) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/trading/quote/${symbol}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            return data.quote;
          } else {
            console.warn(`[${getTimestamp()}] Failed to fetch data for ${symbol}:`, data.message);
            return null;
          }
        } else {
          console.warn(`[${getTimestamp()}] HTTP error for ${symbol}:`, response.status);
          return null;
        }
      } catch (error) {
        console.warn(`[${getTimestamp()}] Error fetching ${symbol}:`, error);
        return null;
      }
    });

    const results = await Promise.all(stockPromises);
    const validStocks = results.filter(stock => stock !== null);
    
    if (validStocks.length > 0) {
      // Cache the results
      setCacheData(validStocks);
      console.log(`[${getTimestamp()}] 📊 Successfully fetched ${validStocks.length} stocks`);
      return validStocks;
    } else {
      throw new Error('No valid stock data received');
    }
  } catch (error) {
    console.error(`[${getTimestamp()}] Error fetching stock data:`, error);
    throw error;
  }
};

// Initialize cache from localStorage
loadCacheFromStorage();

export {
  fetchStockData,
  getCachedData,
  setCacheData,
  clearCache,
  isCacheValid,
  CACHE_DURATION
}; 