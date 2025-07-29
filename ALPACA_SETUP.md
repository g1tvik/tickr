# Alpaca API Setup Guide

## Current Issue
Your application is showing 403 Forbidden errors when trying to access Alpaca's market data API. This is because the Alpaca API keys are not configured.

## Quick Fix (Demo Mode)
The application has been updated to work in demo mode without API keys. It will use realistic demo data for stock prices.

## To Get Real Market Data (Optional)

### Step 1: Sign up for Alpaca
1. Go to [https://alpaca.markets/](https://alpaca.markets/)
2. Click "Get Started" and create a free account
3. Verify your email address

### Step 2: Get Your API Keys
1. After signing in, go to your dashboard
2. Navigate to "API Keys" section
3. Create a new API key pair
4. Copy both the **API Key ID** and **Secret Key**

### Step 3: Configure Your Backend
1. In the `auth-backend` folder, create a `.env` file
2. Add your API keys:

```env
# StockBuddy Backend Environment Variables

# JWT Secret for authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# Alpaca API Keys (get these from https://alpaca.markets/)
ALPACA_API_KEY=your_alpaca_api_key_here
ALPACA_SECRET_KEY=your_alpaca_secret_key_here

# Server Port
PORT=5001
```

### Step 4: Restart Your Backend
1. Stop your backend server (Ctrl+C)
2. Start it again: `npm start` or `node server.js`

## What You Get
- **Paper Trading**: Practice trading with virtual money
- **Real-time Market Data**: Live stock prices and quotes
- **Market Hours**: Real market data during trading hours
- **Historical Data**: Access to historical price data

## Free Tier Limits
- Paper trading: Unlimited
- Market data: Real-time quotes for US stocks
- API calls: Generous limits for personal use

## Troubleshooting
- If you still get 403 errors after adding keys, make sure they're correct
- Check that you're using the right environment (paper trading vs live)
- Ensure your account is verified

## Demo Mode Benefits
Even without API keys, the app will work with realistic demo data, allowing you to:
- Test the trading interface
- Practice buying and selling stocks
- Learn the platform features
- Build your portfolio strategy 