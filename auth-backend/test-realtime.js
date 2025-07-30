const WebSocket = require('ws');
require('dotenv').config();

console.log('🧪 Testing Real-time FAANG Data');
console.log('================================');

const API_KEY = process.env.ALPACA_API_KEY;
const SECRET_KEY = process.env.ALPACA_SECRET_KEY;

if (!API_KEY || !SECRET_KEY) {
  console.error('❌ API keys not configured');
  process.exit(1);
}

// Use IEX stream (working with your subscription)
const ws = new WebSocket('wss://stream.data.alpaca.markets/v2/iex');

let authenticated = false;
let subscribed = false;

ws.on('open', () => {
  console.log('✅ Connected to IEX WebSocket stream');
  
  // Authenticate
  const authMessage = {
    action: 'auth',
    key: API_KEY,
    secret: SECRET_KEY
  };
  
  console.log('🔐 Authenticating...');
  ws.send(JSON.stringify(authMessage));
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
          console.log('✅ Connection confirmed');
        } else if (message.msg === 'authenticated') {
          console.log('✅ Authentication successful');
          authenticated = true;
          
          // Subscribe to FAANG stocks
          const subscribeMessage = {
            action: 'subscribe',
            trades: ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL'],
            quotes: ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL'],
            bars: ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL'],
            dailyBars: ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL']
          };
          
          console.log('📡 Subscribing to FAANG stocks...');
          ws.send(JSON.stringify(subscribeMessage));
        }
      } else if (message.T === 'subscription') {
        console.log('✅ Subscription successful');
        console.log('📊 Current subscriptions:', message);
        subscribed = true;
      } else if (message.T === 't') {
        // Trade data
        console.log(`📊 TRADE: ${message.S} - $${message.p} (${message.s} shares) at ${message.t}`);
      } else if (message.T === 'q') {
        // Quote data
        console.log(`📊 QUOTE: ${message.S} - Bid: $${message.bp} Ask: $${message.ap} at ${message.t}`);
      } else if (message.T === 'd') {
        // Daily bar data
        console.log(`📊 DAILY: ${message.S} - Close: $${message.c} Volume: ${message.v.toLocaleString()} at ${message.t}`);
      } else if (message.T === 'error') {
        console.error('❌ WebSocket error:', message);
      }
    }
  } catch (error) {
    console.error('❌ Error parsing message:', error);
  }
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Connection closed: ${code} - ${reason}`);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

// Keep running for 30 seconds to collect data
setTimeout(() => {
  console.log('\n⏰ Test completed. Closing connection...');
  ws.close();
  process.exit(0);
}, 30000);

console.log('⏰ Listening for real-time data for 30 seconds...'); 