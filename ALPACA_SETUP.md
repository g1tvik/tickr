# 🚀 Alpaca API Setup Guide for StockBuddy

## 🎯 **Why Alpaca is Perfect for Your Project**

Alpaca is a **professional-grade trading API** that's perfect for StockBuddy because:

- ✅ **Real-time stock data** during market hours
- ✅ **Paper trading simulation** (no real money)
- ✅ **Generous free tier** (1000 API calls/day)
- ✅ **Professional quality** data used by real trading platforms
- ✅ **Excellent documentation** and support

## 📋 **Step-by-Step Alpaca Setup**

### **Step 1: Create Alpaca Account**

1. Go to [Alpaca Markets](https://alpaca.markets/)
2. Click "Get Started" or "Sign Up"
3. Create a free account
4. Verify your email

### **Step 2: Get Your API Keys**

1. **Log into your Alpaca dashboard**
2. **Go to "Paper Trading"** (not live trading)
3. **Find your API keys:**
   - API Key ID
   - Secret Key
4. **Copy both keys** (you'll need them for your .env file)

### **Step 3: Configure Your Environment**

**Update your `auth-backend/.env` file:**

```env
# Required
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5001

# Alpaca API (recommended)
ALPACA_API_KEY=your_alpaca_api_key_here
ALPACA_SECRET_KEY=your_alpaca_secret_key_here

# Optional
GOOGLE_CLIENT_ID=your_google_client_id_here
```

### **Step 4: Install Dependencies**

```bash
cd auth-backend
npm install
```

The Alpaca SDK is already included in your package.json.

## 🎯 **What You Get with Alpaca**

### **Real-time Features:**
- ✅ Live stock prices during market hours (9:30 AM - 4:00 PM ET)
- ✅ Real-time price changes and volume
- ✅ Professional-grade market data
- ✅ Paper trading simulation

### **Free Tier Limits:**
- ✅ 1000 API calls per day
- ✅ Real-time data for US stocks
- ✅ Paper trading account
- ✅ No credit card required

### **Supported Stocks:**
- ✅ All major US stocks (AAPL, GOOGL, MSFT, etc.)
- ✅ ETFs and other securities
- ✅ Real-time quotes and historical data

## 🔧 **Testing Your Alpaca Setup**

### **Test 1: Check API Connection**

```bash
# Start your backend
cd auth-backend
npm start

# Test the health endpoint
curl http://localhost:5001/health
```

### **Test 2: Get Stock Quote**

```bash
# Test getting a stock quote
curl http://localhost:5001/api/trading/quote/AAPL
```

You should see real Apple stock data!

### **Test 3: Test Trading Interface**

1. Open your frontend: http://localhost:5173
2. Go to the Trading page
3. Search for "AAPL" or "GOOGL"
4. You should see real-time prices

## 🚨 **Important Notes**

### **Market Hours:**
- **Real-time data**: 9:30 AM - 4:00 PM Eastern Time (Monday-Friday)
- **Outside market hours**: You'll get the last closing price
- **Weekends/holidays**: Last available price

### **API Limits:**
- **Free tier**: 1000 API calls per day
- **Rate limiting**: Be mindful of how often you refresh data
- **Paper trading**: Unlimited simulated trades

### **Paper Trading vs Live Trading:**
- **Paper trading**: Simulated trades, no real money
- **Live trading**: Real money (requires additional setup)
- **Your project uses paper trading** - completely safe!

## 🔍 **Troubleshooting**

### **If you get "API key invalid":**
1. Double-check your API keys
2. Make sure you're using **Paper Trading** keys (not live)
3. Verify your account is activated

### **If you get "No data found":**
1. Check if the market is open
2. Try a popular stock like "AAPL"
3. Check your API call limits

### **If prices seem old:**
1. Market might be closed
2. Check the timestamp in the response
3. Real-time data only available during market hours

## 🎉 **Benefits Over Alpha Vantage**

| Feature | Alpha Vantage | Alpaca |
|---------|---------------|--------|
| **Real-time data** | ❌ 15-min delay | ✅ Real-time |
| **API calls/day** | 300 (5/min) | 1000 |
| **Data quality** | ⚠️ Basic | ✅ Professional |
| **Paper trading** | ❌ No | ✅ Yes |
| **Documentation** | ⚠️ Limited | ✅ Excellent |
| **Support** | ⚠️ Basic | ✅ Professional |

## 🚀 **Next Steps**

1. **Set up Alpaca** (follow steps above)
2. **Test your integration** (use test commands)
3. **Deploy to production** (same API keys work)
4. **Enjoy real-time trading!**

## 💡 **Pro Tips**

1. **Use paper trading keys** - completely safe for development
2. **Monitor your API usage** - stay within 1000 calls/day
3. **Cache data** - don't refresh prices too frequently
4. **Handle market hours** - show appropriate messages when market is closed

Your StockBuddy project will now have **professional-grade stock data** and **real-time paper trading** capabilities! 🎯 