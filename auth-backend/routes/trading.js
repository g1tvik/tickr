const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const AlpacaWebSocketClient = require('../websocket-client');

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

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Apply authentication to most trading routes, but allow some public endpoints

// File-based storage access
const getPortfolios = (req) => req.app.locals.fileStorage.getPortfolios();
const savePortfolios = (req, portfolios) => req.app.locals.fileStorage.savePortfolios(portfolios);
const getTransactions = (req) => req.app.locals.fileStorage.getTransactions();
const saveTransactions = (req, transactions) => req.app.locals.fileStorage.saveTransactions(transactions);

// Alpaca API configuration
const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY || 'demo',
  secretKey: process.env.ALPACA_SECRET_KEY || 'demo',
  paper: true, // Use paper trading (sandbox)
  usePolygon: true, // Use Polygon for real-time market data
  baseUrl: 'https://broker-api.sandbox.alpaca.markets' // Use sandbox endpoint
});

// Initialize portfolio for new users
const initializePortfolio = (req, userId) => {
  const portfolios = getPortfolios(req);
  
  if (!portfolios[userId]) {
    portfolios[userId] = {
      balance: 10000, // Starting with $10,000
      positions: [],
      totalValue: 10000,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    savePortfolios(req, portfolios);
  }
  
  // Initialize transactions if needed
  const transactions = getTransactions(req);
  if (!transactions[userId]) {
    transactions[userId] = [];
    saveTransactions(req, transactions);
  }
  
  return portfolios[userId];
};

// Cache for company names to reduce API calls
let companyNameCache = {};

// Cache for search results to improve performance
let searchCache = {};
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
    if (companyNameCache[symbol]) {
      return companyNameCache[symbol];
    }

    // Check if Alpaca API keys are configured
    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
      console.warn(`[${getTimestamp()}] Alpaca API keys not configured, using symbol as company name`);
      companyNameCache[symbol] = symbol.toUpperCase();
      return symbol.toUpperCase();
    }

    const headers = {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
    };

    // Use the working Alpaca Paper Trading API endpoint
          console.log(`[${getTimestamp()}] 🔍 Fetching company name for ${symbol} from Alpaca Paper Trading API...`);
    try {
      const response = await axios.get(`https://paper-api.alpaca.markets/v2/assets/${symbol}`, {
        headers
      });

              console.log(`[${getTimestamp()}] 📄 Alpaca Paper Trading API response for ${symbol}:`, JSON.stringify(response.data, null, 2));

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
        
        console.log(`[${getTimestamp()}] ✅ Found company name for ${symbol}: ${companyName}`);
        // Cache the company name
        companyNameCache[symbol] = companyName;
        return companyName;
      } else {
        console.warn(`[${getTimestamp()}] ⚠️ No company name found in Alpaca response for ${symbol}, checking fallback mapping`);
      }
    } catch (alpacaError) {
      console.error(`[${getTimestamp()}] ❌ Alpaca API failed for ${symbol}:`, alpacaError.message);
      if (alpacaError.response) {
        console.error(`[${getTimestamp()}]    Status: ${alpacaError.response.status}`);
        console.error(`[${getTimestamp()}]    Data:`, alpacaError.response.data);
      }
    }

    // If Alpaca API fails, use fallback mapping
    console.warn(`[${getTimestamp()}] ⚠️ Alpaca API failed for ${symbol}, checking fallback mapping`);
    if (companyNameMapping[symbol.toUpperCase()]) {
      const fallbackName = companyNameMapping[symbol.toUpperCase()];
      console.log(`[${getTimestamp()}] ✅ Using fallback company name for ${symbol}: ${fallbackName}`);
      companyNameCache[symbol] = fallbackName;
      return fallbackName;
    } else {
      console.warn(`[${getTimestamp()}] ⚠️ No fallback name found for ${symbol}, using symbol`);
      // Final fallback to symbol
      companyNameCache[symbol] = symbol.toUpperCase();
      return symbol.toUpperCase();
    }
  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Failed to get company name for ${symbol}:`, error.message);
    
    // Try fallback mapping first
    if (companyNameMapping[symbol.toUpperCase()]) {
      const fallbackName = companyNameMapping[symbol.toUpperCase()];
      console.log(`[${getTimestamp()}] ✅ Using fallback company name for ${symbol}: ${fallbackName}`);
      companyNameCache[symbol] = fallbackName;
      return fallbackName;
    } else {
      console.warn(`[${getTimestamp()}] ⚠️ No fallback name found for ${symbol}, using symbol`);
      // Final fallback to symbol
      companyNameCache[symbol] = symbol.toUpperCase();
      return symbol.toUpperCase();
    }
  }
};

// Get stock quote - WebSocket for FAANG, REST API for everything else
const getStockQuote = async (symbol) => {
  try {
    // Check if Alpaca API keys are configured
    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
      throw new Error('Alpaca API keys not configured. Please set ALPACA_API_KEY and ALPACA_SECRET_KEY in your .env file.');
    }

    // Define FAANG stocks that use WebSocket
    const faangStocks = ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL'];
    const isFaangStock = faangStocks.includes(symbol.toUpperCase());

    if (isFaangStock) {
      // Use WebSocket for FAANG stocks
      const ws = initializeWebSocket();
      
      // Give WebSocket a moment to receive data if it just connected
      if (ws.isConnected && ws.isAuthenticated) {
        // Wait a bit for data to arrive if we don't have it yet
        if (!ws.getLiveData(symbol)) {
          console.log(`[${getTimestamp()}] ⏳ Waiting for WebSocket data for ${symbol}...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
      }
      
      const wsData = ws.getLiveData(symbol);
      const wsPrice = ws.getCurrentPrice(symbol);
      const wsVolume = ws.getCurrentVolume(symbol);
      
      console.log(`[${getTimestamp()}] 🔍 WebSocket check for ${symbol}:`, {
        hasData: !!wsData,
        hasPrice: !!wsPrice,
        isAuthenticated: ws.isAuthenticated,
        price: wsPrice,
        volume: wsVolume,
        dataKeys: wsData ? Object.keys(wsData) : null
      });
      
      if (wsData && wsPrice && ws.isAuthenticated) {
        console.log(`[${getTimestamp()}] 📡 Using WebSocket data for ${symbol}: $${wsPrice} (Volume: ${wsVolume?.toLocaleString() || 'N/A'})`);
        
        // Get company name from Alpaca API
        const companyName = await getCompanyName(symbol);
        
        // Get previous close from REST API for percentage calculation
        let change = 0;
        let changePercent = "0.00";
        
        try {
          const previousClose = await getPreviousClose(symbol);
          change = wsPrice - previousClose;
          changePercent = ((change / previousClose) * 100).toFixed(2);
        } catch (prevCloseError) {
          console.warn(`[${getTimestamp()}] ⚠️ Could not calculate change for ${symbol}:`, prevCloseError.message);
          // Be honest about not having historical data
          change = null;
          changePercent = "N/A";
        }
        
        return {
          symbol: symbol.toUpperCase(),
          name: companyName,
          price: wsPrice,
          change: change,
          changePercent: changePercent,
          volume: wsVolume || null,
          timestamp: wsData.lastUpdate,
          source: 'websocket',
          hasHistoricalData: change !== null,
          hasVolumeData: wsVolume !== null
        };
      } else {
        console.log(`[${getTimestamp()}] 📡 WebSocket data not available for ${symbol}, falling back to REST API...`);
      }
    } else {
      console.log(`[${getTimestamp()}] 📡 Using REST API for ${symbol} (non-FAANG stock)`);
    }

    // Use REST API for non-FAANG stocks or when WebSocket fails
    return await getStockQuoteFromREST(symbol);
    
  } catch (error) {
    console.error(`[${getTimestamp()}] Error fetching data for ${symbol}:`, error.message);
    throw new Error(`Failed to get quote for ${symbol}: ${error.message}`);
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
        console.log(`[${getTimestamp()}] 📊 Previous close for ${symbol}: $${bars[0].c} (from yesterday's bar)`);
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
        console.log(`[${getTimestamp()}] 📊 Previous close for ${symbol}: $${lastBar.c} (from historical bars)`);
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
        console.log(`[${getTimestamp()}] 📊 Previous close for ${symbol}: $${lastTrade.p} (from yesterday's last trade)`);
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
        console.log(`[${getTimestamp()}] 📊 Intraday open for ${symbol}: $${openBar.o} (from today's bars)`);
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
        console.log(`[${getTimestamp()}] 📊 Previous close for ${symbol}: $${previousBar.c} (from recent bars)`);
        return previousBar.c;
      }
      throw new Error('No recent bars available');
    },

    // Approach 6: Try Yahoo Finance as fallback for percentage change
    async () => {
      try {
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`);
        const data = response.data;
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
          const result = data.chart.result[0];
          const timestamps = result.timestamp;
          const closes = result.indicators.quote[0].close;
          
          if (closes && closes.length >= 2) {
            const currentClose = closes[closes.length - 1];
            const previousClose = closes[closes.length - 2];
            
            if (currentClose && previousClose) {
              console.log(`[${getTimestamp()}] 📊 Previous close for ${symbol}: $${previousClose} (from Yahoo Finance)`);
              return previousClose;
            }
          }
        }
        throw new Error('No Yahoo Finance data available');
      } catch (yahooError) {
        console.warn(`[${getTimestamp()}] ⚠️ Yahoo Finance failed for ${symbol}:`, yahooError.message);
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
      console.warn(`[${getTimestamp()}] ⚠️ Approach ${i + 1} failed for ${symbol}:`, error.message);
      if (i === approaches.length - 1) {
        // This was the last approach, throw the error
        throw new Error(`All approaches failed to get previous close for ${symbol}`);
      }
    }
  }
};

// Get stock quote using REST API (fallback method)
const getStockQuoteFromREST = async (symbol) => {
  const headers = {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
  };

  // Get current price from latest trade
  const tradeResponse = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/trades/latest`, {
    headers
  });

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
      console.log(`[${getTimestamp()}] 📊 ${symbol} daily volume (REST): ${dailyVolume.toLocaleString()}`);
    }
  } catch (barsError) {
    console.warn(`[${getTimestamp()}] ⚠️ Failed to get daily volume for ${symbol}:`, barsError.message);
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
            console.warn(`[${getTimestamp()}] ⚠️ Could not calculate change for ${symbol}:`, prevCloseError.message);
            // Be honest about not having historical data
            change = null;
            changePercent = "N/A";
          }
  
            if (change !== null) {
            console.log(`[${getTimestamp()}] ${symbol} (REST API): $${currentPrice} (${change >= 0 ? '+' : ''}${changePercent}%) - Volume: ${dailyVolume.toLocaleString()}`);
    } else {
            console.log(`[${getTimestamp()}] ${symbol} (REST API): $${currentPrice} (change: N/A - no historical data) - Volume: ${dailyVolume.toLocaleString()}`);
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
};

// AI-powered search stocks with multiple data sources and intelligent matching
const searchStocks = async (query) => {
  try {
    // Check if Alpaca API keys are configured
    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
      throw new Error('Alpaca API keys not configured. Please set ALPACA_API_KEY and ALPACA_SECRET_KEY in your .env file.');
    }

    const queryLower = query.toLowerCase().trim();
    const queryUpper = query.toUpperCase().trim();
    
    // Step 1: Get Alpaca assets for comprehensive search
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

    // Step 2: Professional search algorithm (like Robinhood/Fidelity)
    const searchResults = [];
    
    for (const asset of alpacaAssets) {
      const symbolLower = asset.symbol.toLowerCase();
      const nameLower = asset.name.toLowerCase();
      
      let score = 0;
      let shouldInclude = false;

      // Exact symbol match (highest priority)
      if (symbolLower === queryLower) {
        score = 10000;
        shouldInclude = true;
      }
      // Symbol starts with query (very high priority)
      else if (symbolLower.startsWith(queryLower)) {
        score = 9000;
        shouldInclude = true;
      }
      // Company name starts with query (high priority)
      else if (nameLower.startsWith(queryLower)) {
        score = 8000;
        shouldInclude = true;
      }
      // Company name contains query as whole word
      else {
        const nameWords = nameLower.split(/\s+/);
        if (nameWords.some(word => word === queryLower)) {
          score = 7000;
          shouldInclude = true;
        }
        // Company name contains query word that starts with query
        else if (nameWords.some(word => word.startsWith(queryLower))) {
          score = 6000;
          shouldInclude = true;
        }
        // Company name contains query (lower priority)
        else if (nameLower.includes(queryLower)) {
          score = 5000;
          shouldInclude = true;
        }
        // Symbol contains query (lower priority)
        else if (symbolLower.includes(queryLower)) {
          score = 4000;
          shouldInclude = true;
        }
      }

      if (shouldInclude) {
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

    // Debug logging for search results
    console.log(`[${getTimestamp()}] 🔍 Professional search results for "${query}":`, searchResults.slice(0, 5).map(asset => ({
      symbol: asset.symbol,
      name: asset.name,
      score: asset.relevanceScore
    })));

    // Step 4: Get quotes for top results
    const finalResults = [];
    const topAssets = searchResults.slice(0, 10);
    
    for (const asset of topAssets) {
      try {
        console.log(`[${getTimestamp()}] 🔍 Getting quote for ${asset.symbol}...`);
        const quote = await getStockQuoteFromREST(asset.symbol);
        finalResults.push(quote);
      } catch (quoteError) {
        console.warn(`[${getTimestamp()}] Failed to get quote for ${asset.symbol}:`, quoteError.message);
        // Add asset without quote data
        finalResults.push({
          symbol: asset.symbol,
          name: asset.name,
          price: null,
          change: null,
          changePercent: null,
          volume: null,
          timestamp: null,
          hasHistoricalData: false,
          hasVolumeData: false
        });
      }
    }

    return finalResults;
  } catch (error) {
    console.error(`[${getTimestamp()}] Error searching stocks:`, error);
    throw new Error(`Failed to search stocks: ${error.message}`);
  }
};

// Enhanced autocomplete search (lightweight, no quotes)
const searchStocksAutocomplete = async (query) => {
  try {
    const queryLower = query.toLowerCase().trim();
    
    // Check cache first
    const cacheKey = `autocomplete_${queryLower}`;
    const cached = searchCache[cacheKey];
    if (cached && (Date.now() - cached.timestamp) < SEARCH_CACHE_DURATION) {
      console.log(`[${getTimestamp()}] 📦 Returning cached autocomplete results for "${query}"`);
      return cached.results;
    }

    // Check if Alpaca API keys are configured
    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
      throw new Error('Alpaca API keys not configured');
    }

    // Get Alpaca assets with caching
    let alpacaAssets = [];
    const now = Date.now();
    
    // Check if we have cached assets and they're still valid
    if (alpacaAssetsCache.data && alpacaAssetsCache.timestamp && 
        (now - alpacaAssetsCache.timestamp) < alpacaAssetsCache.ttl) {
      console.log(`[${getTimestamp()}] 📦 Using cached Alpaca assets`);
      alpacaAssets = alpacaAssetsCache.data;
    } else {
      console.log(`[${getTimestamp()}] 🔄 Fetching fresh Alpaca assets...`);
      const headers = {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
      };

      try {
        const response = await axios.get('https://paper-api.alpaca.markets/v2/assets', {
          headers,
          params: {
            status: 'active',
            asset_class: 'us_equity'
          },
          timeout: 10000 // 10 second timeout
        });
        alpacaAssets = response.data;
        
        // Cache the assets
        alpacaAssetsCache.data = alpacaAssets;
        alpacaAssetsCache.timestamp = now;
        console.log(`[${getTimestamp()}] ✅ Cached ${alpacaAssets.length} Alpaca assets`);
      } catch (alpacaError) {
        console.warn(`[${getTimestamp()}] Failed to fetch Alpaca assets:`, alpacaError.message);
        throw new Error('Failed to fetch stock data');
      }
    }

    // Professional search algorithm (like TradingView/Robinhood)
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
        const brandKeywords = ['apple', 'microsoft', 'google', 'amazon', 'tesla', 'netflix', 'facebook', 'meta', 'nvidia', 'intel', 'amd', 'berkshire', 'coca', 'pepsi', 'mcdonalds', 'starbucks', 'disney', 'netflix', 'spotify', 'uber', 'lyft', 'airbnb', 'salesforce', 'oracle', 'adobe', 'paypal', 'visa', 'mastercard'];
        if (brandKeywords.some(brand => nameLower.includes(brand))) {
          score += 500;
        }

        // Bonus for exact ticker length matches (4-5 characters are most common)
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

    // Sort by relevance score (highest first)
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

    // Return top 15 results for autocomplete
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

    console.log(`[${getTimestamp()}] ✅ Autocomplete search for "${query}" returned ${results.length} results`);
    return results;
  } catch (error) {
    console.error(`[${getTimestamp()}] Error in autocomplete search:`, error);
    throw new Error(`Failed to search stocks: ${error.message}`);
  }
};

// Get user portfolio (requires authentication)
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user data from auth system
    const users = req.app.locals.fileStorage.getUsers();
    const user = users[userId];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize portfolio if it doesn't exist
    if (!user.portfolio) {
      user.portfolio = {
        balance: 10000,
        positions: [],
        totalValue: 10000
      };
    }
    
    const portfolio = user.portfolio;
    
    // Update current prices for all positions
    for (let position of portfolio.positions) {
      try {
        // Use REST API for portfolio positions (works with any stock)
        const quote = await getStockQuoteFromREST(position.symbol);
        position.currentPrice = quote.price;
        position.change = quote.change;
        position.changePercent = quote.changePercent;
      } catch (quoteError) {
        console.warn(`[${getTimestamp()}] Failed to get quote for ${position.symbol}, using last known price`);
        // Keep the existing price if quote fails
        position.currentPrice = position.currentPrice || position.avgPrice;
        position.change = position.change || 0;
        position.changePercent = position.changePercent || '0.00';
      }
    }
    
    // Calculate total portfolio value
    const positionsValue = portfolio.positions.reduce((total, position) => {
      return total + (position.shares * (position.currentPrice || position.avgPrice));
    }, 0);
    
    portfolio.totalValue = portfolio.balance + positionsValue;
    
    // Save updated user data
    user.portfolio = portfolio;
    users[userId] = user;
    req.app.locals.fileStorage.saveUsers(users);
    
    res.json({
      success: true,
      portfolio: portfolio
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Error getting portfolio:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio'
    });
  }
});

// Get stock quote
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    // Use REST API for individual quotes (works with any stock)
    const quote = await getStockQuoteFromREST(symbol);
    
    res.json({
      success: true,
      quote: quote
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Error getting quote:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock quote'
    });
  }
});

// Search stocks
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 1) {
      return res.json({
        success: true,
        results: []
      });
    }
    
    const results = await searchStocks(query);
    
    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Error searching stocks:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to search stocks'
    });
  }
});

// Test route to verify server is loading updated code
router.get('/test', (req, res) => {
  res.json({ message: 'Test route working - server is updated' });
});

// Health check and cache warmup endpoint
router.get('/health', async (req, res) => {
  try {
    // Warm up the Alpaca assets cache if it's empty
    if (!alpacaAssetsCache.data) {
      console.log(`[${getTimestamp()}] 🔥 Warming up Alpaca assets cache...`);
      try {
        const headers = {
          'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
        };

        const response = await axios.get('https://paper-api.alpaca.markets/v2/assets', {
          headers,
          params: {
            status: 'active',
            asset_class: 'us_equity'
          },
          timeout: 10000
        });
        
        alpacaAssetsCache.data = response.data;
        alpacaAssetsCache.timestamp = Date.now();
        console.log(`[${getTimestamp()}] ✅ Cache warmed up with ${response.data.length} assets`);
      } catch (error) {
        console.warn(`[${getTimestamp()}] Failed to warm up cache:`, error.message);
      }
    }

    res.json({
      success: true,
      message: 'Trading service is healthy',
      cacheStatus: {
        assetsCached: !!alpacaAssetsCache.data,
        assetsCount: alpacaAssetsCache.data ? alpacaAssetsCache.data.length : 0,
        searchCacheSize: Object.keys(searchCache).length
      }
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Health check failed:`, error);
    res.status(500).json({
      success: false,
      message: 'Trading service health check failed'
    });
  }
});

// Cache status endpoint for debugging
router.get('/cache-status', (req, res) => {
  try {
    const now = Date.now();
    const assetsAge = alpacaAssetsCache.timestamp ? now - alpacaAssetsCache.timestamp : null;
    const assetsValid = assetsAge && assetsAge < alpacaAssetsCache.ttl;
    
    res.json({
      success: true,
      cacheStatus: {
        assets: {
          cached: !!alpacaAssetsCache.data,
          count: alpacaAssetsCache.data ? alpacaAssetsCache.data.length : 0,
          age: assetsAge,
          valid: assetsValid,
          ttl: alpacaAssetsCache.ttl
        },
        search: {
          size: Object.keys(searchCache).length,
          keys: Object.keys(searchCache).slice(0, 10) // Show first 10 keys
        }
      }
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Cache status failed:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache status'
    });
  }
});

// Autocomplete search (lightweight, no quotes)
router.get('/autocomplete', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 1) {
      return res.json({
        success: true,
        results: []
      });
    }
    
    const results = await searchStocksAutocomplete(query);
    
    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Error in autocomplete search:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to search stocks'
    });
  }
});

// Execute buy order (requires authentication)
router.post('/buy', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { symbol, shares } = req.body;
    
    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order parameters'
      });
    }
    
    const portfolios = getPortfolios(req);
    const portfolio = initializePortfolio(req, userId);
    // Use REST API for order execution (works with any stock)
    const quote = await getStockQuoteFromREST(symbol);
    const totalCost = quote.price * shares;
    
    // Check if user has enough balance
    if (totalCost > portfolio.balance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds'
      });
    }
    
    // Execute the trade
    portfolio.balance -= totalCost;
    
    // Check if user already has this stock
    const existingPosition = portfolio.positions.find(p => p.symbol === symbol);
    
    if (existingPosition) {
      // Update existing position
      const totalShares = existingPosition.shares + shares;
      const totalCostBasis = (existingPosition.shares * existingPosition.avgPrice) + totalCost;
      existingPosition.avgPrice = totalCostBasis / totalShares;
      existingPosition.shares = totalShares;
      existingPosition.currentPrice = quote.price;
    } else {
      // Add new position
      portfolio.positions.push({
        symbol: symbol,
        shares: shares,
        avgPrice: quote.price,
        currentPrice: quote.price,
        change: quote.change,
        changePercent: quote.changePercent
      });
    }
    
    portfolio.lastUpdated = new Date().toISOString();
    portfolios[userId] = portfolio;
    savePortfolios(req, portfolios);
    
    // Record transaction
    const transactions = getTransactions(req);
    const transaction = {
      id: Date.now().toString(),
      type: 'buy',
      symbol: symbol,
      shares: shares,
      price: quote.price,
      total: totalCost,
      timestamp: new Date().toISOString()
    };
    
    transactions[userId] = transactions[userId] || [];
    transactions[userId].push(transaction);
    saveTransactions(req, transactions);
    
    res.json({
      success: true,
      message: 'Buy order executed successfully',
      order: {
        symbol: symbol,
        shares: shares,
        price: quote.price,
        total: totalCost
      },
      portfolio: portfolio
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Error executing buy order:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute buy order'
    });
  }
});

// Execute sell order (requires authentication)
router.post('/sell', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { symbol, shares } = req.body;
    
    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order parameters'
      });
    }
    
    const portfolios = getPortfolios(req);
    const portfolio = initializePortfolio(req, userId);
    // Use REST API for order execution (works with any stock)
    const quote = await getStockQuoteFromREST(symbol);
    const totalValue = quote.price * shares;
    
    // Check if user has enough shares
    const position = portfolio.positions.find(p => p.symbol === symbol);
    
    if (!position || position.shares < shares) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient shares'
      });
    }
    
    // Execute the trade
    portfolio.balance += totalValue;
    
    // Update position
    position.shares -= shares;
    position.currentPrice = quote.price;
    
    // Remove position if no shares left
    if (position.shares === 0) {
      portfolio.positions = portfolio.positions.filter(p => p.symbol !== symbol);
    }
    
    portfolio.lastUpdated = new Date().toISOString();
    portfolios[userId] = portfolio;
    savePortfolios(req, portfolios);
    
    // Record transaction
    const transactions = getTransactions(req);
    const transaction = {
      id: Date.now().toString(),
      type: 'sell',
      symbol: symbol,
      shares: shares,
      price: quote.price,
      total: totalValue,
      timestamp: new Date().toISOString()
    };
    
    transactions[userId] = transactions[userId] || [];
    transactions[userId].push(transaction);
    saveTransactions(req, transactions);
    
    res.json({
      success: true,
      message: 'Sell order executed successfully',
      order: {
        symbol: symbol,
        shares: shares,
        price: quote.price,
        total: totalValue
      },
      portfolio: portfolio
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Error executing sell order:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute sell order'
    });
  }
});

// Get transaction history (requires authentication)
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactions = getTransactions(req);
    const userTransactions = transactions[userId] || [];
    
    // Sort by timestamp (newest first)
    const sortedTransactions = userTransactions.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    res.json({
      success: true,
      transactions: sortedTransactions
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Error getting transactions:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history'
    });
  }
});

// Initialize WebSocket client for real-time data
let wsClient = null;

// Initialize WebSocket connection
const initializeWebSocket = () => {
  if (!wsClient) {
    wsClient = new AlpacaWebSocketClient();
    wsClient.connect().catch(error => {
      console.error(`[${getTimestamp()}] ❌ Failed to initialize WebSocket:`, error);
    });
  }
  return wsClient;
};

// Cache for market data to reduce API calls
let marketDataCache = {
  data: null,
  timestamp: null,
  ttl: 30000 // 30 seconds cache
};

// Cache for chart data to reduce API calls
let chartDataCache = {
  data: {},
  timestamp: {},
  ttl: 300000 // 5 minutes cache for chart data (increased due to larger datasets)
};

// Get WebSocket connection status
router.get('/websocket-status', (req, res) => {
  try {
    if (!wsClient) {
      return res.json({
        connected: false,
        authenticated: false,
        message: 'WebSocket client not initialized'
      });
    }
    
    const status = wsClient.getStatus();
    res.json(status);
  } catch (error) {
    console.error(`[${getTimestamp()}] Error getting WebSocket status:`, error);
    res.status(500).json({ error: 'Failed to get WebSocket status' });
  }
});

// Get market data (FAANG companies) with caching
router.get('/market', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (marketDataCache.data && marketDataCache.timestamp && 
        (now - marketDataCache.timestamp) < marketDataCache.ttl) {
      console.log(`[${getTimestamp()}] 📦 Returning cached FAANG market data`);
      return res.json({
        success: true,
        marketData: marketDataCache.data,
        cached: true
      });
    }

    const faangStocks = ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL'];
    const marketData = [];
    
    console.log(`[${getTimestamp()}] 🔄 Fetching fresh FAANG market data for:`, faangStocks.join(', '));
    
    // Use Promise.all to fetch all stocks concurrently (faster, fewer API calls)
    const quotePromises = faangStocks.map(async (symbol) => {
      try {
      const quote = await getStockQuote(symbol);
      console.log(`[${getTimestamp()}] ✅ ${symbol}: $${quote.price} (${quote.changePercent}%)`);
        return quote;
      } catch (quoteError) {
        console.warn(`[${getTimestamp()}] ❌ Failed to get quote for ${symbol}:`, quoteError.message);
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
    
    console.log(`[${getTimestamp()}] 📊 FAANG market data summary:`, validResults.map(q => `${q.symbol}: ${q.changePercent}%`).join(', '));
    
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
router.get('/chart/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1D', limit = 500, start, end } = req.query;
    
    console.log(`[${getTimestamp()}] 📈 Fetching chart data for ${symbol} (${timeframe})` + (start && end ? ` range ${start}→${end}` : ''));
    console.log(`[${getTimestamp()}] 📊 Request details:`, { symbol, timeframe, limit, start, end });
    
    // Check cache first
    const cacheKey = `${symbol}_${timeframe}_${start || 'NA'}_${end || 'NA'}`;
    const now = Date.now();
    if (chartDataCache.data[cacheKey] && chartDataCache.timestamp[cacheKey] && 
        (now - chartDataCache.timestamp[cacheKey]) < chartDataCache.ttl) {
      console.log(`[${getTimestamp()}] 📦 Returning cached chart data for ${symbol}`);
      return res.json({
        success: true,
        chartData: chartDataCache.data[cacheKey],
        cached: true
      });
    }

    // Generate historical data with optional date slicing
    console.log(`[${getTimestamp()}] 🔍 Calling generateHistoricalData for ${symbol}`);
    const chartData = await generateHistoricalData(symbol, timeframe, parseInt(limit), start, end);
    
    // Update cache
    chartDataCache.data[cacheKey] = chartData;
    chartDataCache.timestamp[cacheKey] = now;
    
    console.log(`[${getTimestamp()}] ✅ Chart data generated for ${symbol}: ${chartData.candles.length} candles`);
    
    res.json({
      success: true,
      chartData,
      cached: false
    });
  } catch (error) {
    console.error(`[${getTimestamp()}] Error getting chart data:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to get chart data: ${error.message}`
    });
  }
});

// Get real-time chart updates
router.get('/chart/:symbol/live', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    console.log(`[${getTimestamp()}] 🔄 Getting live chart update for ${symbol}`);
    
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
    console.log(`[${getTimestamp()}] 🔍 Fetching real historical data for ${symbol} (${timeframe})`);
    console.log(`[${getTimestamp()}] 📅 Date range: ${start} → ${end}, limit: ${limit}`);
    
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
    if (process.env.ALPACA_API_KEY && process.env.ALPACA_SECRET_KEY) {
      console.log(`[${getTimestamp()}] 🔑 Alpaca API keys found, trying Alpaca first...`);
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
        console.log(`[${getTimestamp()}] 📡 Alpaca URL params: ${alpacaParams}`);
        const response = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/bars?${alpacaParams}&adjustment=split`, {
          headers,
          timeout: 10000
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
          console.log(`[${getTimestamp()}] ✅ Got ${slicedCandles.length} candles from Alpaca for ${symbol}`);
          
          return {
            symbol,
            timeframe,
            candles: slicedCandles,
            lastUpdated: new Date().toISOString()
          };
        }
      } catch (alpacaError) {
        console.warn(`[${getTimestamp()}] ⚠️ Alpaca API failed for ${symbol}: ${alpacaError.message}`);
      }
    } else {
      console.log(`[${getTimestamp()}] ⚠️ No Alpaca API keys found, skipping Alpaca API call`);
    }
    
    // Fallback to Yahoo Finance API
    try {
      console.log(`[${getTimestamp()}] 🔄 Trying Yahoo Finance API for ${symbol}...`);
      // Get maximum historical data for all timeframes
      const yahooRangeAdjusted = yahooRange; // Use the full year range we set above
      console.log(`[${getTimestamp()}] 📡 Yahoo interval: ${yahooInterval}, range: ${yahooRangeAdjusted}`);
        // For Yahoo, if a specific date range is requested, switch to explicit period1/period2
        const yahooUrl = start && end
          ? `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${yahooInterval}&period1=${Math.floor(new Date(start + 'T00:00:00Z').getTime() / 1000)}&period2=${Math.floor(new Date(end + 'T23:59:59Z').getTime() / 1000)}`
          : `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${yahooInterval}&range=${yahooRangeAdjusted}`;
        console.log(`[${getTimestamp()}] 🌐 Yahoo URL: ${yahooUrl}`);
        const yahooResponse = await axios.get(yahooUrl, {
        timeout: 10000
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
        
        console.log(`[${getTimestamp()}] ✅ Got ${limitedCandles.length} candles from Yahoo Finance for ${symbol}`);
        
        return {
          symbol,
          timeframe,
          candles: limitedCandles,
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (yahooError) {
      console.warn(`[${getTimestamp()}] ⚠️ Yahoo Finance API failed for ${symbol}: ${yahooError.message}`);
    }
    
    // Final fallback - generate realistic mock data based on current price
    console.log(`[${getTimestamp()}] ⚠️ Using fallback mock data for ${symbol}`);
    
    try {
      // Get current price to base mock data on, or use a default price if API keys are missing
      let basePrice = 100; // Default price for historical scenarios
      
      try {
        const quote = await getStockQuote(symbol);
        basePrice = parseFloat(quote.price) || basePrice;
        console.log(`[${getTimestamp()}] 💰 Got quote price for ${symbol}: $${basePrice}`);
      } catch (quoteError) {
        console.log(`[${getTimestamp()}] ⚠️ Could not get quote for ${symbol}, using default price ${basePrice}:`, quoteError.message);
        // Use default price for historical scenarios when API keys are missing
      }
      
      const candles = [];
      const now = new Date();

      // Generate data points based on timeframe
      let intervalMs;
      switch (timeframe) {
        case '1m':
          intervalMs = 60 * 1000;
          break;
        case '5m':
          intervalMs = 5 * 60 * 1000;
          break;
        case '15m':
          intervalMs = 15 * 60 * 1000;
          break;
        case '1h':
          intervalMs = 60 * 60 * 1000;
          break;
        case '4h':
          intervalMs = 4 * 60 * 60 * 1000;
          break;
        case '1d':
          intervalMs = 24 * 60 * 60 * 1000;
          break;
        case '1w':
          intervalMs = 7 * 24 * 60 * 60 * 1000;
          break;
        case '1M':
          intervalMs = 30 * 24 * 60 * 60 * 1000;
          break;
        default:
          intervalMs = 24 * 60 * 60 * 1000;
      }

      // If a historical date range is provided, generate candles anchored to that window
      if (start && end) {
        const startTsSec = Math.floor(new Date(start + 'T00:00:00Z').getTime() / 1000);
        const endTsSec = Math.floor(new Date(end + 'T23:59:59Z').getTime() / 1000);
        const totalSpanMs = Math.max(0, (endTsSec - startTsSec) * 1000);
        // Compute how many steps fit in the window; ensure at least 1 and cap by limit
        const steps = Math.max(1, Math.min(limit, Math.floor(totalSpanMs / intervalMs) + 1));

        let currentPrice = basePrice;
        for (let i = 0; i < steps; i++) {
          const timeMs = (startTsSec * 1000) + (i * intervalMs);

          // More realistic price movement
          const priceChange = (Math.random() - 0.5) * (basePrice * 0.02); // 2% max change
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
            volume: volume
          });
        }

        console.log(`[${getTimestamp()}] 🎭 Generated ${candles.length} mock candles for ${symbol} (${timeframe}) within ${start} → ${end}`);
        return {
          symbol,
          timeframe,
          candles,
          lastUpdated: new Date().toISOString()
        };
      }

      // Otherwise, generate recent candles ending at now
      let currentPrice = basePrice;
      for (let i = limit - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * intervalMs));

        // More realistic price movement
        const priceChange = (Math.random() - 0.5) * (basePrice * 0.02); // 2% max change
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
          volume: volume
        });
      }

      console.log(`[${getTimestamp()}] 🎭 Generated ${candles.length} mock candles for ${symbol} (${timeframe}) ending at now`);
      return {
        symbol,
        timeframe,
        candles,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[${getTimestamp()}] Error generating fallback data for ${symbol}:`, error);
      throw new Error(`Failed to generate chart data for ${symbol}`);
    }
  } catch (error) {
    console.error(`[${getTimestamp()}] Error in generateHistoricalData for ${symbol}:`, error);
    throw error;
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

module.exports = router; 