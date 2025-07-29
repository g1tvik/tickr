const axios = require('axios');

async function testYahooFinance() {
  try {
    console.log('=== Testing Yahoo Finance API ===');
    
    // Test Yahoo Finance API for TSLA
    console.log('\nTesting Yahoo Finance API for TSLA...');
    try {
      const yahooResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/TSLA?interval=1d&range=5d');
      console.log('Yahoo Finance response:', JSON.stringify(yahooResponse.data, null, 2));
      
      if (yahooResponse.data && yahooResponse.data.chart && yahooResponse.data.chart.result) {
        const result = yahooResponse.data.chart.result[0];
        const quotes = result.indicators.quote[0];
        const closes = quotes.close;
        
        if (closes && closes.length > 0) {
          const currentPrice = closes[closes.length - 1];
          const previousPrice = closes.length > 1 ? closes[closes.length - 2] : currentPrice;
          const change = currentPrice - previousPrice;
          const changePercent = previousPrice ? ((change / previousPrice) * 100) : 0;
          const volume = quotes.volume ? quotes.volume[quotes.volume.length - 1] : 0;

          console.log('\nProcessed data:');
          console.log('Current Price:', currentPrice);
          console.log('Previous Price:', previousPrice);
          console.log('Change:', change);
          console.log('Change %:', changePercent.toFixed(2) + '%');
          console.log('Volume:', volume);
        }
      }
    } catch (error) {
      console.error('Yahoo Finance error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('General error:', error);
  }
}

testYahooFinance(); 