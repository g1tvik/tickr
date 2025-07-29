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

async function testBarsEndpoint() {
  try {
    console.log('=== Testing Bars Endpoint ===');
    
    const baseUrl = 'https://paper-api.alpaca.markets';
    const headers = {
      'APCA-API-KEY-ID': envVars.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': envVars.ALPACA_SECRET_KEY
    };
    
    console.log('API Key:', envVars.ALPACA_API_KEY);
    console.log('Secret Key:', envVars.ALPACA_SECRET_KEY);
    
    // Test bars endpoint for TSLA
    console.log('\nTesting bars endpoint for TSLA...');
    try {
      const barsResponse = await axios.get(`${baseUrl}/v2/stocks/TSLA/bars`, {
        headers,
        params: {
          timeframe: '1Day',
          limit: 1
        }
      });
      console.log('Bars response:', JSON.stringify(barsResponse.data, null, 2));
    } catch (error) {
      console.error('Bars error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('General error:', error);
  }
}

testBarsEndpoint(); 