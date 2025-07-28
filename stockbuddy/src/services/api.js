const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'API request failed');
  }
  return response.json();
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const api = {
  // Authentication endpoints
  login: (credentials) => fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  }).then(handleResponse),

  register: (userData) => fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  }).then(handleResponse),

  googleAuth: (token) => fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  }).then(handleResponse),

  // Trading endpoints
  getPortfolio: () => fetch(`${API_BASE_URL}/trading/portfolio`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  getStockQuote: (symbol) => fetch(`${API_BASE_URL}/trading/quote/${symbol}`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  searchStocks: (query) => fetch(`${API_BASE_URL}/trading/search?query=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  buyStock: (symbol, shares) => fetch(`${API_BASE_URL}/trading/buy`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ symbol, shares })
  }).then(handleResponse),

  sellStock: (symbol, shares) => fetch(`${API_BASE_URL}/trading/sell`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ symbol, shares })
  }).then(handleResponse),

  getTransactions: () => fetch(`${API_BASE_URL}/trading/transactions`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  getMarketData: () => fetch(`${API_BASE_URL}/trading/market`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  // User progress endpoints (for lessons and quizzes)
  getUserProgress: () => fetch(`${API_BASE_URL}/user/progress`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  completeLesson: (lessonId) => fetch(`${API_BASE_URL}/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: getAuthHeaders()
  }).then(handleResponse),

  submitQuiz: (lessonId, answers) => fetch(`${API_BASE_URL}/quizzes/${lessonId}/submit`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ answers })
  }).then(handleResponse),

  // Leaderboard
  getLeaderboard: () => fetch(`${API_BASE_URL}/leaderboard`, {
    headers: getAuthHeaders()
  }).then(handleResponse),
};

// Mock data for development (fallback when API is not available)
export const mockData = {
  stocks: [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 2.15, changePercent: 1.24 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.56, change: -1.23, changePercent: -0.85 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: 5.67, changePercent: 1.52 },
    { symbol: 'TSLA', name: 'Tesla, Inc.', price: 248.42, change: -3.21, changePercent: -1.28 },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 145.24, change: 1.89, changePercent: 1.32 },
  ],
  portfolio: {
    balance: 10000,
    positions: [
      { symbol: 'AAPL', shares: 10, avgPrice: 170.00, currentPrice: 175.43 },
      { symbol: 'GOOGL', shares: 5, avgPrice: 145.00, currentPrice: 142.56 },
    ]
  }
};

// Utility function to check if API is available
export const isApiAvailable = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/trading/market`);
    return response.ok;
  } catch (error) {
    return false;
  }
}; 