require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const tradingRoutes = require('./routes/trading');

const app = express();
app.use(express.json());
app.use(cors());

// File-based storage setup
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const portfoliosFile = path.join(dataDir, 'portfolios.json');
const transactionsFile = path.join(dataDir, 'transactions.json');
const lessonsFile = path.join(dataDir, 'lessons.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data files if they don't exist
const initializeDataFile = (filePath, defaultData) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

// Initialize all data files
initializeDataFile(usersFile, {});
initializeDataFile(portfoliosFile, {});
initializeDataFile(transactionsFile, {});
initializeDataFile(lessonsFile, {});

// File storage utilities
const fileStorage = {
  read: (filePath) => {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error.message);
      return {};
    }
  },
  
  write: (filePath, data) => {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error.message);
      return false;
    }
  },
  
  // User management
  getUsers: () => fileStorage.read(usersFile),
  saveUsers: (users) => fileStorage.write(usersFile, users),
  
  // Portfolio management
  getPortfolios: () => fileStorage.read(portfoliosFile),
  savePortfolios: (portfolios) => fileStorage.write(portfoliosFile, portfolios),
  
  // Transaction management
  getTransactions: () => fileStorage.read(transactionsFile),
  saveTransactions: (transactions) => fileStorage.write(transactionsFile, transactions),
  
  // Lesson progress management
  getLessons: () => fileStorage.read(lessonsFile),
  saveLessons: (lessons) => fileStorage.write(lessonsFile, lessons)
};

// Make fileStorage available to routes
app.locals.fileStorage = fileStorage;

app.get('/', (req, res) => {
  res.json({
    message: 'StockBuddy API running',
    storage: 'File-based storage',
    status: 'Ready'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    storage: 'file-based',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/trading', tradingRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 StockBuddy API running on port ${PORT}`);
  console.log(`📁 Using file-based storage in: ${dataDir}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}); 