# 🚀 StockBuddy Setup Guide

## ✅ MongoDB Removed - File-Based Storage Implemented!

Your project now uses **file-based storage** instead of MongoDB. This makes it much easier to set up and deploy!

## 📋 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Backend dependencies
cd auth-backend
npm install

# Frontend dependencies  
cd ../stockbuddy
npm install
```

### 2. Create Environment Files

**Backend (`auth-backend/.env`):**
```env
JWT_SECRET=your_super_secret_jwt_key_here
GOOGLE_CLIENT_ID=your_google_client_id_here
ALPHA_VANTAGE_API_KEY=demo
PORT=5001
```

**Frontend (`stockbuddy/.env`):**
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Start the Servers

**Terminal 1 (Backend):**
```bash
cd auth-backend
npm start
```

**Terminal 2 (Frontend):**
```bash
cd stockbuddy
npm run dev
```

### 4. Test Your Application

- **Backend**: http://localhost:5001/health
- **Frontend**: http://localhost:5173
- **Trading**: http://localhost:5173/trade
- **Lessons**: http://localhost:5173/learn

## 🎯 What's Changed

### ✅ **Removed:**
- MongoDB dependency
- Complex database setup
- Connection strings
- Database hosting costs

### ✅ **Added:**
- File-based storage (`auth-backend/data/`)
- Automatic data persistence
- Simple deployment
- No external database needed

## 📁 File Structure

```
auth-backend/
├── data/                    # File-based storage
│   ├── users.json          # User accounts
│   ├── portfolios.json     # Trading portfolios
│   ├── transactions.json   # Trade history
│   └── lessons.json        # Lesson progress
├── routes/
│   ├── auth.js             # Authentication
│   └── trading.js          # Trading API
└── server.js               # Main server
```

## 🔧 Data Files Created Automatically

The system automatically creates these files when you first run it:
- `users.json` - User accounts and authentication
- `portfolios.json` - Trading portfolios and positions
- `transactions.json` - Buy/sell transaction history
- `lessons.json` - Lesson completion and quiz scores

## 🚀 Deployment Benefits

### **Before (MongoDB):**
- Set up MongoDB database
- Configure connection strings
- Handle database hosting
- Manage database backups
- Pay for database hosting

### **Now (File-based):**
- Just upload files
- No database setup needed
- Automatic data persistence
- Free hosting possible
- Simple backup (just copy files)

## 🎉 Ready to Launch!

Your project is now **much simpler** to deploy:

1. **Railway/Heroku**: Just push code, no database setup
2. **Vercel**: Frontend deploys instantly
3. **Local Development**: Works immediately

## 🔍 Troubleshooting

### If you get "port already in use":
```bash
# Kill processes on port 5001
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

### If data files aren't created:
```bash
# Create data directory manually
mkdir auth-backend/data
```

### If authentication fails:
- Check your JWT_SECRET in the .env file
- Make sure the token is being sent in headers

## 🎯 Next Steps

1. **Test locally** - Make sure everything works
2. **Deploy backend** - Push to Railway/Heroku
3. **Deploy frontend** - Push to Vercel
4. **Get API keys** - Alpha Vantage for real stock data
5. **Launch!** - Share your completed project

Your StockBuddy project is now **production-ready** with file-based storage! 🚀 