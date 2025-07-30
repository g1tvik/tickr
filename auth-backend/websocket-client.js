const WebSocket = require('ws');
const crypto = require('crypto');

class AlpacaWebSocketClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds
    this.liveData = new Map(); // Store live price data
    this.subscribedSymbols = new Set();
    this.connectionTimeout = null;
    this.heartbeatInterval = null;
  }

  // Initialize WebSocket connection
  async connect() {
    try {
      console.log('🔌 Connecting to Alpaca WebSocket stream...');
      
      // Try IEX stream first (real-time), fallback to delayed if needed
      const wsUrl = this.reconnectAttempts > 0 
        ? 'wss://stream.data.alpaca.markets/v2/delayed_sip'  // Fallback to delayed
        : 'wss://stream.data.alpaca.markets/v2/iex';         // Primary: IEX real-time
      
      console.log(`📡 Using stream: ${this.reconnectAttempts > 0 ? 'Delayed SIP' : 'IEX Real-time'}`);
      
      // Don't use headers for authentication - we'll authenticate via message
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        console.log('✅ WebSocket connection opened');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startConnectionTimeout();
      });

      this.ws.on('message', (data) => {
        try {
          const messages = JSON.parse(data);
          this.handleMessages(messages);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('close', (code, reason) => {
        console.log(`🔌 WebSocket connection closed: ${code} - ${reason}`);
        this.isConnected = false;
        this.isAuthenticated = false;
        this.clearTimers();
        this.handleReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });

    } catch (error) {
      console.error('❌ Failed to connect to WebSocket:', error);
      this.handleReconnect();
    }
  }

  // Handle incoming messages
  handleMessages(messages) {
    if (!Array.isArray(messages)) {
      messages = [messages];
    }

    for (const message of messages) {
      switch (message.T) {
        case 'success':
          if (message.msg === 'connected') {
            console.log('✅ WebSocket connected successfully');
            this.authenticate();
          } else if (message.msg === 'authenticated') {
            console.log('✅ WebSocket authenticated successfully');
            this.isAuthenticated = true;
            this.clearConnectionTimeout();
            this.startHeartbeat();
            this.subscribeToSymbols();
          }
          break;

        case 'error':
          console.error('❌ WebSocket error:', message);
          if (message.code === 406) {
            console.error('❌ Connection limit exceeded - only one connection allowed');
          } else if (message.code === 402) {
            console.error('❌ Authentication failed - check your API keys and subscription level');
            console.error('💡 Note: Stock stream requires a paid subscription. You may need to upgrade your Alpaca account.');
          } else if (message.code === 409) {
            console.error('❌ Insufficient subscription - stock stream not available with your current plan');
          }
          break;

        case 'subscription':
          console.log('📡 Current subscriptions:', message);
          break;

        case 't': // Trade
          this.handleTrade(message);
          break;

        case 'q': // Quote
          this.handleQuote(message);
          break;

        case 'b': // Bar (minute)
          this.handleBar(message);
          break;

        case 'd': // Daily bar
          this.handleDailyBar(message);
          break;

        default:
          // console.log('📨 Unhandled message type:', message.T);
          break;
      }
    }
  }

  // Handle trade messages
  handleTrade(message) {
    const symbol = message.S;
    const tradeData = {
      symbol: symbol,
      price: message.p,
      volume: message.s,
      timestamp: message.t,
      type: 'trade'
    };

    this.updateLiveData(symbol, tradeData);
  }

  // Handle quote messages
  handleQuote(message) {
    const symbol = message.S;
    const quoteData = {
      symbol: symbol,
      bidPrice: message.bp,
      askPrice: message.ap,
      bidSize: message.bs,
      askSize: message.as,
      timestamp: message.t,
      type: 'quote'
    };

    this.updateLiveData(symbol, quoteData);
  }

  // Handle bar messages (minute bars)
  handleBar(message) {
    const symbol = message.S;
    const barData = {
      symbol: symbol,
      open: message.o,
      high: message.h,
      low: message.l,
      close: message.c,
      volume: message.v,
      timestamp: message.t,
      type: 'bar'
    };

    this.updateLiveData(symbol, barData);
  }

  // Handle daily bar messages
  handleDailyBar(message) {
    const symbol = message.S;
    const dailyBarData = {
      symbol: symbol,
      open: message.o,
      high: message.h,
      low: message.l,
      close: message.c,
      volume: message.v,
      timestamp: message.t,
      type: 'dailyBar'
    };

    this.updateLiveData(symbol, dailyBarData);
  }

  // Update live data for a symbol
  updateLiveData(symbol, data) {
    if (!this.liveData.has(symbol)) {
      this.liveData.set(symbol, {});
    }

    const symbolData = this.liveData.get(symbol);
    symbolData[data.type] = data;
    symbolData.lastUpdate = new Date().toISOString();

    // Log significant updates
    if (data.type === 'trade' || data.type === 'dailyBar') {
      console.log(`📊 ${symbol} live update: $${data.price || data.close} (${data.volume?.toLocaleString() || 'N/A'} volume)`);
    }
  }

  // Authenticate with Alpaca
  authenticate() {
    if (!this.isConnected) return;

    // Check if API keys are available
    if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) {
      console.error('❌ Alpaca API keys not configured for WebSocket authentication');
      return;
    }

    const authMessage = {
      action: 'auth',
      key: process.env.ALPACA_API_KEY,
      secret: process.env.ALPACA_SECRET_KEY
    };

    console.log('🔐 Authenticating with Alpaca WebSocket...');
    console.log('🔑 API Key:', process.env.ALPACA_API_KEY.substring(0, 8) + '...');
    this.ws.send(JSON.stringify(authMessage));
  }

  // Subscribe to symbols
  subscribeToSymbols() {
    if (!this.isAuthenticated) return;

    // Subscribe to FAANG stocks for real-time data
    const symbols = ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL'];
    
    const subscribeMessage = {
      action: 'subscribe',
      trades: symbols,
      quotes: symbols,
      bars: symbols,
      dailyBars: symbols
    };

    console.log('📡 Subscribing to FAANG symbols:', symbols);
    this.ws.send(JSON.stringify(subscribeMessage));
    
    // Track subscribed symbols
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
  }

  // Get live data for a symbol
  getLiveData(symbol) {
    return this.liveData.get(symbol) || null;
  }

  // Get current price for a symbol
  getCurrentPrice(symbol) {
    const data = this.liveData.get(symbol);
    if (!data) return null;

    // Priority: trade > dailyBar > quote
    if (data.trade) return data.trade.price;
    if (data.dailyBar) return data.dailyBar.close;
    if (data.quote) return (data.quote.bidPrice + data.quote.askPrice) / 2;
    
    return null;
  }

  // Get current volume for a symbol
  getCurrentVolume(symbol) {
    const data = this.liveData.get(symbol);
    if (!data) return null;

    // Priority: dailyBar > trade
    if (data.dailyBar) return data.dailyBar.volume;
    if (data.trade) return data.trade.volume;
    
    return null;
  }

  // Start connection timeout
  startConnectionTimeout() {
    this.connectionTimeout = setTimeout(() => {
      console.error('⏰ Connection timeout - authentication took too long');
      this.ws.close();
    }, 15000); // 15 seconds
  }

  // Clear connection timeout
  clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  // Start heartbeat
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.isAuthenticated) {
        // Send ping to keep connection alive
        this.ws.ping();
      }
    }, 30000); // 30 seconds
  }

  // Clear timers
  clearTimers() {
    this.clearConnectionTimeout();
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Handle reconnection
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  // Disconnect
  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    this.clearTimers();
    if (this.ws) {
      this.ws.close();
    }
  }

  // Get connection status
  getStatus() {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated,
      subscribedSymbols: Array.from(this.subscribedSymbols),
      liveDataCount: this.liveData.size
    };
  }
}

module.exports = AlpacaWebSocketClient; 