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

async function testHistoricalBars() {
  try {
    console.log('=== Testing Historical Bars Endpoint ===');
    
    const baseUrl = 'https://paper-api.alpaca.markets';
    const headers = {
      'APCA-API-KEY-ID': envVars.ALPACA_API_KEY,
      'APCA-API-SECRET-KEY': envVars.ALPACA_SECRET_KEY
    };
    
    console.log('API Key:', envVars.ALPACA_API_KEY);
    console.log('Secret Key:', envVars.ALPACA_SECRET_KEY);
    
    // Test bars endpoint for TSLA with different timeframes
    console.log('\n1. Testing 1Day bars for TSLA...');
    try {
      const barsResponse = await axios.get(`${baseUrl}/v2/stocks/TSLA/bars`, {
        headers,
        params: {
          timeframe: '1Day',
          limit: 5
        }
      });
      console.log('1Day bars response:', JSON.stringify(barsResponse.data, null, 2));
    } catch (error) {
      console.error('1Day bars error:', error.response?.data || error.message);
    }
    
    console.log('\n2. Testing 1Hour bars for TSLA...');
    try {
      const barsResponse = await axios.get(`${baseUrl}/v2/stocks/TSLA/bars`, {
        headers,
        params: {
          timeframe: '1Hour',
          limit: 5
        }
      });
      console.log('1Hour bars response:', JSON.stringify(barsResponse.data, null, 2));
    } catch (error) {
      console.error('1Hour bars error:', error.response?.data || error.message);
    }
    
    console.log('\n3. Testing 1Min bars for TSLA...');
    try {
      const barsResponse = await axios.get(`${baseUrl}/v2/stocks/TSLA/bars`, {
        headers,
        params: {
          timeframe: '1Min',
          limit: 5
        }
      });
      console.log('1Min bars response:', JSON.stringify(barsResponse.data, null, 2));
    } catch (error) {
      console.error('1Min bars error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('General error:', error);
  }
}

testHistoricalBars(); 