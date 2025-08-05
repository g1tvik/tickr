const axios = require('axios');
const Alpaca = require('@alpacahq/alpaca-trade-api');

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

// Alpaca API configuration
const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY || 'demo',
  secretKey: process.env.ALPACA_SECRET_KEY || 'demo',
  paper: true,
  usePolygon: true,
  baseUrl: 'https://broker-api.sandbox.alpaca.markets'
});

// Cache for company names to reduce API calls
let companyNameCache = {};

// Cache for search results to improve performance
let searchCache = {};
const SEARCH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Comprehensive company name mapping as fallback
const companyNameMapping = {
  // FAANG + Major Tech
  'META': 'Meta Platforms, Inc.',
  'AAPL': 'Apple Inc.',
  'AMZN': 'Amazon.com, Inc.',
  'NFLX': 'Netflix, Inc.',
  'GOOGL': 'Alphabet Inc.',
  'MSFT': 'Microsoft Corporation',
  'TSLA': 'Tesla, Inc.',
  'NVDA': 'NVIDIA Corporation',
  
  // ETFs
  'SPY': 'SPDR S&P 500 ETF',
  'QQQ': 'Invesco QQQ Trust',
  'IWM': 'iShares Russell 2000 ETF',
  
  // Financial
  'JPM': 'JPMorgan Chase & Co.',
  'BAC': 'Bank of America Corp.',
  'WFC': 'Wells Fargo & Co.',
};

// Get company name from Alpaca API or fallback
const getCompanyName = async (symbol) => {
  try {
    // Check cache first
    if (companyNameCache[symbol]) {
      return companyNameCache[symbol];
    }

    // Check if Alpaca API keys are configured
    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
      return companyNameMapping[symbol] || symbol;
    }

    const headers = {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
    };

    try {
      const response = await axios.get(`https://paper-api.alpaca.markets/v2/assets/${symbol}`, {
        headers
      });
      
      if (response.data && response.data.name) {
        companyNameCache[symbol] = response.data.name;
        return response.data.name;
      }
    } catch (alpacaError) {
      console.warn(`[${getTimestamp()}] Failed to fetch company name for ${symbol}:`, alpacaError.message);
    }

    // Fallback to mapping
    const fallbackName = companyNameMapping[symbol];
    if (fallbackName) {
      companyNameCache[symbol] = fallbackName;
      return fallbackName;
    }

    return symbol;
  } catch (error) {
    console.error(`[${getTimestamp()}] Error getting company name:`, error);
    return companyNameMapping[symbol] || symbol;
  }
};

// Get stock quote from Alpaca API
const getStockQuote = async (symbol) => {
  try {
    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
      throw new Error('Alpaca API keys not configured');
    }

    const headers = {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
    };

    // Get latest quote
    const quoteResponse = await axios.get(`https://data.alpaca.markets/v2/stocks/quotes/latest?symbols=${symbol}`, {
      headers
    });

    if (!quoteResponse.data.quotes || !quoteResponse.data.quotes[symbol]) {
      throw new Error('No quote data available');
    }

    const quote = quoteResponse.data.quotes[symbol];
    const companyName = await getCompanyName(symbol);
    
    // Get previous close for change calculation
    const { previousClose, dailyVolume } = await getPreviousClose(symbol);

    return {
      symbol: symbol,
      name: companyName,
      price: quote.ap || quote.bp || quote.t || 0, // Use ask price, bid price, or trade price
      change: previousClose ? (quote.ap || quote.bp || quote.t || 0) - previousClose : null,
      changePercent: previousClose ? ((quote.ap || quote.bp || quote.t || 0) - previousClose) / previousClose * 100 : null,
      volume: dailyVolume,
      bid: quote.bp,
      ask: quote.ap,
      lastTrade: quote.t,
      timestamp: quote.t
    };
  } catch (error) {
    console.error(`[${getTimestamp()}] Error getting stock quote:`, error);
    throw error;
  }
};

// Get previous close and daily volume
const getPreviousClose = async (symbol) => {
  try {
    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
      return { previousClose: null, dailyVolume: null };
    }

    const headers = {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
    };

    // Try Alpaca historical data first (with better error handling)
    try {
      const response = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Day&limit=2`, {
        headers,
        timeout: 5000 // 5 second timeout
      });

      if (response.data.bars && response.data.bars.length >= 2) {
        const previousBar = response.data.bars[response.data.bars.length - 2];
        const currentBar = response.data.bars[response.data.bars.length - 1];
        return {
          previousClose: previousBar.c,
          dailyVolume: currentBar.v
        };
      }
    } catch (alpacaError) {
      // Only log if it's not a 403 (rate limit) or 401 (auth) error
      if (alpacaError.response && alpacaError.response.status !== 403 && alpacaError.response.status !== 401) {
        console.warn(`[${getTimestamp()}] ⚠️ Failed to get daily volume for ${symbol}: ${alpacaError.message}`);
      }
    }

    // Fallback to Yahoo Finance API (more reliable for historical data)
    try {
      const yahooResponse = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`, {
        timeout: 5000
      });
      
      if (yahooResponse.data.chart.result && yahooResponse.data.chart.result[0]) {
        const result = yahooResponse.data.chart.result[0];
        const closes = result.indicators.quote[0].close;
        const volumes = result.indicators.quote[0].volume;
        
        if (closes && closes.length >= 2) {
          const previousClose = closes[closes.length - 2];
          const currentVolume = volumes ? volumes[volumes.length - 1] : null;
          
          return {
            previousClose: previousClose,
            dailyVolume: currentVolume
          };
        }
      }
    } catch (yahooError) {
      // Only log if it's a significant error
      if (yahooError.response && yahooError.response.status !== 404) {
        console.warn(`[${getTimestamp()}] ⚠️ Failed to get Yahoo Finance data for ${symbol}: ${yahooError.message}`);
      }
    }

    // Final fallback - use current price as previous close (for demo purposes)
    try {
      const quoteResponse = await axios.get(`https://data.alpaca.markets/v2/stocks/quotes/latest?symbols=${symbol}`, {
        headers,
        timeout: 3000
      });

      if (quoteResponse.data.quotes && quoteResponse.data.quotes[symbol]) {
        const quote = quoteResponse.data.quotes[symbol];
        const currentPrice = quote.ap || quote.bp || quote.t || 0;
        
        return {
          previousClose: currentPrice, // Use current price as fallback
          dailyVolume: 100 // Default volume for demo
        };
      }
    } catch (quoteError) {
      // Silent fallback - don't spam logs
    }

    return { previousClose: null, dailyVolume: null };
  } catch (error) {
    console.error(`[${getTimestamp()}] Error getting previous close:`, error);
    return { previousClose: null, dailyVolume: null };
  }
};

// Enhanced autocomplete search
const searchStocksAutocomplete = async (query) => {
  try {
    const queryLower = query.toLowerCase().trim();

    // Check cache first
    const cacheKey = `autocomplete_${queryLower}`;
    const cached = searchCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < SEARCH_CACHE_DURATION) {
      return cached.results;
    }

    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
      throw new Error('Alpaca API keys not configured');
    }

    const headers = {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
    };

    let alpacaAssets = [];
    try {
      const response = await axios.get('https://paper-api.alpaca.markets/v2/assets', {
        headers,
        params: {
          status: 'active',
          asset_class: 'us_equity'
        }
      });
      alpacaAssets = response.data;
    } catch (alpacaError) {
      console.warn(`[${getTimestamp()}] Failed to fetch Alpaca assets:`, alpacaError.message);
      throw new Error('Failed to fetch stock data');
    }

    // Professional search algorithm
    const searchResults = [];

    for (const asset of alpacaAssets) {
      const symbolLower = asset.symbol.toLowerCase();
      const nameLower = asset.name.toLowerCase();

      let score = 0;
      let shouldInclude = false;
      let matchType = '';

      // Exact symbol match (highest priority)
      if (symbolLower === queryLower) {
        score = 10000;
        shouldInclude = true;
        matchType = 'exact_symbol';
      }
      // Symbol starts with query (very high priority)
      else if (symbolLower.startsWith(queryLower)) {
        score = 9000;
        shouldInclude = true;
        matchType = 'symbol_starts';
      }
      // Company name starts with query (high priority)
      else if (nameLower.startsWith(queryLower)) {
        score = 8000;
        shouldInclude = true;
        matchType = 'name_starts';
      }
      // Company name contains query as whole word
      else {
        const nameWords = nameLower.split(/\s+/);
        if (nameWords.some(word => word === queryLower)) {
          score = 7000;
          shouldInclude = true;
          matchType = 'name_word';
        }
        // Company name contains query word that starts with query
        else if (nameWords.some(word => word.startsWith(queryLower))) {
          score = 6000;
          shouldInclude = true;
          matchType = 'name_word_starts';
        }
        // Company name contains query (lower priority)
        else if (nameLower.includes(queryLower)) {
          score = 5000;
          shouldInclude = true;
          matchType = 'name_contains';
        }
        // Symbol contains query (lower priority)
        else if (symbolLower.includes(queryLower)) {
          score = 4000;
          shouldInclude = true;
          matchType = 'symbol_contains';
        }
      }

      if (shouldInclude) {
        // Professional relevance scoring
        score += Math.max(0, 15 - symbolLower.length) * 50;

        const establishedKeywords = ['inc', 'corp', 'company', 'ltd', 'llc', 'plc', 'sa', 'ag', 'co', 'corporation'];
        if (establishedKeywords.some(keyword => nameLower.includes(keyword))) {
          score += 200;
        }

        const etfKeywords = ['etf', 'fund', 'trust', 'shares', 'strategy', 'index', 'portfolio'];
        if (etfKeywords.some(keyword => nameLower.includes(keyword))) {
          score -= 2000;
        }

        if (nameLower.length > 50) {
          score -= 300;
        }

        const brandKeywords = ['apple', 'microsoft', 'google', 'amazon', 'tesla', 'netflix', 'facebook', 'meta', 'nvidia', 'intel', 'amd', 'berkshire', 'coca', 'pepsi', 'mcdonalds', 'starbucks', 'disney', 'netflix', 'spotify', 'uber', 'lyft', 'airbnb', 'salesforce', 'oracle', 'adobe', 'paypal', 'visa', 'mastercard'];
        if (brandKeywords.some(brand => nameLower.includes(brand))) {
          score += 500;
        }

        if (symbolLower.length >= 4 && symbolLower.length <= 5) {
          score += 100;
        }

        searchResults.push({
          symbol: asset.symbol,
          name: asset.name,
          relevanceScore: score,
          matchType: matchType
        });
      }
    }

    // Sort by relevance score
    searchResults.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      if (a.symbol.length !== b.symbol.length) {
        return a.symbol.length - b.symbol.length;
      }
      return a.symbol.toLowerCase().localeCompare(b.symbol.toLowerCase());
    });

    const results = searchResults.slice(0, 15).map(asset => ({
      symbol: asset.symbol,
      name: asset.name,
      matchType: asset.matchType
    }));

    // Cache the results
    searchCache[cacheKey] = {
      results: results,
      timestamp: Date.now()
    };

    return results;
  } catch (error) {
    console.error(`[${getTimestamp()}] Error in autocomplete search:`, error);
    throw new Error(`Failed to search stocks: ${error.message}`);
  }
};

module.exports = {
  getCompanyName,
  getStockQuote,
  getPreviousClose,
  searchStocksAutocomplete,
  alpaca
}; 