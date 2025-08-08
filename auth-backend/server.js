require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const tradingRoutes = require('./routes/trading');

// Helper function to get formatted timestamp
const getTimestamp = () => {
  return new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

// File-based storage class
class FileStorage {
  constructor(dataDir) {
    this.dataDir = dataDir;
  }

  readFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
      return {};
    } catch (error) {
      console.error(`[${getTimestamp()}] Error reading ${filePath}:`, error.message);
      return {};
    }
  }

  writeFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`[${getTimestamp()}] Error writing ${filePath}:`, error.message);
    }
  }

  getUsers() {
    return this.readFile(this.usersFile);
  }

  saveUsers(users) {
    this.writeFile(this.usersFile, users);
  }

  getPortfolios() {
    return this.readFile(this.portfoliosFile);
  }

  savePortfolios(portfolios) {
    this.writeFile(this.portfoliosFile, portfolios);
  }

  getTransactions() {
    return this.readFile(this.transactionsFile);
  }

  saveTransactions(transactions) {
    this.writeFile(this.transactionsFile, transactions);
  }
}

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// File-based storage setup
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const portfoliosFile = path.join(dataDir, 'portfolios.json');
const transactionsFile = path.join(dataDir, 'transactions.json');

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

// Initialize data files
initializeDataFile(usersFile, {});
initializeDataFile(portfoliosFile, {});
initializeDataFile(transactionsFile, {});

// Create file storage instance
const fileStorage = new FileStorage(dataDir);
fileStorage.usersFile = usersFile;
fileStorage.portfoliosFile = portfoliosFile;
fileStorage.transactionsFile = transactionsFile;

// Make file storage available to routes
app.locals.fileStorage = fileStorage;

// Debug middleware
app.use((req, res, next) => {
  console.log(`[${getTimestamp()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trading', tradingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[${getTimestamp()}] 🚀 StockBuddy API running on port ${PORT}`);
  console.log(`[${getTimestamp()}] 📁 Using file-based storage in: ${dataDir}`);
  console.log(`[${getTimestamp()}] 🔗 Health check: http://localhost:${PORT}/health`);
}); 