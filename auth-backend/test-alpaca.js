const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.ALPACA_API_KEY;
const SECRET_KEY = process.env.ALPACA_SECRET_KEY;

const headers = {
  'APCA-API-KEY-ID': API_KEY,
  'APCA-API-SECRET-KEY': SECRET_KEY
};

const endpoints = [
  // Broker APIs
  { name: 'Live Broker API', url: 'https://broker-api.alpaca.markets/v2/assets/AAPL' },
  { name: 'Sandbox Broker API', url: 'https://broker-api.sandbox.alpaca.markets/v2/assets/AAPL' },
  
  // Data APIs
  { name: 'Live Data API', url: 'https://data.alpaca.markets/v2/assets' },
  { name: 'Sandbox Data API', url: 'https://data.sandbox.alpaca.markets/v2/assets' },
  
  // Trading APIs
  { name: 'Live Trading API', url: 'https://api.alpaca.markets/v2/assets/AAPL' },
  { name: 'Sandbox Trading API', url: 'https://paper-api.alpaca.markets/v2/assets/AAPL' },
  
  // Account Info
  { name: 'Live Account', url: 'https://api.alpaca.markets/v2/account' },
  { name: 'Sandbox Account', url: 'https://paper-api.alpaca.markets/v2/account' }
];

async function testEndpoint(name, url, params = {}) {
  try {
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    
    const response = await axios.get(url, { headers, params });
    
    console.log(`✅ SUCCESS! Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`❌ FAILED! Status: ${error.response?.status || 'No response'}`);
    console.log(`   Error: ${error.message}`);
    if (error.response?.data) {
      console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Alpaca API Endpoints');
  console.log('================================');
  console.log(`API Key: ${API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`Secret Key: ${SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.url);
    results.push({ ...endpoint, ...result });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 SUMMARY');
  console.log('==========');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}`);
  successful.forEach(r => console.log(`   - ${r.name}`));
  
  console.log(`❌ Failed: ${failed.length}`);
  failed.forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  
  if (successful.length > 0) {
    console.log('\n🎉 WORKING ENDPOINTS FOUND!');
    console.log('Use these in your trading.js file:');
    successful.forEach(r => {
      if (r.url.includes('/assets/')) {
        console.log(`   - ${r.name}: ${r.url.replace('/AAPL', '/{symbol}')}`);
      } else if (r.url.includes('/assets')) {
        console.log(`   - ${r.name}: ${r.url}`);
      }
    });
  } else {
    console.log('\n⚠️ No working endpoints found. Check your API keys and account permissions.');
  }
}

runTests().catch(console.error); 