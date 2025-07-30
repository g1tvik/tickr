// Trade utility functions

// Market status utilities
export const checkMarketStatus = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Check if it's a weekday (Monday = 1, Sunday = 0)
  if (day === 0 || day === 6) {
    return 'closed';
  }
  
  // Check if it's during market hours (9:30 AM - 4:00 PM ET)
  // Note: This is a simplified check. In production, you'd want to account for timezone
  const marketOpen = 9 * 60 + 30; // 9:30 AM in minutes
  const marketClose = 16 * 60; // 4:00 PM in minutes
  const currentTime = hour * 60 + minute;
  
  return (currentTime >= marketOpen && currentTime <= marketClose) ? 'open' : 'closed';
};

export const getMarketStatusColor = (marketStatus) => {
  return marketStatus === 'open' ? '#22c55e' : '#ef4444';
};

export const getMarketStatusText = (marketStatus) => {
  return marketStatus === 'open' ? 'Market Open' : 'Market Closed';
};

// Portfolio utilities
export const getPositionValue = (position) => {
  const currentValue = position.shares * position.currentPrice;
  const costBasis = position.shares * position.avgPrice;
  const pnl = currentValue - costBasis;
  const pnlPercent = (pnl / costBasis) * 100;
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