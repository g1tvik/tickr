const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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
  if (!token) {
    throw new Error('No authentication token found. Please sign in.');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
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

// Utility function to check if API is available
export const isApiAvailable = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Utility function to logout
export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/signin';
}; 