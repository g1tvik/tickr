// Trade utility functions

// Market status utilities
// Evaluated against US Eastern time (NYSE/Nasdaq regular session 9:30 AM–4:00 PM ET),
// regardless of the viewer's local timezone. Intl handles ET/EDT automatically.
// Note: does not account for market holidays — only weekday + regular-session hours.
export const checkMarketStatus = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type)?.value;
  const weekday = get('weekday'); // 'Mon' … 'Sun'
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0; // some engines emit 24 for midnight
  const minute = parseInt(get('minute'), 10);

  // Weekend
  if (weekday === 'Sat' || weekday === 'Sun') return 'closed';

  const currentTime = hour * 60 + minute;
  const marketOpen = 9 * 60 + 30; // 9:30 AM ET
  const marketClose = 16 * 60;    // 4:00 PM ET

  return currentTime >= marketOpen && currentTime < marketClose ? 'open' : 'closed';
};

export const getMarketStatusColor = (marketStatus) => {
  return marketStatus === 'open' ? '#22c55e' : '#ef4444';
};

export const getMarketStatusText = (marketStatus) => {
  return marketStatus === 'open' ? 'Market Open' : 'Market Closed';
};

// Portfolio utilities
export const getPositionValue = (position) => {
  // Backwards compatibility: support both avgPrice and legacy avgCost
  const avgPrice = position.avgPrice ?? position.avgCost ?? 0;
  const currentPrice = position.currentPrice ?? avgPrice;
  const currentValue = position.shares * currentPrice;
  const costBasis = position.shares * avgPrice;
  const pnl = currentValue - costBasis;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  return { currentValue, pnl, pnlPercent };
};

export const calculateOrderTotal = (selectedStock, shares) => {
  if (!selectedStock) return 0;
  return selectedStock.price * shares;
};

// Validation utilities
export const validateOrder = (selectedStock, shares, orderType, portfolio) => {
  const errors = [];
  
  if (!selectedStock) {
    errors.push('Please select a stock to trade');
  }
  
  if (!shares || shares < 1) {
    errors.push('Please enter a valid number of shares');
  }
  
  if (orderType === 'sell') {
    const position = portfolio?.positions.find(p => p.symbol === selectedStock?.symbol);
    if (!position || position.shares < shares) {
      errors.push('Insufficient shares to sell');
    }
  }
  
  if (orderType === 'buy') {
    const totalCost = calculateOrderTotal(selectedStock, shares);
    if (portfolio && totalCost > portfolio.balance) {
      errors.push('Insufficient funds for this order');
    }
  }
  
  return errors;
};

// Format utilities
export const formatCurrency = (amount) => {
  return `$${parseFloat(amount).toFixed(2)}`;
};

export const formatPercentage = (value) => {
  return `${parseFloat(value).toFixed(2)}%`;
};

export const formatVolume = (volume) => {
  return volume.toLocaleString();
};

// Time utilities
export const formatLastUpdate = (date) => {
  if (!date) return '';
  return date.toLocaleTimeString();
};

// Stock data utilities
export const isStockDataValid = (stock) => {
  return stock && stock.price && stock.price > 0;
};

export const getStockDisplayName = (stock) => {
  return stock.name || stock.symbol || 'Loading...';
};

// Order utilities
export const getOrderButtonText = (orderType, shares, isLoading) => {
  if (isLoading) return 'Processing...';
  return `${orderType === 'buy' ? 'Buy' : 'Sell'} ${shares} Share${shares > 1 ? 's' : ''}`;
};

// Error handling utilities
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);
  
  if (error.response?.status === 401) {
    return 'Authentication failed. Please sign in again.';
  }
  
  if (error.response?.status === 403) {
    return 'Access denied. Please check your permissions.';
  }
  
  if (error.response?.status === 429) {
    return 'Rate limit exceeded. Please try again later.';
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return defaultMessage;
}; 