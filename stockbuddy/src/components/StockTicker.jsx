import React, { useRef, useEffect, useState } from 'react';
import './StockTicker.css';
import { fetchStockData, getCachedData, CACHE_DURATION } from '../utils/stockCache';

// Helper function to get formatted timestamp
const getTimestamp = () => {
  return new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

const StockTicker = ({ stocks = [] }) => {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  
  // Full list of core US market leaders
  const coreStocks = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'SPY'
  ];

  // Check cache synchronously first to avoid showing loading state if data exists
  const cachedData = getCachedData();
  const [marketStocks, setMarketStocks] = useState(cachedData || []);
  const [isLoading, setIsLoading] = useState(!cachedData || cachedData.length === 0); // Only show loading if no cache
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  // Fetch market data for core stocks
  useEffect(() => {
    // Define fetch function first so it can be used in interval
    const fetchMarketData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`[${getTimestamp()}] 🎯 StockTicker: Starting to fetch market data`);
        
        // Use shared cache utility
        const stockData = await fetchStockData(coreStocks);
        
        if (stockData && stockData.length > 0) {
          setMarketStocks(stockData);
          console.log(`[${getTimestamp()}] 🎯 StockTicker: Successfully loaded ${stockData.length} stocks`);
          setIsVisible(true);
        } else {
          setError('No market data available');
          console.warn(`[${getTimestamp()}] 🎯 StockTicker: No market data available`);
          setIsVisible(true); // Still show the component even if no data
        }
      } catch (error) {
        console.error(`[${getTimestamp()}] 🎯 StockTicker: Error fetching market data:`, error);
        setError('Failed to load market data');
        setIsVisible(true); // Show component even on error
      } finally {
        setIsLoading(false);
      }
    };

    // Check if we already have cached data - if so, skip initial fetch
    const initialCache = getCachedData();
    if (initialCache && initialCache.length > 0) {
      console.log(`[${getTimestamp()}] 🎯 StockTicker: Using cached data, skipping initial fetch`);
      setMarketStocks(initialCache);
      setIsLoading(false);
      setIsVisible(true);
    } else {
      // No cache, fetch immediately
      fetchMarketData();
    }

    // Set up refresh interval for background updates (works for both cached and fresh data)
    const interval = setInterval(() => {
      console.log(`[${getTimestamp()}] 🎯 StockTicker: Auto-refreshing market data`);
      fetchMarketData();
    }, CACHE_DURATION);
    
    return () => {
      clearInterval(interval);
      console.log(`[${getTimestamp()}] 🎯 StockTicker: Cleanup - cleared refresh interval`);
    };
  }, []);

  useEffect(() => {
    let running = true;
    function animate() {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const leftFade = containerRect.left + containerRect.width * 0.10;
      const rightFade = containerRect.left + containerRect.width * 0.90;
      const minScale = 0.7;
      const maxScale = 1;
      itemRefs.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const itemCenter = rect.left + rect.width / 2;
        let scale = maxScale;
        if (itemCenter < leftFade) {
          const t = (itemCenter - containerRect.left) / (containerRect.width * 0.10);
          scale = minScale + t * (maxScale - minScale);
          if (scale < minScale) scale = minScale;
        } else if (itemCenter > rightFade) {
          const t = 1 - (itemCenter - rightFade) / (containerRect.width * 0.10);
          scale = minScale + t * (maxScale - minScale);
          if (scale < minScale) scale = minScale;
        } else {
          scale = maxScale;
        }
        el.style.transform = `scale(${scale})`;
      });
      if (running) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    return () => { running = false; };
  }, []);

  // Helper function to format percentage display with proper minus sign
  const formatPercentageDisplay = (changePercent) => {
    if (changePercent === null || changePercent === undefined) return '+0.00';
    const num = parseFloat(changePercent);
    if (isNaN(num)) return '+0.00';
    return num >= 0 ? `+${num.toFixed(2)}` : `−${Math.abs(num).toFixed(2)}`;
  };

  // Helper function to safely format price
  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    const num = parseFloat(price);
    if (isNaN(num)) return 'N/A';
    return num.toFixed(2);
  };

  // Helper function to check if change is positive
  const isPositiveChange = (changePercent) => {
    if (changePercent === null || changePercent === undefined) return false;
    const num = parseFloat(changePercent);
    return !isNaN(num) && num >= 0;
  };

  // Use provided stocks if available, otherwise use fetched market stocks
  const displayStocks = stocks.length > 0 ? stocks : marketStocks;

  // Always render the stock ticker container with fade-in transition
  return (
    <div 
      className="stock-ticker" 
      ref={containerRef}
      style={{ 
        opacity: isVisible ? 1 : 0, 
        transition: 'opacity 0.6s ease-in-out',
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transitionProperty: 'opacity, transform'
      }}
    >
      {displayStocks && displayStocks.length > 0 ? (
        <div className="stock-ticker-wrapper">
          <ul>
            {displayStocks.map((stock, idx) => {
              const isPositive = isPositiveChange(stock.changePercent);
              const formattedPrice = formatPrice(stock.price);
              const formattedChange = formatPercentageDisplay(stock.changePercent);
              
              return (
                <li key={stock.symbol + '-' + idx} ref={el => itemRefs.current[idx] = el}>
                  {isPositive ? (
                    <span className="change plus">
                      <span className="arrow plus">▲</span>
                      {stock.symbol} <span className="price">${formattedPrice}</span> 
                      (<span className="percent-change percent-positive">{formattedChange}%</span>)
                    </span>
                  ) : (
                    <span className="change minus">
                      <span className="arrow minus">▼</span>
                      {stock.symbol} <span className="price">${formattedPrice}</span> 
                      (<span className="percent-change percent-negative">{formattedChange}%</span>)
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <ul aria-hidden="true">
            {displayStocks.map((stock, idx) => {
              const isPositive = isPositiveChange(stock.changePercent);
              const formattedPrice = formatPrice(stock.price);
              const formattedChange = formatPercentageDisplay(stock.changePercent);
              
              return (
                <li key={stock.symbol + '-dup-' + idx}>
                  {isPositive ? (
                    <span className="change plus">
                      <span className="arrow plus">▲</span>
                      {stock.symbol} <span className="price">${formattedPrice}</span> 
                      (<span className="percent-change percent-positive">{formattedChange}%</span>)
                    </span>
                  ) : (
                    <span className="change minus">
                      <span className="arrow minus">▼</span>
                      {stock.symbol} <span className="price">${formattedPrice}</span> 
                      (<span className="percent-change percent-negative">{formattedChange}%</span>)
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        // Show loading or error state
        <ul>
          <li style={{ opacity: 0.6, transition: 'opacity 0.3s ease' }}>
            <span className="change">
              {isLoading ? 'Loading market data...' : (error || 'No market data available')}
            </span>
          </li>
        </ul>
      )}
    </div>
  );
};

export default StockTicker; 