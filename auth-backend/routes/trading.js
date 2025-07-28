const express = require('express');
const router = express.Router();
const axios = require('axios');

// File-based storage access
const getPortfolios = (req) => req.app.locals.fileStorage.getPortfolios();
const savePortfolios = (req, portfolios) => req.app.locals.fileStorage.savePortfolios(portfolios);
const getTransactions = (req) => req.app.locals.fileStorage.getTransactions();
const saveTransactions = (req, transactions) => req.app.locals.fileStorage.saveTransactions(transactions);

// Alpha Vantage API configuration
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

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

// Get stock quote from Alpha Vantage
const getStockQuote = async (symbol) => {
  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol.toUpperCase(),
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    const data = response.data;
    
    if (data['Error Message']) {
      throw new Error('Invalid symbol');
    }

    const quote = data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      throw new Error('No data found for symbol');
    }

    return {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: quote['10. change percent'].replace('%', ''),
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open'])
    };
  } catch (error) {
    console.error('Error fetching stock quote:', error.message);
    // Return mock data for development
    return {
      symbol: symbol.toUpperCase(),
      price: 150 + Math.random() * 100,
      change: (Math.random() - 0.5) * 10,
      changePercent: ((Math.random() - 0.5) * 10).toFixed(2),
      volume: Math.floor(Math.random() * 1000000),
      high: 160 + Math.random() * 20,
      low: 140 + Math.random() * 20,
      open: 150 + Math.random() * 10
    };
  }
};

// Search stocks
const searchStocks = async (query) => {
  try {
    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: query,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    const data = response.data;
    
    if (data['Error Message']) {
      throw new Error('Search failed');
    }

    const matches = data.bestMatches || [];
    return matches.map(match => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region']
    }));
  } catch (error) {
    console.error('Error searching stocks:', error.message);
    // Return mock data for development
    return [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'United States' },
      { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'AMZN', name: 'Amazon.com, Inc.', type: 'Equity', region: 'United States' }
    ].filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
  }
};

// Get user portfolio
router.get('/portfolio', async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT token
    const portfolio = initializePortfolio(req, userId);
    
    // Update current prices for all positions
    for (let position of portfolio.positions) {
      try {
        const quote = await getStockQuote(position.symbol);
        position.currentPrice = quote.price;
        position.change = quote.change;
        position.changePercent = quote.changePercent;
      } catch (error) {
        console.error(`Error updating price for ${position.symbol}:`, error.message);
      }
    }
    
    // Calculate total portfolio value
    const positionsValue = portfolio.positions.reduce((total, position) => {
      return total + (position.shares * position.currentPrice);
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

// Execute buy order
router.post('/buy', async (req, res) => {
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

// Execute sell order
router.post('/sell', async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, shares } = req.body;
    
    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order parameters'
      });
    }
    
    const portfolio = initializePortfolio(userId);
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
    
    // Record transaction
    transactions[userId].push({
      id: Date.now().toString(),
      type: 'sell',
      symbol: symbol,
      shares: shares,
      price: quote.price,
      total: totalValue,
      timestamp: new Date().toISOString()
    });
    
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

// Get transaction history
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
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

// Get market data (top stocks)
router.get('/market', async (req, res) => {
  try {
    const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX'];
    const marketData = [];
    
    for (const symbol of popularStocks) {
      try {
        const quote = await getStockQuote(symbol);
        marketData.push(quote);
      } catch (error) {
        console.error(`Error getting quote for ${symbol}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      marketData: marketData
    });
  } catch (error) {
    console.error('Error getting market data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get market data'
    });
  }
});

module.exports = router; 