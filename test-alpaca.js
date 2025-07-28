// Test script to verify Alpaca API connection
// Run this with: node test-alpaca.js

require('dotenv').config();
const Alpaca = require('@alpacahq/alpaca-trade-api');

// Initialize Alpaca with your API keys
const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY || 'demo',
  secretKey: process.env.ALPACA_SECRET_KEY || 'demo',
  paper: true, // Use paper trading
  usePolygon: false
});

async function testAlpacaConnection() {
  console.log('🔍 Testing Alpaca API Connection...\n');
  
  try {
    // Test 1: Get account information
    console.log('📊 Test 1: Getting account information...');
    const account = await alpaca.getAccount();
    console.log('✅ Account Status:', account.status);
    console.log('💰 Cash Balance:', `$${parseFloat(account.cash).toFixed(2)}`);
    console.log('📈 Portfolio Value:', `$${parseFloat(account.portfolio_value).toFixed(2)}\n`);
    
    // Test 2: Get stock quote for AAPL
    console.log('🍎 Test 2: Getting AAPL stock quote...');
    const aaplQuote = await alpaca.getLatestTrade('AAPL');
    if (aaplQuote) {
      console.log('✅ AAPL Price:', `$${aaplQuote.p}`);
      console.log('📊 Volume:', aaplQuote.s);
      console.log('⏰ Timestamp:', new Date(aaplQuote.t).toLocaleString());
    } else {
      console.log('⚠️ No quote data available (market might be closed)');
    }
    console.log('');
    
    // Test 3: Get recent bars for AAPL using the correct method
    console.log('📈 Test 3: Getting recent price bars for AAPL...');
    const bars = await alpaca.getBarsV2('AAPL', {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      end: new Date(),
      limit: 2
    });
    
    if (bars && bars.length > 0) {
      const latestBar = bars[bars.length - 1];
      console.log('✅ Latest Bar:');
      console.log('   Open:', `$${latestBar.o}`);
      console.log('   High:', `$${latestBar.h}`);
      console.log('   Low:', `$${latestBar.l}`);
      console.log('   Close:', `$${latestBar.c}`);
      console.log('   Volume:', latestBar.v);
    } else {
      console.log('⚠️ No bar data available');
    }
    console.log('');
    
    // Test 4: Check if market is open
    console.log('🏛️ Test 4: Checking market status...');
    const clock = await alpaca.getClock();
    console.log('✅ Market Status:', clock.is_open ? 'OPEN' : 'CLOSED');
    console.log('📅 Next Open:', new Date(clock.next_open).toLocaleString());
    console.log('📅 Next Close:', new Date(clock.next_close).toLocaleString());
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Your Alpaca API is working correctly.');
    
  } catch (error) {
    console.error('❌ Error testing Alpaca API:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your API keys in .env file');
    console.log('2. Make sure you\'re using Paper Trading keys (not live)');
    console.log('3. Verify your Alpaca account is activated');
    console.log('4. Check if you have internet connection');
    console.log('5. Make sure you have the latest Alpaca SDK installed');
  }
}

// Run the test
testAlpacaConnection(); 