import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { checkMarketStatus, validateOrder, handleApiError } from '../utils/tradeUtils';

export const useTrading = () => {
  const [selectedStock, setSelectedStock] = useState(null);
  const [orderType, setOrderType] = useState('buy');
  const [shares, setShares] = useState(1);
  const [portfolio, setPortfolio] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [marketStatus, setMarketStatus] = useState('loading');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      loadPortfolio();
      loadMarketData();
      checkMarketStatusAndSet();
    } else {
      setError('Please sign in to access trading features');
    }
  }, []);

  // Auto-refresh portfolio and selected stock every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      loadPortfolio();
      if (selectedStock) {
        updateSelectedStockPrice();
      }
    }, 60000); // Refresh every 60 seconds to stay within 200 calls/min limit

    return () => clearInterval(interval);
  }, [selectedStock, isAuthenticated]);

  const checkMarketStatusAndSet = () => {
    setMarketStatus(checkMarketStatus());
  };

  const loadPortfolio = async () => {
    try {
      const response = await api.getPortfolio();
      if (response.success) {
        setPortfolio(response.portfolio);
      } else {
        setError('Failed to load portfolio');
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      setError(handleApiError(error, 'Failed to load portfolio. Please check your connection.'));
    }
  };

  const loadMarketData = async () => {
    try {
      const response = await api.getMarketData();
      if (response.success) {
        setStocks(response.marketData);
        setLastUpdate(new Date());
        setError(null); // Clear any previous errors
      } else {
        setError('Failed to load market data');
      }
    } catch (error) {
      console.error('Error loading market data:', error);
      setError(handleApiError(error, 'Failed to load market data. Please check your connection.'));
    }
  };

  const updateSelectedStockPrice = async () => {
    if (!selectedStock) return;
    
    try {
      const response = await api.getStockQuote(selectedStock.symbol);
      if (response.success) {
        setSelectedStock(response.quote);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error updating stock price:', error);
    }
  };

  const handleStockSelect = async (stock) => {
    setIsLoading(true);
    try {
      // Get real-time quote for the selected stock
      const response = await api.getStockQuote(stock.symbol);
      if (response.success) {
        setSelectedStock(response.quote);
        setLastUpdate(new Date());
      } else {
        setSelectedStock(stock);
      }
    } catch (error) {
      console.error('Error getting stock quote:', error);
      setSelectedStock(stock);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderSubmit = async () => {
    if (!selectedStock) return;
    
    // Validate order before submitting
    const validationErrors = validateOrder(selectedStock, shares, orderType, portfolio);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = orderType === 'buy' 
        ? await api.buyStock(selectedStock.symbol, shares)
        : await api.sellStock(selectedStock.symbol, shares);
      
      if (response.success) {
        setPortfolio(response.portfolio);
        setShowOrderConfirmation(true);
        setTimeout(() => setShowOrderConfirmation(false), 3000);
        setSelectedStock(null);
        setShares(1);
      } else {
        setError(response.message || 'Order failed');
      }
    } catch (error) {
      console.error('Error executing order:', error);
      setError(handleApiError(error, 'Failed to execute order. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const refreshData = () => {
    loadPortfolio();
    loadMarketData();
    checkMarketStatusAndSet();
  };

  return {
    // State
    selectedStock,
    orderType,
    shares,
    portfolio,
    stocks,
    showOrderConfirmation,
    isLoading,
    error,
    marketStatus,
    isAuthenticated,
    lastUpdate,
    
    // Actions
    setSelectedStock,
    setOrderType,
    setShares,
    handleStockSelect,
    handleOrderSubmit,
    clearError,
    refreshData,
    loadPortfolio,
    loadMarketData,
    updateSelectedStockPrice,
  };
}; 