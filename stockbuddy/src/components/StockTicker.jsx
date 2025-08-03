import React, { useRef, useEffect, useState } from 'react';
import './StockTicker.css';

// Cache for stock data to avoid repeated API calls
let stockCache = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

const StockTicker = ({ stocks = [] }) => {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const [marketStocks, setMarketStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Full list of core US market leaders
  const coreStocks = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'SPY'
  ];

  // Fetch market data for core stocks
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check cache first
        const now = Date.now();
        if (stockCache.data && (now - cacheTimestamp) < CACHE_DURATION) {
          setMarketStocks(stockCache.data);
          setIsLoading(false);
          // Fade in immediately for cached data
          setTimeout(() => setIsVisible(true), 50);
          return;
        }
        
        // Fetch quotes for core stocks directly from the API
        const stockPromises = coreStocks.map(async (symbol) => {
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/trading/quote/${symbol}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                return data.quote;
              } else {
                console.warn(`Failed to fetch data for ${symbol}:`, data.message);
                return null;
              }
            } else {
              console.warn(`HTTP error for ${symbol}:`, response.status);
              return null;
            }
          } catch (error) {
            console.warn(`Error fetching ${symbol}:`, error);
            return null;
          }
        });

        const results = await Promise.all(stockPromises);
        const validStocks = results.filter(stock => stock !== null);
        
        if (validStocks.length > 0) {
          // Cache the results
          stockCache.data = validStocks;
          cacheTimestamp = now;
          setMarketStocks(validStocks);
          // Fade in after data is loaded
          setTimeout(() => setIsVisible(true), 100);
        } else {
          setError('No market data available');
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
        setError('Failed to load market data');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch data immediately
    fetchMarketData();

    // Refresh data every 60 seconds
    const interval = setInterval(fetchMarketData, 60000);
    
    return () => clearInterval(interval);
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

  // Helper function to safely format change percent
  const formatChangePercent = (changePercent) => {
    if (changePercent === null || changePercent === undefined) return '0.00';
    const num = parseFloat(changePercent);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

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
        <>
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
        </>
      ) : (
        // Show empty state with fade-in
        <ul>
          <li style={{ opacity: 0.4, transition: 'opacity 0.3s ease' }}>
            <span className="change">
              Loading market data...
            </span>
          </li>
        </ul>
      )}
    </div>
  );
};

export default StockTicker; 