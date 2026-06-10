const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const clearTokenAndRedirect = (reason) => {
    console.warn(reason);
    localStorage.removeItem('token');
    window.location.href = '/signin';
  };

  try {
    const data = await response.json();
    if (!response.ok) {
      // Token expired / invalid
      if (response.status === 401) {
        clearTokenAndRedirect('Token expired or invalid, logging out...');
        throw new Error('Session expired. Please sign in again.');
      }
      // Stale JWT — references a userId that no longer exists (e.g. after data reset)
      if (response.status === 404 && /user not found/i.test(data.message || '')) {
        clearTokenAndRedirect('Stale session (user no longer exists), logging out...');
        throw new Error('Your session is no longer valid. Please sign in again.');
      }
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (error) {
    if (!response.ok) {
      if (response.status === 401) {
        clearTokenAndRedirect('Token expired or invalid, logging out...');
        throw new Error('Session expired. Please sign in again.');
      }
      throw new Error(`Request failed with status ${response.status}`);
    }
    throw new Error('Network error');
  }
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  // Check if authenticated (this will clear expired tokens)
  if (!isAuthenticated()) {
    // Don't throw error here, let the handleResponse function handle the redirect
    console.warn('No valid authentication token found');
  }
  
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
      timeframe: interval,
      limit: limit.toString()
    });
    
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    
    const url = `${API_BASE_URL}/trading/chart/${symbol}?${params}`;
    
    // Chart data doesn't require authentication
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

  // Realistic order placement — any type / intent / time-in-force.
  // params: { symbol, qty, intent, type, limitPrice?, stopPrice?, trailType?,
  //           trailValue?, timeInForce?, extendedHours? }
  placeOrder: (params) => fetch(`${API_BASE_URL}/trading/orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params)
  }).then(handleResponse),

  // List orders; pass { status: 'open' } for working orders only.
  getOrders: (status) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetch(`${API_BASE_URL}/trading/orders${qs}`, {
      headers: getAuthHeaders()
    }).then(handleResponse);
  },

  cancelOrder: (orderId) => fetch(`${API_BASE_URL}/trading/orders/${orderId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleResponse),

  // Account metrics: equity, buying power, margin, settled/unsettled cash, P&L.
  getAccount: () => fetch(`${API_BASE_URL}/trading/account`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  // Market clock + session (holiday aware). No auth required.
  getClock: () => fetch(`${API_BASE_URL}/trading/clock`, {
    headers: { 'Content-Type': 'application/json' }
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
  getLeaderboard: () => fetch(`${API_BASE_URL}/auth/leaderboard`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  // Shop endpoints
  getShopItems: () => fetch(`${API_BASE_URL}/shop/items`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  getPurchases: () => fetch(`${API_BASE_URL}/shop/purchases`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  purchaseItem: (itemId) => fetch(`${API_BASE_URL}/shop/purchase`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ itemId })
  }).then(handleResponse),

  useInventoryItem: (purchaseId) => fetch(`${API_BASE_URL}/shop/use`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ purchaseId })
  }).then(handleResponse),

  getActiveEffects: () => fetch(`${API_BASE_URL}/shop/active-effects`, {
    headers: getAuthHeaders()
  }).then(handleResponse),

  // AI Coach endpoints
  sendCoachMessage: (data) => {
      // AI coach routes don't require auth, so we'll make it optional
      const headers = {
        'Content-Type': 'application/json'
      };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      return fetch(`${API_BASE_URL}/ai-coach/chat`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
    }).then(handleResponse);
  },

  analyzeDecision: (data) => fetch(`${API_BASE_URL}/ai-coach/analyze`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  }).then(handleResponse),

  // Test endpoint to add coins for testing
  addTestCoins: (amount = 100) => fetch(`${API_BASE_URL}/auth/add-test-coins`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount })
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
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    
    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    if (exp && exp * 1000 < Date.now()) {
      console.warn('Token has expired, clearing...');
      localStorage.removeItem('token');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking token validity:', error);
    localStorage.removeItem('token');
    return false;
  }
};

// Utility function to get current user info from token
export const getCurrentUser = () => {
  // First check if authenticated (this will clear expired tokens)
  if (!isAuthenticated()) {
    return null;
  }
  
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
    console.error('Error decoding token:', error);
    localStorage.removeItem('token');
    return null;
  }
};

// Utility function to logout
export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/signin';
}; 