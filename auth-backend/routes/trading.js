const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const AlpacaWebSocketClient = require('../websocket-client');

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
      console.warn('Alpaca API keys not configured, using symbol as company name');
      companyNameCache[symbol] = symbol.toUpperCase();
      return symbol.toUpperCase();
    }

    const headers = {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
    };

    // Use the working Alpaca Paper Trading API endpoint
    console.log(`🔍 Fetching company name for ${symbol} from Alpaca Paper Trading API...`);
    try {
      const response = await axios.get(`https://paper-api.alpaca.markets/v2/assets/${symbol}`, {
        headers
      });

      console.log(`📄 Alpaca Paper Trading API response for ${symbol}:`, JSON.stringify(response.data, null, 2));

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
        
        console.log(`✅ Found company name for ${symbol}: ${companyName}`);
        // Cache the company name
        companyNameCache[symbol] = companyName;
        return companyName;
      } else {
        console.warn(`⚠️ No company name found in Alpaca response for ${symbol}, checking fallback mapping`);
      }
    } catch (alpacaError) {
      console.error(`❌ Alpaca API failed for ${symbol}:`, alpacaError.message);
      if (alpacaError.response) {
        console.error(`   Status: ${alpacaError.response.status}`);
        console.error(`   Data:`, alpacaError.response.data);
      }
    }

    // If Alpaca API fails, use fallback mapping
    console.warn(`⚠️ Alpaca API failed for ${symbol}, checking fallback mapping`);
    if (companyNameMapping[symbol.toUpperCase()]) {
      const fallbackName = companyNameMapping[symbol.toUpperCase()];
      console.log(`✅ Using fallback company name for ${symbol}: ${fallbackName}`);
      companyNameCache[symbol] = fallbackName;
      return fallbackName;
    } else {
      console.warn(`⚠️ No fallback name found for ${symbol}, using symbol`);
      // Final fallback to symbol
      companyNameCache[symbol] = symbol.toUpperCase();
      return symbol.toUpperCase();
    }
  } catch (error) {
    console.error(`❌ Failed to get company name for ${symbol}:`, error.message);
    
    // Try fallback mapping first
    if (companyNameMapping[symbol.toUpperCase()]) {
      const fallbackName = companyNameMapping[symbol.toUpperCase()];
      console.log(`✅ Using fallback company name for ${symbol}: ${fallbackName}`);
      companyNameCache[symbol] = fallbackName;
      return fallbackName;
    } else {
      console.warn(`⚠️ No fallback name found for ${symbol}, using symbol`);
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
          console.log(`⏳ Waiting for WebSocket data for ${symbol}...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
      }
      
      const wsData = ws.getLiveData(symbol);
      const wsPrice = ws.getCurrentPrice(symbol);
      const wsVolume = ws.getCurrentVolume(symbol);
      
      console.log(`🔍 WebSocket check for ${symbol}:`, {
        hasData: !!wsData,
        hasPrice: !!wsPrice,
        isAuthenticated: ws.isAuthenticated,
        price: wsPrice,
        volume: wsVolume,
        dataKeys: wsData ? Object.keys(wsData) : null
      });
      
      if (wsData && wsPrice && ws.isAuthenticated) {
        console.log(`📡 Using WebSocket data for ${symbol}: $${wsPrice} (Volume: ${wsVolume?.toLocaleString() || 'N/A'})`);
        
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
          console.warn(`⚠️ Could not calculate change for ${symbol}:`, prevCloseError.message);
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
        console.log(`📡 WebSocket data not available for ${symbol}, falling back to REST API...`);
      }
    } else {
      console.log(`📡 Using REST API for ${symbol} (non-FAANG stock)`);
    }

    // Use REST API for non-FAANG stocks or when WebSocket fails
    return await getStockQuoteFromREST(symbol);
    
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error.message);
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
          feed: 'sip'
        }
      });

      const bars = response.data.bars;
      if (bars && bars.length > 0) {
        console.log(`📊 Previous close for ${symbol}: $${bars[0].c} (from yesterday's bar)`);
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
          feed: 'sip'
        }
      });

      const bars = response.data.bars;
      if (bars && bars.length > 0) {
        const lastBar = bars[bars.length - 1];
        console.log(`📊 Previous close for ${symbol}: $${lastBar.c} (from historical bars)`);
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
        console.log(`📊 Previous close for ${symbol}: $${lastTrade.p} (from yesterday's last trade)`);
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
          feed: 'sip'
        }
      });

      const bars = response.data.bars;
      if (bars && bars.length > 0) {
        // Use the first bar of the day (open) as previous close for intraday change
        const openBar = bars[0];
        console.log(`📊 Intraday open for ${symbol}: $${openBar.o} (from today's bars)`);
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
          feed: 'sip'
        }
      });

      const bars = response.data.bars;
      if (bars && bars.length >= 2) {
        // Use the second-to-last bar as previous close
        const previousBar = bars[bars.length - 2];
        console.log(`📊 Previous close for ${symbol}: $${previousBar.c} (from recent bars)`);
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
              console.log(`📊 Previous close for ${symbol}: $${previousClose} (from Yahoo Finance)`);
              return previousClose;
            }
          }
        }
        throw new Error('No Yahoo Finance data available');
      } catch (yahooError) {
        console.warn(`⚠️ Yahoo Finance failed for ${symbol}:`, yahooError.message);
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
      console.warn(`⚠️ Approach ${i + 1} failed for ${symbol}:`, error.message);
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
      console.log(`📊 ${symbol} daily volume (REST): ${dailyVolume.toLocaleString()}`);
    }
  } catch (barsError) {
    console.warn(`⚠️ Failed to get daily volume for ${symbol}:`, barsError.message);
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
            console.warn(`⚠️ Could not calculate change for ${symbol}:`, prevCloseError.message);
            // Be honest about not having historical data
            change = null;
            changePercent = "N/A";
          }
  
            if (change !== null) {
            console.log(`${symbol} (REST API): $${currentPrice} (${change >= 0 ? '+' : ''}${changePercent}%) - Volume: ${dailyVolume.toLocaleString()}`);
    } else {
            console.log(`${symbol} (REST API): $${currentPrice} (change: N/A - no historical data) - Volume: ${dailyVolume.toLocaleString()}`);
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
    
    // Define major stocks that should always be prioritized
    const majorStocks = {
      'AAPL': 'Apple Inc.',
      'TSLA': 'Tesla, Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com, Inc.',
      'META': 'Meta Platforms, Inc.',
      'NFLX': 'Netflix, Inc.',
      'NVDA': 'NVIDIA Corporation',
      'AMD': 'Advanced Micro Devices, Inc.',
      'INTC': 'Intel Corporation',
      'JPM': 'JPMorgan Chase & Co.',
      'JNJ': 'Johnson & Johnson',
      'PG': 'Procter & Gamble Co.',
      'V': 'Visa Inc.',
      'MA': 'Mastercard Incorporated',
      'WMT': 'Walmart Inc.',
      'DIS': 'The Walt Disney Company',
      'NKE': 'NIKE, Inc.',
      'SBUX': 'Starbucks Corporation',
      'MCD': 'McDonald\'s Corporation'
    };

    // Step 1: Check for exact major stock matches first
    const exactMatches = [];
    if (majorStocks[queryUpper]) {
      exactMatches.push({
        symbol: queryUpper,
        name: majorStocks[queryUpper],
        isMajorStock: true,
        relevanceScore: 10000 // Highest possible score
      });
    }

    // Step 1.5: Check for case-insensitive exact matches in major stocks
    for (const [symbol, name] of Object.entries(majorStocks)) {
      if (symbol.toLowerCase() === queryLower || name.toLowerCase() === queryLower) {
        if (!exactMatches.some(match => match.symbol === symbol)) {
          exactMatches.push({
            symbol,
            name,
            isMajorStock: true,
            relevanceScore: 10000 // Highest possible score
          });
        }
      }
    }

    // Step 2: Check for partial major stock matches
    const partialMatches = [];
    for (const [symbol, name] of Object.entries(majorStocks)) {
      if (symbol.toLowerCase().includes(queryLower) || 
          name.toLowerCase().includes(queryLower)) {
        if (symbol !== queryUpper) { // Avoid duplicates
          partialMatches.push({
            symbol,
            name,
            isMajorStock: true,
            relevanceScore: symbol.toLowerCase().startsWith(queryLower) ? 9000 : 8000
          });
        }
      }
    }

    // Step 3: Get Alpaca assets for broader search
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
      console.warn('Failed to fetch Alpaca assets:', alpacaError.message);
    }

    // Step 4: Enhanced AI-powered filtering and scoring
    const allAssets = [...exactMatches, ...partialMatches];
    
    // Add Alpaca assets that aren't already in our list
    for (const asset of alpacaAssets) {
      const symbolLower = asset.symbol.toLowerCase();
      const nameLower = asset.name.toLowerCase();
      
      // Skip if already in our major stocks list
      if (allAssets.some(a => a.symbol === asset.symbol)) {
        continue;
      }

      let score = 0;
      let shouldInclude = false;

      // Exact symbol match
      if (symbolLower === queryLower) {
        score = 7000;
        shouldInclude = true;
      }
      // Symbol starts with query
      else if (symbolLower.startsWith(queryLower)) {
        score = 6000;
        shouldInclude = true;
      }
      // Company name starts with query
      else if (nameLower.startsWith(queryLower)) {
        score = 5000;
        shouldInclude = true;
      }
      // Company name contains query as whole word
      else {
        const nameWords = nameLower.split(/\s+/);
        if (nameWords.some(word => word === queryLower)) {
          score = 4000;
          shouldInclude = true;
        }
        // Company name contains query word that starts with query
        else if (nameWords.some(word => word.startsWith(queryLower))) {
          score = 3000;
          shouldInclude = true;
        }
        // Company name contains query
        else if (nameLower.includes(queryLower)) {
          score = 2000;
          shouldInclude = true;
        }
      }

      if (shouldInclude) {
        // Bonus for shorter symbols (major companies)
        score += Math.max(0, 20 - symbolLower.length) * 10;
        
        // Bonus for common company keywords
        const commonKeywords = ['inc', 'corp', 'company', 'ltd', 'llc', 'plc', 'sa', 'ag'];
        if (commonKeywords.some(keyword => nameLower.includes(keyword))) {
          score += 50;
        }
        
        // Penalty for ETF keywords (prioritize actual companies)
        const etfKeywords = ['etf', 'fund', 'trust', 'shares', 'strategy'];
        if (etfKeywords.some(keyword => nameLower.includes(keyword))) {
          score -= 1000;
        }

        allAssets.push({
          symbol: asset.symbol,
          name: asset.name,
          isMajorStock: false,
          relevanceScore: score
        });
      }
    }

    // Step 5: Sort by relevance score (highest first)
    allAssets.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // For same score, prioritize major stocks
      if (a.isMajorStock && !b.isMajorStock) return -1;
      if (!a.isMajorStock && b.isMajorStock) return 1;
      
      // Then by symbol length
      if (a.symbol.length !== b.symbol.length) {
        return a.symbol.length - b.symbol.length;
      }
      
      // Finally alphabetically
      return a.symbol.toLowerCase().localeCompare(b.symbol.toLowerCase());
    });

    // Debug logging for search results
    console.log(`🔍 Search results for "${query}":`, allAssets.slice(0, 5).map(asset => ({
      symbol: asset.symbol,
      name: asset.name,
      score: asset.relevanceScore,
      isMajor: asset.isMajorStock
    })));

    // Step 6: Get quotes for top results
    const searchResults = [];
    const topAssets = allAssets.slice(0, 10);
    
    for (const asset of topAssets) {
      try {
        console.log(`🔍 Searching for ${asset.symbol} using REST API...`);
        const quote = await getStockQuoteFromREST(asset.symbol);
        searchResults.push(quote);
      } catch (quoteError) {
        console.warn(`Failed to get quote for ${asset.symbol}:`, quoteError.message);
        // Add asset without quote data
        searchResults.push({
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

    return searchResults;
  } catch (error) {
    console.error('Error searching stocks:', error);
    throw new Error(`Failed to search stocks: ${error.message}`);
  }
};

// Get user portfolio (requires authentication)
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const portfolio = initializePortfolio(req, userId);
    
    // Update current prices for all positions
    for (let position of portfolio.positions) {
      try {
        // Use REST API for portfolio positions (works with any stock)
        const quote = await getStockQuoteFromREST(position.symbol);
      position.currentPrice = quote.price;
      position.change = quote.change;
      position.changePercent = quote.changePercent;
      } catch (quoteError) {
        console.warn(`Failed to get quote for ${position.symbol}, using last known price`);
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
    portfolio.lastUpdated = new Date().toISOString();
    
    // Save updated portfolio
    const portfolios = getPortfolios(req);
    portfolios[userId] = portfolio;
    savePortfolios(req, portfolios);
    
    res.json({
      success: true,
      portfolio: portfolio
    });
  } catch (error) {
    console.error('Error getting portfolio:', error);
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
    console.error('Error getting quote:', error);
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
    console.error('Error searching stocks:', error);
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
    console.error('Error executing buy order:', error);
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
    console.error('Error executing sell order:', error);
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
    console.error('Error getting transactions:', error);
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
      console.error('❌ Failed to initialize WebSocket:', error);
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
    console.error('Error getting WebSocket status:', error);
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
      console.log('📦 Returning cached FAANG market data');
      return res.json({
        success: true,
        marketData: marketDataCache.data,
        cached: true
      });
    }

    const faangStocks = ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL'];
    const marketData = [];
    
    console.log('🔄 Fetching fresh FAANG market data for:', faangStocks.join(', '));
    
    // Use Promise.all to fetch all stocks concurrently (faster, fewer API calls)
    const quotePromises = faangStocks.map(async (symbol) => {
      try {
      const quote = await getStockQuote(symbol);
      console.log(`✅ ${symbol}: $${quote.price} (${quote.changePercent}%)`);
        return quote;
      } catch (quoteError) {
        console.warn(`❌ Failed to get quote for ${symbol}:`, quoteError.message);
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
    
    console.log('📊 FAANG market data summary:', validResults.map(q => `${q.symbol}: ${q.changePercent}%`).join(', '));
    
    res.json({
      success: true,
      marketData: validResults,
      cached: false
    });
  } catch (error) {
    console.error('Error getting market data:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get market data: ${error.message}`
    });
  }
});

module.exports = router; 