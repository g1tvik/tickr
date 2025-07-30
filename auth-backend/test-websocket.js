const WebSocket = require('ws');
require('dotenv').config();

console.log('🧪 Testing Alpaca WebSocket Connection');
console.log('=====================================');

// Check API keys
const API_KEY = process.env.ALPACA_API_KEY;
const SECRET_KEY = process.env.ALPACA_SECRET_KEY;

console.log(`API Key: ${API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`Secret Key: ${SECRET_KEY ? '✅ Set' : '❌ Missing'}`);

if (!API_KEY || !SECRET_KEY) {
  console.error('❌ API keys not configured. Please set ALPACA_API_KEY and ALPACA_SECRET_KEY in your .env file.');
  process.exit(1);
}

// Test different WebSocket URLs
const testUrls = [
  {
    name: 'Stock Stream (SIP)',
    url: 'wss://stream.data.alpaca.markets/v2/sip'
  },
  {
    name: 'Stock Stream (IEX)',
    url: 'wss://stream.data.alpaca.markets/v2/iex'
  },
  {
    name: 'Delayed Stock Stream',
    url: 'wss://stream.data.alpaca.markets/v2/delayed_sip'
  },
  {
    name: 'Test Stream',
    url: 'wss://stream.data.alpaca.markets/v2/test'
  }
];

async function testWebSocket(name, url) {
  return new Promise((resolve) => {
    console.log(`\n🔌 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    
    const ws = new WebSocket(url);
    let authenticated = false;
    let timeout;
    
    ws.on('open', () => {
      console.log('   ✅ Connected');
      
      // Send authentication
      const authMessage = {
        action: 'auth',
        key: API_KEY,
        secret: SECRET_KEY
      };
      
      console.log('   🔐 Authenticating...');
      ws.send(JSON.stringify(authMessage));
      
      // Set timeout
      timeout = setTimeout(() => {
        console.log('   ⏰ Authentication timeout');
        ws.close();
        resolve({ success: false, error: 'timeout' });
      }, 10000);
    });
    
    ws.on('message', (data) => {
      try {
        const messages = JSON.parse(data);
        if (!Array.isArray(messages)) {
          messages = [messages];
        }
        
        for (const message of messages) {
          if (message.T === 'success') {
            if (message.msg === 'connected') {
              console.log('   ✅ Connection confirmed');
            } else if (message.msg === 'authenticated') {
              console.log('   ✅ Authentication successful');
              authenticated = true;
              clearTimeout(timeout);
              
              // Try to subscribe to a test symbol
              const subscribeMessage = {
                action: 'subscribe',
                trades: ['AAPL']
              };
              
              console.log('   📡 Testing subscription...');
              ws.send(JSON.stringify(subscribeMessage));
            }
          } else if (message.T === 'error') {
            console.log(`   ❌ Error: ${message.code} - ${message.msg}`);
            clearTimeout(timeout);
            ws.close();
            resolve({ success: false, error: message.msg, code: message.code });
          } else if (message.T === 'subscription') {
            console.log('   ✅ Subscription successful');
            console.log('   📊 Ready to receive real-time data');
            ws.close();
            resolve({ success: true });
          } else if (message.T === 't' || message.T === 'q') {
            console.log(`   📊 Received ${message.T === 't' ? 'trade' : 'quote'} data for ${message.S}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error parsing message: ${error.message}`);
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`   🔌 Connection closed: ${code} - ${reason}`);
      clearTimeout(timeout);
      if (!authenticated) {
        resolve({ success: false, error: 'connection closed' });
      }
    });
    
    ws.on('error', (error) => {
      console.log(`   ❌ WebSocket error: ${error.message}`);
      clearTimeout(timeout);
      resolve({ success: false, error: error.message });
    });
  });
}

async function runTests() {
  const results = [];
  
  for (const test of testUrls) {
    const result = await testWebSocket(test.name, test.url);
    results.push({ ...test, ...result });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 TEST RESULTS');
  console.log('===============');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}`);
  successful.forEach(r => console.log(`   - ${r.name}`));
  
  console.log(`❌ Failed: ${failed.length}`);
  failed.forEach(r => console.log(`   - ${r.name}: ${r.error}${r.code ? ` (code: ${r.code})` : ''}`));
  
  if (successful.length > 0) {
    console.log('\n🎉 WORKING WEBSOCKET STREAMS FOUND!');
    console.log('Use these in your websocket-client.js file:');
    successful.forEach(r => console.log(`   - ${r.name}: ${r.url}`));
  } else {
    console.log('\n⚠️ No working WebSocket streams found.');
    console.log('Possible issues:');
    console.log('1. API keys are incorrect');
    console.log('2. Account doesn\'t have access to real-time data');
    console.log('3. Need to upgrade Alpaca subscription');
    console.log('4. Network connectivity issues');
  }
}

runTests().catch(console.error); 