// Test script to verify Alpaca API connection
// Run this with: node test-alpaca.js

const Alpaca = require('@alpacahq/alpaca-trade-api');
require('dotenv').config({ path: './auth-backend/.env' });

// Alpaca API configuration
const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY || 'demo',
  secretKey: process.env.ALPACA_SECRET_KEY || 'demo',
  paper: true, // Use paper trading
  usePolygon: false
});

console.log('Alpaca API Key:', process.env.ALPACA_API_KEY ? 'Set' : 'Not set');
console.log('Alpaca Secret Key:', process.env.ALPACA_SECRET_KEY ? 'Set' : 'Not set');

async function testAlpacaAPI() {
  try {
    console.log('\n=== Testing Alpaca API ===');
    
    // Test 1: Get latest trade for TSLA
    console.log('\n1. Testing getLatestTrade for TSLA...');
    try {
      const latestTrade = await alpaca.getLatestTrade('TSLA');
      console.log('Latest trade response:', latestTrade);
    } catch (error) {
      console.error('getLatestTrade error:', error.message);
    }
    
    // Test 2: Get bars for TSLA
    console.log('\n2. Testing getBarsV2 for TSLA...');
    try {
      const bars = await alpaca.getBarsV2('TSLA', {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        end: new Date(),
        limit: 2
      });
      console.log('Bars response:', JSON.stringify(bars, null, 2));
    } catch (error) {
      console.error('getBarsV2 error:', error.message);
    }
    
    // Test 3: Get account information
    console.log('\n3. Testing getAccount...');
    try {
      const account = await alpaca.getAccount();
      console.log('Account response:', account);
    } catch (error) {
      console.error('getAccount error:', error.message);
    }
    
  } catch (error) {
    console.error('General error:', error);
  }
}

testAlpacaAPI(); 