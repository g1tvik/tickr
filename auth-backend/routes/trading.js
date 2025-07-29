const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const Alpaca = require('@alpacahq/alpaca-trade-api');

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

// Get stock quote using Alpaca API for real-time market data
const getStockQuote = async (symbol) => {
  try {
    // Check if Alpaca API keys are configured
    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
      throw new Error('Alpaca API keys not configured. Please set ALPACA_API_KEY and ALPACA_SECRET_KEY in your .env file.');
    }

    const headers = {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
    };

    // Get current price from latest trade (more accurate than bid/ask)
    const tradeResponse = await axios.get(`https://data.alpaca.markets/v2/stocks/${symbol}/trades/latest`, {
      headers
    });

    const trade = tradeResponse.data;
    if (!trade || !trade.trade) {
      throw new Error(`No trade data available for ${symbol}`);
    }

    const currentPrice = trade.trade.p; // Latest trade price
    const timestamp = trade.trade.t;

    // Get yesterday's date for historical quotes
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Get historical quotes from yesterday to find previous close
    const historicalResponse = await axios.get(`https://data.alpaca.markets/v2/stocks/quotes`, {
      headers,
      params: {
        symbols: symbol,
        start: yesterdayStr,
        end: yesterdayStr,
        limit: 1000,
        feed: 'sip'
      }
    });

    const historicalQuotes = historicalResponse.data.quotes[symbol];
    
    if (!historicalQuotes || historicalQuotes.length === 0) {
      throw new Error("No historical quote data available for percentage calculation.");
    }

    // Get the last quote from yesterday as previous close
    const lastQuote = historicalQuotes[historicalQuotes.length - 1];
    let previousClose;
    
    // Use ask price as closing price, fallback to bid if ask is 0
    if (lastQuote.ap > 0) {
      previousClose = lastQuote.ap;
    } else if (lastQuote.bp > 0) {
      previousClose = lastQuote.bp;
    } else {
      throw new Error("No valid previous close price available");
    }

    // Calculate daily change
    const change = currentPrice - previousClose;
    const changePercent = ((change / previousClose) * 100).toFixed(2);
    
    console.log(`${symbol} (Alpaca): $${currentPrice} (${change >= 0 ? '+' : ''}${changePercent}%) - Previous Close: $${previousClose}`);
    
    return {
      symbol: symbol.toUpperCase(),
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      volume: trade.trade.s || 0,
      timestamp: timestamp
    };
  } catch (error) {
    console.error(`Error fetching Alpaca data for ${symbol}:`, error.message);
    throw new Error(`Failed to get Alpaca quote for ${symbol}: ${error.message}`);
  }
};

// Search stocks using Alpaca
const searchStocks = async (query) => {
  try {
    // Alpaca doesn't have a direct search endpoint, so we'll use a predefined list
    // In production, you might want to use a separate service like Polygon or IEX
    const popularStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'TSLA', name: 'Tesla, Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
      { symbol: 'META', name: 'Meta Platforms, Inc.' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      { symbol: 'NFLX', name: 'Netflix, Inc.' },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
      { symbol: 'JNJ', name: 'Johnson & Johnson' },
      { symbol: 'V', name: 'Visa Inc.' },
      { symbol: 'WMT', name: 'Walmart Inc.' },
      { symbol: 'PG', name: 'Procter & Gamble Co.' },
      { symbol: 'UNH', name: 'UnitedHealth Group Inc.' },
      { symbol: 'HD', name: 'Home Depot Inc.' }
    ];

    const filteredStocks = popularStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );

    // Get real-time quotes for filtered stocks
    const stocksWithQuotes = [];
    for (const stock of filteredStocks) {
      const quote = await getStockQuote(stock.symbol);
      stocksWithQuotes.push({
        ...stock,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent
      });
    }

    return stocksWithQuotes;
  } catch (error) {
    console.error('Error searching stocks:', error.message);
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
        const quote = await getStockQuote(position.symbol);
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
    const quote = await getStockQuote(symbol);
    
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
    const quote = await getStockQuote(symbol);
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
    const quote = await getStockQuote(symbol);
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

// Get market data (FAANG companies)
router.get('/market', async (req, res) => {
  try {
    const faangStocks = ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL'];
    const marketData = [];
    
    console.log('Fetching FAANG market data for:', faangStocks.join(', '));
    
    for (const symbol of faangStocks) {
      try {
        const quote = await getStockQuote(symbol);
        marketData.push(quote);
        console.log(`✅ ${symbol}: $${quote.price} (${quote.changePercent}%)`);
      } catch (quoteError) {
        console.warn(`Failed to get quote for ${symbol}:`, quoteError.message);
        // Continue with other stocks even if one fails
      }
    }
    
    if (marketData.length === 0) {
      throw new Error('No market data available');
    }
    
    console.log('FAANG market data summary:', marketData.map(q => `${q.symbol}: ${q.changePercent}%`).join(', '));
    
    res.json({
      success: true,
      marketData: marketData
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