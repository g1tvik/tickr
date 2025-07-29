const axios = require('axios');
const fs = require('fs');

// Load environment variables manually
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

async function testDirectAlpacaAPI() {
  try {
    console.log('=== Testing Direct Alpaca API ===');
    
    const baseUrl = 'https://paper-api.alpaca.markets';
    const headers = {
      'APCA-API-KEY-ID': envVars.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': envVars.ALPACA_SECRET_KEY
    };
    
    console.log('API Key:', envVars.ALPACA_API_KEY);
    console.log('Secret Key:', envVars.ALPACA_SECRET_KEY);
    
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