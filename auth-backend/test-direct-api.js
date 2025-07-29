const axios = require('axios');
require('dotenv').config({ path: './auth-backend/.env' });

async function testDirectAlpacaAPI() {
  try {
    console.log('=== Testing Direct Alpaca API ===');
    
    const baseUrl = 'https://paper-api.alpaca.markets';
    const headers = {
      'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
    };
    
    console.log('API Key:', process.env.ALPACA_API_KEY ? 'Set' : 'Not set');
    console.log('Secret Key:', process.env.ALPACA_SECRET_KEY ? 'Set' : 'Not set');
    
    // Test 1: Get account information
    console.log('\n1. Testing account endpoint...');
    try {
      const accountResponse = await axios.get(`${baseUrl}/v2/account`, { headers });
      console.log('Account response:', accountResponse.data);
    } catch (error) {
      console.error('Account error:', error.response?.data || error.message);
    }
    
    // Test 2: Get latest trade for TSLA
    console.log('\n2. Testing latest trade endpoint...');
    try {
      const tradeResponse = await axios.get(`${baseUrl}/v2/stocks/TSLA/trades/latest`, { headers });
      console.log('Latest trade response:', tradeResponse.data);
    } catch (error) {
      console.error('Latest trade error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('General error:', error);
  }
}

testDirectAlpacaAPI(); 