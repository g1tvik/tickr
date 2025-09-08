const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  try {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (error) {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    throw new Error('Network error');
  }
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

  googleLogin: (credential) => fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: credential })
  }).then(handleResponse),

  // User profile and data endpoints
  getProfile: () => fetch(`${API_BASE_URL}/auth/profile`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  getUserData: () => fetch(`${API_BASE_URL}/auth/user-data`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  updateUserData: (data) => fetch(`${API_BASE_URL}/auth/user-data`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),

  // Trading endpoints
  getPortfolio: () => fetch(`${API_BASE_URL}/trading/portfolio`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  getStockQuote: (symbol) => fetch(`${API_BASE_URL}/trading/quote/${symbol}`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  // Chart data endpoint
  getChartData: (symbol, interval, limit = 500, startDate, endDate) => {
    const params = new URLSearchParams({
      timeframe: interval, // Backend expects 'timeframe', not 'interval'
      limit: limit.toString()
    });
    
    if (startDate) params.append('start', startDate); // Backend expects 'start', not 'startDate'
    if (endDate) params.append('end', endDate); // Backend expects 'end', not 'endDate'
    
    const url = `${API_BASE_URL}/trading/chart/${symbol}?${params}`;
    console.log('getChartData: Calling URL:', url);
    console.log('getChartData: Params:', { symbol, interval, limit, startDate, endDate });
    console.log('getChartData: Final params string:', params.toString());
    
    // Chart data doesn't require authentication
    // Backend route is /chart/:symbol, so symbol goes in the URL path
    return fetch(url, {
      headers: { 'Content-Type': 'application/json' }
    }).then(handleResponse);
  },

  searchStocks: (query) => fetch(`${API_BASE_URL}/trading/search?query=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  searchStocksAutocomplete: (query) => fetch(`${API_BASE_URL}/trading/autocomplete?query=${encodeURIComponent(query)}`, {
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

  // Live chart data endpoint
  getLiveChartData: (symbol) => fetch(`${API_BASE_URL}/trading/chart/${symbol}/live`, {
    headers: getAuthHeaders()
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

  // Settings endpoints
  updateProfile: (profileData) => fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData)
  }).then(handleResponse),

  getLearningPreferences: () => fetch(`${API_BASE_URL}/auth/learning-preferences`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  updateLearningPreferences: (preferences) => fetch(`${API_BASE_URL}/auth/learning-preferences`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(preferences)
  }).then(handleResponse),

  exportData: () => fetch(`${API_BASE_URL}/auth/export-data`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  resetProgress: () => fetch(`${API_BASE_URL}/auth/reset-progress`, {
    method: 'POST',
    headers: getAuthHeaders()
  }).then(handleResponse),

  deleteAccount: () => fetch(`${API_BASE_URL}/auth/account`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleResponse),

  // Send goal reminder email
  sendGoalReminder: () => fetch(`${API_BASE_URL}/auth/send-goal-reminder`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({})
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

// Utility function to get current user info from token
export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    // Decode JWT token (without verification for client-side display)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId,
      email: payload.email,
      username: payload.username
    };
  } catch (error) {
    return null;
  }
};

// Utility function to logout
export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/signin';
}; 