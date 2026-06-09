const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const authRoutes = require('./auth');
const { requireApproved } = require('../middleware/requireApproved');

// Reuse shared middleware and helpers
const authenticateToken = authRoutes.authenticateToken;

// Whether to emit verbose per-request debug logs (raw userIds, query strings,
// operation details). Disabled in production to avoid leaking PII / noise.
const VERBOSE_LOGS = process.env.NODE_ENV !== 'production';

// Timeout (ms) applied to every outbound call to external services (Alpaca / Yahoo)
// so a hung upstream can't tie up a request indefinitely.
const EXTERNAL_TIMEOUT_MS = 8000;

// Cap on the number of entries any in-memory cache may hold. Prevents unbounded
// growth / cache-pollution memory exhaustion. Oldest entry is evicted when over cap.
const CACHE_MAX_ENTRIES = 500;

// Max length of a user-supplied search query we'll accept (reject longer to avoid
// cache pollution and wasted work).
const MAX_QUERY_LENGTH = 100;

// Evict the oldest insertion-order entry from a Map-backed cache once it exceeds the cap.
const enforceCacheCap = (map) => {
  while (map.size > CACHE_MAX_ENTRIES) {
    const oldestKey = map.keys().next().value;
    map.delete(oldestKey);
  }
};

// Rate limiter for public quote/chart/market reads (60 requests / minute / IP).
const quoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limiter for the more expensive public search endpoints (30 / minute / IP).
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

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

// Detect whether real Alpaca credentials are configured (not missing / placeholder)
const hasAlpacaKeys = () => {
  const key = process.env.ALPACA_API_KEY;
  const secret = process.env.ALPACA_SECRET_KEY;
  const placeholders = ['', 'demo', 'your_api_key', 'your_secret_key', 'placeholder'];
  if (!key || !secret) return false;
  if (placeholders.includes(key.toLowerCase()) || placeholders.includes(secret.toLowerCase())) return false;
  return true;
};

// Alpaca API configuration
const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY || 'demo',
  secretKey: process.env.ALPACA_SECRET_KEY || 'demo',
  paper: true, // Use paper trading (sandbox)
  usePolygon: true, // Use Polygon for real-time market data
  baseUrl: 'https://broker-api.sandbox.alpaca.markets' // Use sandbox endpoint
});

// Initialize portfolio for new users
const initializePortfolio = async (req, userId) => {
  let portfolio = await req.app.locals.storage.getPortfolio(userId);

  if (!portfolio) {
    portfolio = {
      balance: 10000, // Starting with $10,000
      positions: [],
      totalValue: 10000,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    await req.app.locals.storage.savePortfolio(userId, portfolio);
  }

  return portfolio;
};

// Cache for company names to reduce API calls (Map for capped insertion-order eviction)
const companyNameCache = new Map();

// Cache for search results to improve performance (Map for capped insertion-order eviction)
const searchCache = new Map();
const SEARCH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for Alpaca assets to avoid repeated API calls
let alpacaAssetsCache = {
  data: null,
  timestamp: null,
  ttl: 10 * 60 * 1000 // 10 minutes cache for assets
};

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
  'GS': 'Goldman Sachs Group Inc.',
  
  // Healthcare
  'JNJ': 'Johnson & Johnson',
  'PFE': 'Pfizer Inc.',
  'UNH': 'UnitedHealth Group Inc.',
  'ABBV': 'AbbVie Inc.',
  
  // Consumer
  'V': 'Visa Inc.',
  'MA': 'Mastercard Inc.',
  'WMT': 'Walmart Inc.',
  'HD': 'Home Depot Inc.',
  'DIS': 'Walt Disney Co.',
  'PG': 'Procter & Gamble Co.',
  
  // Other Major Companies
  'PYPL': 'PayPal Holdings Inc.',
  'INTC': 'Intel Corporation',
  'CSCO': 'Cisco Systems Inc.',
  'ADBE': 'Adobe Inc.',
  'CRM': 'Salesforce Inc.',
  'ORCL': 'Oracle Corporation',
  'IBM': 'International Business Machines Corp.',
  'KO': 'Coca-Cola Co.',
  'PEP': 'PepsiCo Inc.',
  'MCD': 'McDonald\'s Corporation'
};

// Get company name from Alpaca API
const getCompanyName = async (symbol) => {
  try {
    // Check cache first
    if (companyNameCache.has(symbol)) {
      return companyNameCache.get(symbol);
    }

    // Check if Alpaca API keys are configured
    if (!hasAlpacaKeys()) {
      if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] Alpaca API keys not configured, using fallback company name`);
      const fallbackName = companyNameMapping[symbol.toUpperCase()] || symbol.toUpperCase();
      companyNameCache.set(symbol, fallbackName);
      enforceCacheCap(companyNameCache);
      return fallbackName;
    }

    const headers = {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
    };

    // Use the working Alpaca Paper Trading API endpoint
          if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 🔍 Fetching company name for ${symbol} from Alpaca Paper Trading API...`);
    try {
      const response = await axios.get(`https://paper-api.alpaca.markets/v2/assets/${symbol}`, {
        headers,
        timeout: EXTERNAL_TIMEOUT_MS
      });

              if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📄 Alpaca Paper Trading API responded for ${symbol} (status ${response.status})`);

      const asset = response.data;
      if (asset && asset.name) {
        // Clean up the company name (remove "Common Stock" suffix)
        let companyName = asset.name;
        if (companyName.includes(' Common Stock')) {
          companyName = companyName.replace(' Common Stock', '');
        }
        if (companyName.includes(' Inc.')) {
          companyName = companyName.replace(' Inc.', ' Inc.');
        }

        if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] ✅ Found company name for ${symbol}: ${companyName}`);
        // Cache the company name
        companyNameCache.set(symbol, companyName);
        enforceCacheCap(companyNameCache);
        return companyName;
      } else {
        if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] ⚠️ No company name found in Alpaca response for ${symbol}, checking fallback mapping`);
      }
    } catch (alpacaError) {
      console.error(`[${getTimestamp()}] ❌ Alpaca API failed for ${symbol}:`, alpacaError.message);
      if (VERBOSE_LOGS && alpacaError.response) {
        console.error(`[${getTimestamp()}]    Status: ${alpacaError.response.status}`);
      }
    }

    // If Alpaca API fails, use fallback mapping
    if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] ⚠️ Alpaca API failed for ${symbol}, checking fallback mapping`);
    if (companyNameMapping[symbol.toUpperCase()]) {
      const fallbackName = companyNameMapping[symbol.toUpperCase()];
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] ✅ Using fallback company name for ${symbol}: ${fallbackName}`);
      companyNameCache.set(symbol, fallbackName);
      enforceCacheCap(companyNameCache);
      return fallbackName;
    } else {
      if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] ⚠️ No fallback name found for ${symbol}, using symbol`);
      // Final fallback to symbol
      companyNameCache.set(symbol, symbol.toUpperCase());
      enforceCacheCap(companyNameCache);
      return symbol.toUpperCase();
    }
  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Failed to get company name for ${symbol}:`, error.message);

    // Try fallback mapping first
    if (companyNameMapping[symbol.toUpperCase()]) {
      const fallbackName = companyNameMapping[symbol.toUpperCase()];
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] ✅ Using fallback company name for ${symbol}: ${fallbackName}`);
      companyNameCache.set(symbol, fallbackName);
      enforceCacheCap(companyNameCache);
      return fallbackName;
    } else {
      if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] ⚠️ No fallback name found for ${symbol}, using symbol`);
      // Final fallback to symbol
      companyNameCache.set(symbol, symbol.toUpperCase());
      enforceCacheCap(companyNameCache);
      return symbol.toUpperCase();
    }
  }
};

// ---- Demo / sample data generators (used when Alpaca is unavailable) ----

// Deterministic-ish base price seeded from the symbol so demo data is stable per symbol
const demoBasePrice = (symbol) => {
  const s = (symbol || 'XXXX').toUpperCase();
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) % 100000;
  }
  // Range roughly $20 - $520
  return parseFloat((20 + (hash % 500)).toFixed(2));
};

// Generate a plausible sample quote when Alpaca is unavailable
const generateDemoQuote = (symbol) => {
  const sym = (symbol || '').toUpperCase();
  const basePrice = demoBasePrice(sym);
  const change = parseFloat(((Math.random() - 0.5) * (basePrice * 0.03)).toFixed(2));
  const price = parseFloat((basePrice + change).toFixed(2));
  const changePercent = ((change / basePrice) * 100).toFixed(2);
  const volume = Math.floor(Math.random() * 10000000) + 1000000;

  return {
    symbol: sym,
    name: companyNameMapping[sym] || sym,
    price,
    change,
    changePercent,
    volume,
    timestamp: new Date().toISOString(),
    source: 'demo',
    hasHistoricalData: true,
    hasVolumeData: true
  };
};

// Generate plausible sample candles for a symbol/timeframe
const generateDemoCandles = (symbol, timeframe, limit, start, end) => {
  const basePrice = demoBasePrice(symbol);

  let intervalMs;
  switch (timeframe) {
    case '1m': intervalMs = 60 * 1000; break;
    case '5m': intervalMs = 5 * 60 * 1000; break;
    case '15m': intervalMs = 15 * 60 * 1000; break;
    case '1h': intervalMs = 60 * 60 * 1000; break;
    case '4h': intervalMs = 4 * 60 * 60 * 1000; break;
    case '1d': intervalMs = 24 * 60 * 60 * 1000; break;
    case '1w': intervalMs = 7 * 24 * 60 * 60 * 1000; break;
    case '1M': intervalMs = 30 * 24 * 60 * 60 * 1000; break;
    default: intervalMs = 24 * 60 * 60 * 1000;
  }

  const candles = [];
  let currentPrice = basePrice;

  if (start && end) {
    const startTsSec = Math.floor(new Date(start + 'T00:00:00Z').getTime() / 1000);
    const endTsSec = Math.floor(new Date(end + 'T23:59:59Z').getTime() / 1000);
    const totalSpanMs = Math.max(0, (endTsSec - startTsSec) * 1000);
    const steps = Math.max(1, Math.min(limit, Math.floor(totalSpanMs / intervalMs) + 1));
    for (let i = 0; i < steps; i++) {
      const timeMs = (startTsSec * 1000) + (i * intervalMs);
      const priceChange = (Math.random() - 0.5) * (basePrice * 0.02);
      currentPrice = Math.max(currentPrice + priceChange, basePrice * 0.8);
      const open = currentPrice;
      const high = open + Math.random() * (basePrice * 0.01);
      const low = open - Math.random() * (basePrice * 0.01);
      const close = open + (Math.random() - 0.5) * (basePrice * 0.005);
      const volume = Math.floor(Math.random() * 10000000) + 1000000;
      candles.push({
        timestamp: Math.floor(timeMs / 1000),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume
      });
    }
  } else {
    const now = new Date();
    for (let i = limit - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * intervalMs));
      const priceChange = (Math.random() - 0.5) * (basePrice * 0.02);
      currentPrice = Math.max(currentPrice + priceChange, basePrice * 0.8);
      const open = currentPrice;
      const high = open + Math.random() * (basePrice * 0.01);
      const low = open - Math.random() * (basePrice * 0.01);
      const close = open + (Math.random() - 0.5) * (basePrice * 0.005);
      const volume = Math.floor(Math.random() * 10000000) + 1000000;
      candles.push({
        timestamp: Math.floor(time.getTime() / 1000),
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume
      });
    }
  }

  return {
    symbol,
    timeframe,
    candles,
    source: 'demo',
    lastUpdated: new Date().toISOString()
  };
};

// Generate sample search results from the known company mapping
const generateDemoSearchResults = (query) => {
  const q = (query || '').toLowerCase().trim();
  const matches = Object.keys(companyNameMapping).filter((sym) => {
    return sym.toLowerCase().includes(q) || companyNameMapping[sym].toLowerCase().includes(q);
  });
  const symbols = (matches.length > 0 ? matches : Object.keys(companyNameMapping)).slice(0, 10);
  return symbols.map((sym) => generateDemoQuote(sym));
};

// Get stock quote - REST API for everything
const getStockQuote = async (symbol) => {
  try {
    // Graceful demo fallback when Alpaca keys are missing/placeholder
    if (!hasAlpacaKeys()) {
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] Quote for ${symbol}: using demo data (no Alpaca keys)`);
      return generateDemoQuote(symbol);
    }

    if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📡 Using REST API for ${symbol} (WebSocket disabled)`);

    // Use REST API for non-FAANG stocks or when WebSocket fails
    return await getStockQuoteFromREST(symbol);

  } catch (error) {
    console.error(`[${getTimestamp()}] Error fetching data for ${symbol}:`, error.message);
    // Graceful demo fallback on any Alpaca failure
    if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] Quote for ${symbol}: falling back to demo data`);
    return generateDemoQuote(symbol);
  }
};

// Get previous close price from REST API
const getPreviousClose = async (symbol) => {
  const headers = {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
  };

  // Try multiple approaches to get real historical data
  const approaches = [
    // Approach 1: Try to get yesterday's daily bar
    async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const response = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/bars`, {
        headers,
        timeout: EXTERNAL_TIMEOUT_MS,
        params: {
          start: yesterdayStr,
          end: yesterdayStr,
          timeframe: '1Day',
          limit: 1,
          feed: 'sip',
          adjustment: 'split'
        }
      });

      const bars = response.data.bars;
      if (bars && bars.length > 0) {
        if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📊 Previous close for ${symbol}: $${bars[0].c} (from yesterday's bar)`);
        return bars[0].c;
      }
      throw new Error('No bars data available');
    },

    // Approach 2: Try to get the last 5 days of bars and find the most recent
    async () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 1);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5);
      
      const response = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/bars`, {
        headers,
        timeout: EXTERNAL_TIMEOUT_MS,
        params: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          timeframe: '1Day',
          limit: 5,
          feed: 'sip',
          adjustment: 'split'
        }
      });

      const bars = response.data.bars;
      if (bars && bars.length > 0) {
        const lastBar = bars[bars.length - 1];
        if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📊 Previous close for ${symbol}: $${lastBar.c} (from historical bars)`);
        return lastBar.c;
      }
      throw new Error('No historical bars available');
    },

    // Approach 3: Try to get the last trade from yesterday
    async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

      const response = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/trades`, {
        headers,
        timeout: EXTERNAL_TIMEOUT_MS,
        params: {
          start: yesterdayStr,
          end: yesterdayStr,
          limit: 1,
          feed: 'sip'
        }
      });

      const trades = response.data.trades;
      if (trades && trades.length > 0) {
        const lastTrade = trades[trades.length - 1];
        if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📊 Previous close for ${symbol}: $${lastTrade.p} (from yesterday's last trade)`);
        return lastTrade.p;
      }
      throw new Error('No yesterday trades available');
    },

    // Approach 4: Try to get today's bars to calculate intraday change
    async () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const response = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/bars`, {
        headers,
        timeout: EXTERNAL_TIMEOUT_MS,
        params: {
          start: todayStr,
          end: todayStr,
          timeframe: '1Min',
          limit: 100,
          feed: 'sip',
          adjustment: 'split'
        }
      });

      const bars = response.data.bars;
      if (bars && bars.length > 0) {
        // Use the first bar of the day (open) as previous close for intraday change
        const openBar = bars[0];
        if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📊 Intraday open for ${symbol}: $${openBar.o} (from today's bars)`);
        return openBar.o;
      }
      throw new Error('No today bars available');
    },

    // Approach 5: Try to get recent bars (last few days) to calculate change
    async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days
      
      const response = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/bars`, {
        headers,
        timeout: EXTERNAL_TIMEOUT_MS,
        params: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          timeframe: '1Day',
          limit: 7,
          feed: 'sip',
          adjustment: 'split'
        }
      });

      const bars = response.data.bars;
      if (bars && bars.length >= 2) {
        // Use the second-to-last bar as previous close
        const previousBar = bars[bars.length - 2];
        if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📊 Previous close for ${symbol}: $${previousBar.c} (from recent bars)`);
        return previousBar.c;
      }
      throw new Error('No recent bars available');
    },

    // Approach 6: Try Yahoo Finance as fallback for percentage change
    async () => {
      try {
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`, {
          timeout: EXTERNAL_TIMEOUT_MS
        });
        const data = response.data;

        if (data.chart && data.chart.result && data.chart.result[0]) {
          const result = data.chart.result[0];
          const timestamps = result.timestamp;
          const closes = result.indicators.quote[0].close;

          if (closes && closes.length >= 2) {
            const currentClose = closes[closes.length - 1];
            const previousClose = closes[closes.length - 2];

            if (currentClose && previousClose) {
              if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📊 Previous close for ${symbol}: $${previousClose} (from Yahoo Finance)`);
              return previousClose;
            }
          }
        }
        throw new Error('No Yahoo Finance data available');
      } catch (yahooError) {
        if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] ⚠️ Yahoo Finance failed for ${symbol}:`, yahooError.message);
        throw new Error('Yahoo Finance data not available');
      }
    },

    // Approach 7: No fallback - be honest about not having historical data
    async () => {
      throw new Error('Historical data not available with current subscription - cannot calculate change');
    }
  ];

  // Try each approach until one works
  for (let i = 0; i < approaches.length; i++) {
    try {
      const result = await approaches[i]();
      return result;
    } catch (error) {
      if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] ⚠️ Approach ${i + 1} failed for ${symbol}:`, error.message);
      if (i === approaches.length - 1) {
        // This was the last approach, throw the error
        throw new Error(`All approaches failed to get previous close for ${symbol}`);
      }
    }
  }
};

// Get stock quote using REST API (fallback method)
const getStockQuoteFromREST = async (symbol) => {
  try {
    // Check if Alpaca API keys are configured; fall back to demo data otherwise
    if (!hasAlpacaKeys()) {
      return generateDemoQuote(symbol);
    }

    const headers = {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
    };

    // Get current price from latest trade
    let tradeResponse;
    try {
      tradeResponse = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/trades/latest`, {
        headers,
        timeout: EXTERNAL_TIMEOUT_MS
      });
    } catch (tradeError) {
      console.error(`[${getTimestamp()}] ❌ Alpaca API error for ${symbol}:`, tradeError.message);
      if (VERBOSE_LOGS && tradeError.response) {
        console.error(`[${getTimestamp()}]    Status: ${tradeError.response.status}`);
      }
      throw new Error(`Failed to fetch trade data for ${symbol}: ${tradeError.message}`);
    }

    const trade = tradeResponse.data;
    if (!trade || !trade.trade) {
      throw new Error(`No trade data available for ${symbol}`);
    }

    const currentPrice = trade.trade.p;
    const timestamp = trade.trade.t;

  // Get daily volume
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  let dailyVolume = 0;
  
  try {
    const barsResponse = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/bars`, {
      headers,
      timeout: EXTERNAL_TIMEOUT_MS,
      params: {
        start: todayStr,
        end: todayStr,
        timeframe: '1Day',
        limit: 1,
        feed: 'sip'
      }
    });

    const bars = barsResponse.data.bars;
    if (bars && bars.length > 0) {
      dailyVolume = bars[0].v;
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📊 ${symbol} daily volume (REST): ${dailyVolume.toLocaleString()}`);
    }
  } catch (barsError) {
    if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] ⚠️ Failed to get daily volume for ${symbol}:`, barsError.message);
    // Use trade volume as fallback only if available from API
    dailyVolume = trade.trade.s || null;
  }

            // Get previous close
          let change = 0;
          let changePercent = "0.00";
          
          try {
            const previousClose = await getPreviousClose(symbol);
            change = currentPrice - previousClose;
            changePercent = ((change / previousClose) * 100).toFixed(2);
          } catch (prevCloseError) {
            if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] ⚠️ Could not calculate change for ${symbol}:`, prevCloseError.message);
            // Be honest about not having historical data
            change = null;
            changePercent = "N/A";
          }

            if (VERBOSE_LOGS) {
              if (change !== null) {
                console.log(`[${getTimestamp()}] ${symbol} (REST API): $${currentPrice} (${change >= 0 ? '+' : ''}${changePercent}%) - Volume: ${dailyVolume.toLocaleString()}`);
              } else {
                console.log(`[${getTimestamp()}] ${symbol} (REST API): $${currentPrice} (change: N/A - no historical data) - Volume: ${dailyVolume.toLocaleString()}`);
              }
            }
  
    // Get company name from Alpaca API
    const companyName = await getCompanyName(symbol);
      
    return {
      symbol: symbol.toUpperCase(),
      name: companyName,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: dailyVolume,
      timestamp: timestamp,
      source: 'rest',
      hasHistoricalData: change !== null,
      hasVolumeData: dailyVolume !== null
    };
  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Error in getStockQuoteFromREST for ${symbol}:`, error.message);
    throw error; // Re-throw to be handled by the route handler
  }
};

// AI-powered search stocks with multiple data sources and intelligent matching
// The Alpaca active US-equity universe (~11k assets, multi-MB payload) changes
// rarely. Reuse the module-level `alpacaAssetsCache` (declared near the top) so we
// don't re-fetch the whole list on every keystroke — the old searchStocks declared
// that cache but never actually consulted it.
const getAlpacaAssets = async () => {
  const now = Date.now();
  if (alpacaAssetsCache.data && alpacaAssetsCache.timestamp &&
      (now - alpacaAssetsCache.timestamp) < alpacaAssetsCache.ttl) {
    return alpacaAssetsCache.data;
  }
  const response = await axios.get('https://paper-api.alpaca.markets/v2/assets', {
    headers: {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
    },
    timeout: EXTERNAL_TIMEOUT_MS,
    params: { status: 'active', asset_class: 'us_equity' }
  });
  alpacaAssetsCache = { ...alpacaAssetsCache, data: response.data, timestamp: now };
  return response.data;
};

// Pass `withQuotes: false` to return lightweight { symbol, name, matchType } matches
// without the expensive per-symbol quote lookups. Autocomplete uses this path — its
// dropdown only renders symbol/name, and the full quote is fetched separately when
// the user actually selects a suggestion.
const searchStocks = async (query, { withQuotes = true } = {}) => {
  try {
    // Check if Alpaca API keys are configured; fall back to demo results otherwise
    if (!hasAlpacaKeys()) {
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] Search: using demo data (no Alpaca keys)`);
      return generateDemoSearchResults(query);
    }

    const queryLower = query.toLowerCase().trim();

    // Step 1: Get the (cached) Alpaca asset universe for comprehensive search
    let alpacaAssets = [];
    try {
      alpacaAssets = await getAlpacaAssets();
    } catch (alpacaError) {
      if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] Failed to fetch Alpaca assets:`, alpacaError.message);
      // Graceful demo fallback so the UI still works
      return generateDemoSearchResults(query);
    }

    // Step 2: Professional search algorithm (like Robinhood/Fidelity)
    const searchResults = [];

    for (const asset of alpacaAssets) {
      const symbolLower = asset.symbol.toLowerCase();
      const nameLower = asset.name.toLowerCase();

      let score = 0;
      let matchType = null;

      // Exact symbol match (highest priority)
      if (symbolLower === queryLower) {
        score = 10000;
        matchType = 'exact_symbol';
      }
      // Symbol starts with query (very high priority)
      else if (symbolLower.startsWith(queryLower)) {
        score = 9000;
        matchType = 'symbol_starts';
      }
      // Company name starts with query (high priority)
      else if (nameLower.startsWith(queryLower)) {
        score = 8000;
        matchType = 'name_starts';
      }
      // Company name contains query as whole word
      else {
        const nameWords = nameLower.split(/\s+/);
        if (nameWords.some(word => word === queryLower)) {
          score = 7000;
          matchType = 'name_word';
        }
        // Company name contains query word that starts with query
        else if (nameWords.some(word => word.startsWith(queryLower))) {
          score = 6000;
          matchType = 'name_word_starts';
        }
        // Company name contains query (lower priority)
        else if (nameLower.includes(queryLower)) {
          score = 5000;
          matchType = 'name_contains';
        }
        // Symbol contains query (lower priority)
        else if (symbolLower.includes(queryLower)) {
          score = 4000;
          matchType = 'symbol_contains';
        }
      }

      if (matchType) {
        // Professional relevance scoring (like major platforms)

        // Bonus for shorter symbols (more recognizable companies)
        score += Math.max(0, 15 - symbolLower.length) * 50;

        // Bonus for common company keywords (established companies)
        const establishedKeywords = ['inc', 'corp', 'company', 'ltd', 'llc', 'plc', 'sa', 'ag', 'co', 'corporation'];
        if (establishedKeywords.some(keyword => nameLower.includes(keyword))) {
          score += 200;
        }

        // Penalty for ETF/Index keywords (prioritize actual companies)
        const etfKeywords = ['etf', 'fund', 'trust', 'shares', 'strategy', 'index', 'portfolio'];
        if (etfKeywords.some(keyword => nameLower.includes(keyword))) {
          score -= 2000;
        }

        // Penalty for very long company names (less recognizable)
        if (nameLower.length > 50) {
          score -= 300;
        }

        // Bonus for companies with recognizable brand names
        const brandKeywords = ['apple', 'microsoft', 'google', 'amazon', 'tesla', 'netflix', 'facebook', 'meta', 'nvidia', 'intel', 'amd'];
        if (brandKeywords.some(brand => nameLower.includes(brand))) {
          score += 500;
        }

        searchResults.push({
          symbol: asset.symbol,
          name: asset.name,
          matchType,
          relevanceScore: score
        });
      }
    }

    // Step 3: Sort by relevance score (highest first)
    searchResults.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }

      // For same score, prioritize shorter symbols
      if (a.symbol.length !== b.symbol.length) {
        return a.symbol.length - b.symbol.length;
      }

      // Finally alphabetically
      return a.symbol.toLowerCase().localeCompare(b.symbol.toLowerCase());
    });

    const topAssets = searchResults.slice(0, 10);

    // Fast path: autocomplete only needs symbol/name/matchType, so skip the
    // per-symbol quote lookups entirely (this is the bulk of the old latency).
    if (!withQuotes) {
      return topAssets.map(({ symbol, name, matchType }) => ({ symbol, name, matchType }));
    }

    // Step 4: Get quotes for top results — fetched in parallel, not sequentially.
    const finalResults = await Promise.all(topAssets.map(async (asset) => {
      try {
        return await getStockQuoteFromREST(asset.symbol);
      } catch (quoteError) {
        if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] Failed to get quote for ${asset.symbol}:`, quoteError.message);
        // Include the asset without quote data
        return {
          symbol: asset.symbol,
          name: asset.name,
          price: null,
          change: null,
          changePercent: null,
          volume: null,
          timestamp: null,
          hasHistoricalData: false,
          hasVolumeData: false
        };
      }
    }));

    return finalResults;
  } catch (error) {
    console.error(`[${getTimestamp()}] Error searching stocks:`, error);
    // Graceful demo fallback so the UI still works
    return generateDemoSearchResults(query);
  }
};

// Cache for market data to reduce API calls
let marketDataCache = {
  data: null,
  timestamp: null,
  ttl: 30000 // 30 seconds cache
};

// Cache for chart data to reduce API calls.
// Map keyed by cacheKey -> { data, timestamp }; capped with insertion-order eviction.
const chartDataCache = new Map();
const CHART_CACHE_TTL = 300000; // 5 minutes cache for chart data (increased due to larger datasets)

// Get market data (FAANG companies) with caching
router.get('/market', quoteLimiter, async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (marketDataCache.data && marketDataCache.timestamp &&
        (now - marketDataCache.timestamp) < marketDataCache.ttl) {
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📦 Returning cached FAANG market data`);
      return res.json({
        success: true,
        marketData: marketDataCache.data,
        cached: true
      });
    }

    const faangStocks = ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL'];
    const marketData = [];

    if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 🔄 Fetching fresh FAANG market data for:`, faangStocks.join(', '));

    // Use Promise.all to fetch all stocks concurrently (faster, fewer API calls)
    const quotePromises = faangStocks.map(async (symbol) => {
      try {
      const quote = await getStockQuote(symbol);
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] ✅ ${symbol}: $${quote.price} (${quote.changePercent}%)`);
        return quote;
      } catch (quoteError) {
        if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] ❌ Failed to get quote for ${symbol}:`, quoteError.message);
        return null;
      }
    });

    const results = await Promise.all(quotePromises);
    const validResults = results.filter(quote => quote !== null);

    if (validResults.length === 0) {
      throw new Error('No market data available');
    }

    // Update cache
    marketDataCache.data = validResults;
    marketDataCache.timestamp = now;

    if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📊 FAANG market data summary:`, validResults.map(q => `${q.symbol}: ${q.changePercent}%`).join(', '));

    res.json({
      success: true,
      marketData: validResults,
      cached: false
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Error getting market data:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to get market data: ${error.message}`
    });
  }
});

// Get historical chart data for a stock
router.get('/chart/:symbol', quoteLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1D', limit = 500, start, end } = req.query;

    if (VERBOSE_LOGS) {
      console.log(`[${getTimestamp()}] 📈 Fetching chart data for ${symbol} (${timeframe})` + (start && end ? ` range ${start}→${end}` : ''));
      console.log(`[${getTimestamp()}] 📊 Request details:`, { symbol, timeframe, limit, start, end });
    }

    // Check cache first
    const cacheKey = `${symbol}_${timeframe}_${start || 'NA'}_${end || 'NA'}`;
    const now = Date.now();
    const cachedEntry = chartDataCache.get(cacheKey);
    if (cachedEntry && (now - cachedEntry.timestamp) < CHART_CACHE_TTL) {
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📦 Returning cached chart data for ${symbol}`);
      const cachedChart = cachedEntry.data;
      return res.json({
        success: true,
        chartData: cachedChart,
        cached: true,
        ...(cachedChart && cachedChart.source === 'demo' ? { demo: true } : {})
      });
    }

    // Generate historical data with optional date slicing
    if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 🔍 Calling generateHistoricalData for ${symbol}`);
    const chartData = await generateHistoricalData(symbol, timeframe, parseInt(limit), start, end);

    // Update cache (capped, insertion-order eviction)
    chartDataCache.set(cacheKey, { data: chartData, timestamp: now });
    enforceCacheCap(chartDataCache);

    if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] ✅ Chart data generated for ${symbol}: ${chartData.candles.length} candles`);

    res.json({
      success: true,
      chartData,
      cached: false,
      ...(chartData.source === 'demo' ? { demo: true } : {})
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Error getting chart data:`, error);
    // Graceful demo fallback so the UI still works
    const { symbol } = req.params;
    const { timeframe = '1D', limit = 500, start, end } = req.query;
    const chartData = generateDemoCandles(symbol, timeframe, parseInt(limit), start, end);
    res.json({
      success: true,
      chartData,
      cached: false,
      demo: true
    });
  }
});

// Get real-time chart updates
router.get('/chart/:symbol/live', quoteLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;

    if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 🔄 Getting live chart update for ${symbol}`);

    // Get current quote
    const quote = await getStockQuote(symbol);
    
    // Generate real-time candle data
    const liveData = generateLiveCandleData(quote);
    
    res.json({
      success: true,
      liveData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Error getting live chart data:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to get live chart data: ${error.message}`
    });
  }
});

// Helper function to generate historical data
async function generateHistoricalData(symbol, timeframe, limit, start, end) {
  try {
    if (VERBOSE_LOGS) {
      console.log(`[${getTimestamp()}] 🔍 Fetching real historical data for ${symbol} (${timeframe})`);
      console.log(`[${getTimestamp()}] 📅 Date range: ${start} → ${end}, limit: ${limit}`);
    }

    // Map frontend timeframes to Alpaca timeframes with full year coverage
    let alpacaTimeframe;
    let yahooInterval;
    let yahooRange;
    
    switch (timeframe) {
      case '1m':
        alpacaTimeframe = '1Min';
        yahooInterval = '1m';
        yahooRange = '60d'; // 60 days for minute data
        break;
      case '5m':
        alpacaTimeframe = '5Min';
        yahooInterval = '5m';
        yahooRange = '60d'; // 60 days for 5-minute data
        break;
      case '15m':
        alpacaTimeframe = '15Min';
        yahooInterval = '15m';
        yahooRange = '60d'; // 60 days for 15-minute data
        break;
      case '1h':
        alpacaTimeframe = '1Hour';
        yahooInterval = '1h';
        yahooRange = '2y'; // 2 years for hourly data
        break;
      case '4h':
        alpacaTimeframe = '4Hour';
        yahooInterval = '1h';
        yahooRange = '2y'; // 2 years for 4-hour data
        break;
      case '1d':
        alpacaTimeframe = '1Day';
        yahooInterval = '1d';
        yahooRange = '10y'; // extend range so historical windows like 2020 are available
        break;
      case '1w':
        alpacaTimeframe = '1Week';
        yahooInterval = '1d';
        yahooRange = '5y'; // 5 years for weekly data
        break;
      case '1M':
        alpacaTimeframe = '1Month';
        yahooInterval = '1d';
        yahooRange = '10y'; // extend range for monthly as well
        break;
      default:
        alpacaTimeframe = '1Day';
        yahooInterval = '1d';
        yahooRange = '5y'; // 5 years default
    }
    
    // Try Alpaca API first
    if (hasAlpacaKeys()) {
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 🔑 Alpaca API keys found, trying Alpaca first...`);
      try {
        const headers = {
          'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
        };
        
        // Get maximum historical data for all timeframes
        let alpacaLimit;
        if (timeframe === '1m' || timeframe === '5m' || timeframe === '15m') {
          alpacaLimit = Math.min(limit * 10, 2000); // Much more data for minute intervals
        } else if (timeframe === '1h' || timeframe === '4h') {
          alpacaLimit = Math.min(limit * 8, 1500); // More data for hourly intervals
        } else {
          alpacaLimit = Math.min(limit * 5, 1000); // Standard for daily+ intervals
        }
        // If a date range is provided, prefer start/end over limit when calling Alpaca
        const alpacaParams = start && end 
          ? `timeframe=${alpacaTimeframe}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
          : `timeframe=${alpacaTimeframe}&limit=${alpacaLimit}`;
        if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📡 Alpaca URL params: ${alpacaParams}`);
        const response = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/bars?${alpacaParams}&adjustment=split`, {
          headers,
          timeout: EXTERNAL_TIMEOUT_MS
        });
        
        if (response.data.bars && response.data.bars.length > 0) {
          const candles = response.data.bars.map(bar => ({
            timestamp: Math.floor(new Date(bar.t).getTime() / 1000),
            open: parseFloat(bar.o),
            high: parseFloat(bar.h),
            low: parseFloat(bar.l),
            close: parseFloat(bar.c),
            volume: parseInt(bar.v)
          }));
          
          let slicedCandles = candles;
          if (start && end) {
            const startTs = Math.floor(new Date(start + 'T00:00:00Z').getTime() / 1000);
            const endTs = Math.floor(new Date(end + 'T23:59:59Z').getTime() / 1000);
            slicedCandles = candles.filter(c => c.timestamp >= startTs && c.timestamp <= endTs);
          }
          if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] ✅ Got ${slicedCandles.length} candles from Alpaca for ${symbol}`);

          return {
            symbol,
            timeframe,
            candles: slicedCandles,
            lastUpdated: new Date().toISOString()
          };
        }
      } catch (alpacaError) {
        if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] ⚠️ Alpaca API failed for ${symbol}: ${alpacaError.message}`);
      }
    } else {
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] ⚠️ No Alpaca API keys found, skipping Alpaca API call`);
    }

    // Fallback to Yahoo Finance API
    try {
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 🔄 Trying Yahoo Finance API for ${symbol}...`);
      // Get maximum historical data for all timeframes
      const yahooRangeAdjusted = yahooRange; // Use the full year range we set above
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📡 Yahoo interval: ${yahooInterval}, range: ${yahooRangeAdjusted}`);
        // For Yahoo, if a specific date range is requested, switch to explicit period1/period2
        const yahooUrl = start && end
          ? `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${yahooInterval}&period1=${Math.floor(new Date(start + 'T00:00:00Z').getTime() / 1000)}&period2=${Math.floor(new Date(end + 'T23:59:59Z').getTime() / 1000)}`
          : `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${yahooInterval}&range=${yahooRangeAdjusted}`;
        if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 🌐 Yahoo URL: ${yahooUrl}`);
        const yahooResponse = await axios.get(yahooUrl, {
        timeout: EXTERNAL_TIMEOUT_MS
      });
      
      if (yahooResponse.data.chart.result && yahooResponse.data.chart.result[0]) {
        const result = yahooResponse.data.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        const opens = quotes.open;
        const highs = quotes.high;
        const lows = quotes.low;
        const closes = quotes.close;
        const volumes = quotes.volume;

        // Build split events list to adjust historical OHLC like TradingView ADJ
        const splitEventsRaw = (result.events && result.events.splits) ? result.events.splits : {};
        const splitEvents = Object.values(splitEventsRaw).map((ev) => {
          const numerator = typeof ev.numerator === 'number' ? ev.numerator : parseFloat((ev.splitRatio || '1/1').split('/')[0]);
          const denominator = typeof ev.denominator === 'number' ? ev.denominator : parseFloat((ev.splitRatio || '1/1').split('/')[1]);
          const ts = (typeof ev.date === 'number' ? ev.date : (typeof ev.timestamp === 'number' ? ev.timestamp : null));
          return ts ? { ts, factor: denominator / numerator } : null;
        }).filter(Boolean).sort((a, b) => a.ts - b.ts);

        const computeAdjustmentFactor = (ts) => {
          if (!splitEvents.length) return 1;
          let f = 1;
          for (const ev of splitEvents) {
            if (ts < ev.ts) f *= ev.factor; // apply future splits to past candles
          }
          return f;
        };

        const candles = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (opens[i] !== null && highs[i] !== null && lows[i] !== null && closes[i] !== null) {
            const ts = timestamps[i];
            const adj = computeAdjustmentFactor(ts);
            candles.push({
              timestamp: ts,
              open: parseFloat((opens[i] * adj).toFixed(6)),
              high: parseFloat((highs[i] * adj).toFixed(6)),
              low: parseFloat((lows[i] * adj).toFixed(6)),
              close: parseFloat((closes[i] * adj).toFixed(6)),
              volume: volumes[i] ? parseInt(volumes[i]) : 0
            });
          }
        }
        
        // Get maximum historical data for all intervals
        let targetLimit;
        if (timeframe === '1m' || timeframe === '5m' || timeframe === '15m') {
          targetLimit = Math.max(limit, 500); // Much more data for minute intervals
        } else if (timeframe === '1h' || timeframe === '4h') {
          targetLimit = Math.max(limit, 300); // More data for hourly intervals
        } else {
          targetLimit = Math.max(limit, 100); // Standard for daily+ intervals
        }
        let limitedCandles = candles.slice(-targetLimit);
        if (start && end) {
          const startTs = Math.floor(new Date(start + 'T00:00:00Z').getTime() / 1000);
          const endTs = Math.floor(new Date(end + 'T23:59:59Z').getTime() / 1000);
          limitedCandles = candles.filter(c => c.timestamp >= startTs && c.timestamp <= endTs);
        }
        
        if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] ✅ Got ${limitedCandles.length} candles from Yahoo Finance for ${symbol}`);

        return {
          symbol,
          timeframe,
          candles: limitedCandles,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (yahooError) {
      if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] ⚠️ Yahoo Finance API failed for ${symbol}: ${yahooError.message}`);
    }

    // Final fallback - generate realistic sample (demo) data
    if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] ⚠️ Using fallback demo data for ${symbol}`);

    try {
      const demoData = generateDemoCandles(symbol, timeframe, limit, start, end);
      if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 🎭 Generated ${demoData.candles.length} demo candles for ${symbol} (${timeframe})`);
      return demoData;
    } catch (error) {
      console.error(`[${getTimestamp()}] Error generating fallback data for ${symbol}:`, error);
      throw new Error(`Failed to generate chart data for ${symbol}`);
    }
  } catch (error) {
    console.error(`[${getTimestamp()}] Error in generateHistoricalData for ${symbol}:`, error);
    // Graceful demo fallback so the UI still works
    return generateDemoCandles(symbol, timeframe, limit, start, end);
  }
}

// Helper function to generate live candle data
function generateLiveCandleData(quote) {
  const now = new Date();
  const basePrice = parseFloat(quote.price);
  
  return {
    timestamp: Math.floor(now.getTime() / 1000),
    open: basePrice + (Math.random() - 0.5) * 2,
    high: basePrice + Math.random() * 3,
    low: basePrice - Math.random() * 3,
    close: basePrice + (Math.random() - 0.5) * 1.5,
    volume: Math.floor(Math.random() * 100000) + 50000
  };
}

// Order validation schema
const { z } = require('zod');

const orderSchema = z.object({
  symbol: z.string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol too long')
    .regex(/^[A-Z]+$/, 'Symbol must be uppercase letters only'),
  shares: z.number()
    .positive('Shares must be positive')
    .max(100000, 'Maximum 100,000 shares per order'),
  type: z.enum(['market', 'limit']).optional().default('market'),
  limitPrice: z.number().positive().optional()
});

/**
 * Check if trading is allowed (paper mode only by default)
 */
const checkTradingAllowed = (req) => {
  const alpacaEnv = req.app.locals.alpacaEnv || 'paper';
  if (alpacaEnv === 'live') {
    // Extra safety: require explicit confirmation for live trading
    if (process.env.ALLOW_LIVE_TRADING !== 'true') {
      throw new Error('Live trading is disabled. Set ALLOW_LIVE_TRADING=true to enable.');
    }
  }
  return true;
};

// Buy stock
router.post('/buy', authenticateToken, requireApproved, async (req, res) => {
  try {
    // Validate trading is allowed
    checkTradingAllowed(req);
    
    // Validate order
    const parsed = orderSchema.safeParse({
      ...req.body,
      symbol: req.body.symbol?.toUpperCase()
    });
    
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || 'Invalid order'
      });
    }
    
    const { symbol, shares, type, limitPrice } = parsed.data;
    const userId = req.user.userId;

    // Get current quote FIRST (network), OUTSIDE the lock
    const quote = await getStockQuote(symbol);
    const price = type === 'limit' && limitPrice ? limitPrice : quote.price;
    const totalCost = price * shares;

    // Mutate balance + positions atomically inside the per-user lock
    const result = await req.app.locals.storage.withUserLock(userId, async (tx) => {
      // Read (or init) the portfolio inside the lock
      let portfolio = await tx.getPortfolio(userId);
      if (!portfolio) {
        portfolio = { balance: 10000, positions: [], totalValue: 10000 };
      }

      // Re-check funds inside the lock
      if (portfolio.balance < totalCost) {
        return {
          error: {
            status: 400,
            body: {
              success: false,
              message: `Insufficient funds. Need $${totalCost.toFixed(2)}, have $${portfolio.balance.toFixed(2)}`
            }
          }
        };
      }

      // Execute buy
      portfolio.balance -= totalCost;

      // Update or create position
      const existingPosition = portfolio.positions.find(p => p.symbol === symbol);
      if (existingPosition) {
        // Backwards compatibility: migrate avgCost to avgPrice if needed
        const currentAvgPrice = existingPosition.avgPrice ?? existingPosition.avgCost ?? price;

        // Average price calculation
        const totalShares = existingPosition.shares + shares;
        const totalValue = (existingPosition.shares * currentAvgPrice) + totalCost;
        existingPosition.avgPrice = totalValue / totalShares;
        existingPosition.shares = totalShares;
        existingPosition.currentPrice = price;
        existingPosition.change = quote.change || 0;
        existingPosition.changePercent = quote.changePercent || "0.00";

        // Clean up legacy field if it exists
        if (existingPosition.avgCost !== undefined) {
          delete existingPosition.avgCost;
        }
      } else {
        portfolio.positions.push({
          symbol,
          shares,
          avgPrice: price,
          currentPrice: price,
          change: quote.change || 0,
          changePercent: quote.changePercent || "0.00"
        });
      }

      // Update total value
      portfolio.totalValue = portfolio.balance + portfolio.positions.reduce((sum, p) =>
        sum + (p.shares * p.currentPrice), 0);
      portfolio.lastUpdated = new Date().toISOString();

      await tx.savePortfolio(userId, portfolio);

      // Record transaction
      await tx.addTransaction(userId, {
        id: `tx_${crypto.randomUUID()}`,
        type: 'buy',
        symbol,
        shares,
        price,
        total: totalCost,
        timestamp: new Date().toISOString()
      });

      return { portfolio };
    });

    if (result.error) {
      return res.status(result.error.status).json(result.error.body);
    }

    if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📈 BUY: ${userId} bought ${shares} ${symbol} @ $${price}`);

    res.json({
      success: true,
      message: `Bought ${shares} shares of ${symbol}`,
      order: { symbol, shares, price, total: totalCost },
      portfolio: result.portfolio
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Buy error:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to execute buy order'
    });
  }
});

// Sell stock
router.post('/sell', authenticateToken, requireApproved, async (req, res) => {
  try {
    // Validate trading is allowed
    checkTradingAllowed(req);
    
    // Validate order
    const parsed = orderSchema.safeParse({
      ...req.body,
      symbol: req.body.symbol?.toUpperCase()
    });
    
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || 'Invalid order'
      });
    }
    
    const { symbol, shares, type, limitPrice } = parsed.data;
    const userId = req.user.userId;

    // Get current quote FIRST (network), OUTSIDE the lock
    const quote = await getStockQuote(symbol);
    const price = type === 'limit' && limitPrice ? limitPrice : quote.price;
    const totalProceeds = price * shares;

    // Mutate balance + positions atomically inside the per-user lock
    const result = await req.app.locals.storage.withUserLock(userId, async (tx) => {
      // Read the portfolio inside the lock
      const portfolio = await tx.getPortfolio(userId);

      if (!portfolio) {
        return {
          error: {
            status: 400,
            body: { success: false, message: 'No portfolio found' }
          }
        };
      }

      // Re-check holdings inside the lock
      const position = portfolio.positions.find(p => p.symbol === symbol);
      if (!position || position.shares < shares) {
        return {
          error: {
            status: 400,
            body: {
              success: false,
              message: `Insufficient shares. Have ${position?.shares || 0} ${symbol}, trying to sell ${shares}`
            }
          }
        };
      }

      // Backwards compatibility: use avgPrice or legacy avgCost (capture before mutation)
      const positionAvgPrice = position.avgPrice ?? position.avgCost ?? price;

      // Execute sell
      portfolio.balance += totalProceeds;
      position.shares -= shares;
      position.currentPrice = price;
      // Update change data from current quote to prevent stale values
      position.change = quote.change || 0;
      position.changePercent = quote.changePercent || "0.00";

      // Remove position if fully sold
      if (position.shares === 0) {
        portfolio.positions = portfolio.positions.filter(p => p.symbol !== symbol);
      }

      // Update total value
      portfolio.totalValue = portfolio.balance + portfolio.positions.reduce((sum, p) =>
        sum + (p.shares * p.currentPrice), 0);
      portfolio.lastUpdated = new Date().toISOString();

      await tx.savePortfolio(userId, portfolio);

      // Record transaction
      await tx.addTransaction(userId, {
        id: `tx_${crypto.randomUUID()}`,
        type: 'sell',
        symbol,
        shares,
        price,
        total: totalProceeds,
        profit: (price - positionAvgPrice) * shares,
        timestamp: new Date().toISOString()
      });

      return { portfolio };
    });

    if (result.error) {
      return res.status(result.error.status).json(result.error.body);
    }

    if (VERBOSE_LOGS) console.log(`[${getTimestamp()}] 📉 SELL: ${userId} sold ${shares} ${symbol} @ $${price}`);

    res.json({
      success: true,
      message: `Sold ${shares} shares of ${symbol}`,
      order: { symbol, shares, price, total: totalProceeds },
      portfolio: result.portfolio
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Sell error:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to execute sell order'
    });
  }
});

// Get user portfolio
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    let portfolio = await req.app.locals.storage.getPortfolio(userId);

    if (!portfolio) {
      portfolio = await initializePortfolio(req, userId);
    }

    // Fetch current quotes FIRST (network), OUTSIDE the lock
    const quotesBySymbol = {};
    for (const position of portfolio.positions) {
      try {
        quotesBySymbol[position.symbol] = await getStockQuote(position.symbol);
      } catch (error) {
        if (VERBOSE_LOGS) console.warn(`[${getTimestamp()}] Failed to update price for ${position.symbol}`);
      }
    }

    // Apply price updates atomically inside the per-user lock
    const updatedPortfolio = await req.app.locals.storage.withUserLock(userId, async (tx) => {
      let pf = await tx.getPortfolio(userId);
      if (!pf) {
        pf = { balance: 10000, positions: [], totalValue: 10000 };
      }

      // Update current prices and change data
      for (const position of pf.positions) {
        const quote = quotesBySymbol[position.symbol];
        if (quote) {
          position.currentPrice = quote.price;
          position.change = quote.change || 0;
          position.changePercent = quote.changePercent || "0.00";
        }

        // Migrate legacy avgCost to avgPrice if needed
        if (position.avgCost !== undefined && position.avgPrice === undefined) {
          position.avgPrice = position.avgCost;
          delete position.avgCost;
        }
      }

      // Recalculate total value
      pf.totalValue = pf.balance + pf.positions.reduce((sum, p) =>
        sum + (p.shares * p.currentPrice), 0);

      await tx.savePortfolio(userId, pf);
      return pf;
    });

    res.json({
      success: true,
      portfolio: updatedPortfolio
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Portfolio error:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio'
    });
  }
});

// Get transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userTransactions = await req.app.locals.storage.getUserTransactions(userId) || [];

    res.json({
      success: true,
      transactions: userTransactions.sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      )
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Transactions error:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions'
    });
  }
});

// Get stock quote
router.get('/quote/:symbol', quoteLimiter, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const quote = await getStockQuote(symbol);
    
    res.json({
      success: true,
      quote
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Quote error for ${req.params.symbol}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get quote'
    });
  }
});

// Search stocks
router.get('/search', searchLimiter, async (req, res) => {
  try {
    const query = req.query.query || req.query.q;
    if (!query || query.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }

    // Reject overly long queries to prevent cache pollution / wasted work
    if (query.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({
        success: false,
        message: 'Search query too long'
      });
    }

    const results = await searchStocks(query);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Search error:`, error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search stocks'
    });
  }
});

// Autocomplete search
router.get('/autocomplete', searchLimiter, async (req, res) => {
  try {
    const query = req.query.query || req.query.q;
    if (!query || query.length < 1) {
      return res.json({ success: true, results: [] });
    }

    // Reject overly long queries to prevent cache pollution / wasted work
    if (query.length > MAX_QUERY_LENGTH) {
      return res.status(400).json({
        success: false,
        message: 'Search query too long'
      });
    }

    // Quick cached lookup for autocomplete
    const cacheKey = `autocomplete_${query.toLowerCase()}`;
    const now = Date.now();
    const cachedEntry = searchCache.get(cacheKey);
    if (cachedEntry && (now - cachedEntry.timestamp) < SEARCH_CACHE_DURATION) {
      return res.json({
        success: true,
        results: cachedEntry.data
      });
    }

    const results = await searchStocks(query, { withQuotes: false });
    const limitedResults = results.slice(0, 5); // Limit for autocomplete

    searchCache.set(cacheKey, { data: limitedResults, timestamp: now });
    enforceCacheCap(searchCache);

    res.json({
      success: true,
      results: limitedResults
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Autocomplete error:`, error);
    res.json({ success: true, results: [] }); // Return empty on error for autocomplete
  }
});

module.exports = router;
