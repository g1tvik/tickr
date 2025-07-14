import React, { useRef, useEffect, useState } from 'react';
import './StockTicker.css';

const ALPHA_API_KEY = "X5A9KJJE73YAL7GY";
const API_URL = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_API_KEY}`;
const DAILY_LIMIT = 25;
const CACHE_KEY = "stock_ticker_cache";
const COUNT_KEY = "stock_ticker_count";

const getToday = () => new Date().toISOString().slice(0, 10);

const StockTicker = () => {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const [stocks, setStocks] = useState([]);
  const [limitReached, setLimitReached] = useState(false);
  const [noCache, setNoCache] = useState(false);

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

  useEffect(() => {
    const today = getToday();
    const cacheRaw = localStorage.getItem(CACHE_KEY);
    const cache = cacheRaw ? JSON.parse(cacheRaw) : null;
    const countRaw = localStorage.getItem(COUNT_KEY);
    const countObj = countRaw ? JSON.parse(countRaw) : { date: today, count: 0 };

    // Always show cached data if available
    if (cache && cache.stocks && cache.stocks.length > 0) {
      setStocks(cache.stocks);
    }

    // If limit reached, do not fetch, just show cache (do NOT clear stocks)
    if (countObj.date === today && countObj.count >= DAILY_LIMIT) {
      setLimitReached(true);
      if (!cache || !cache.stocks || cache.stocks.length === 0) {
        setNoCache(true);
        setStocks([]); // Only clear if truly no cache
      }
      return;
    }

    // Otherwise, fetch new data, update cache and count
    async function fetchTopMovers() {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const gainers = (data.top_gainers || []).slice(0, 3).map(stock => ({
          ...stock,
          type: 'gainer',
        }));
        const losers = (data.top_losers || []).slice(0, 3).map(stock => ({
          ...stock,
          type: 'loser',
        }));
        const interleaved = [];
        for (let i = 0; i < 3; i++) {
          if (gainers[i]) interleaved.push(gainers[i]);
          if (losers[i]) interleaved.push(losers[i]);
        }
        setStocks(interleaved);
        // Cache result
        localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, stocks: interleaved }));
        // Increment count
        countObj.count += 1;
        localStorage.setItem(COUNT_KEY, JSON.stringify(countObj));
      } catch (e) {
        // If fetch fails, show cache if available, else show no data
        if (!cache || !cache.stocks || cache.stocks.length === 0) {
          setNoCache(true);
          setStocks([]);
        }
      }
    }
    fetchTopMovers();
    // Only auto-refresh if under limit
    const interval = setInterval(() => {
      const countRaw = localStorage.getItem(COUNT_KEY);
      const countObj = countRaw ? JSON.parse(countRaw) : { date: getToday(), count: 0 };
      if (countObj.date === getToday() && countObj.count < DAILY_LIMIT) {
        fetchTopMovers();
      }
    }, 3600000); // 60 minutes
    return () => clearInterval(interval);
  }, []);

  if (noCache) {
    return (
      <div className="stock-ticker stock-ticker-limit">
        <p style={{ color: '#ff6666', textAlign: 'center', fontWeight: 'bold' }}>
          No cached stock data available. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="stock-ticker" ref={containerRef}>
      <ul>
        {stocks.map((stock, idx) => (
          <li key={stock.ticker + '-' + idx} ref={el => itemRefs.current[idx] = el}>
            {stock.type === 'gainer' && (
              <span className="change plus">
                <span className="arrow plus">▲</span>{stock.ticker} ${stock.price} (+{parseFloat(stock.change_percentage).toFixed(2)}%)
              </span>
            )}
            {stock.type === 'loser' && (
              <span className="change minus">
                <span className="arrow minus">▼</span>{stock.ticker} ${stock.price} ({parseFloat(stock.change_percentage).toFixed(2)}%)
              </span>
            )}
          </li>
        ))}
      </ul>
      <ul aria-hidden="true">
        {stocks.map((stock, idx) => (
          <li key={stock.ticker + '-dup-' + idx}>
            {stock.type === 'gainer' && (
              <span className="change plus">
                <span className="arrow plus">▲</span>{stock.ticker} ${stock.price} (+{parseFloat(stock.change_percentage).toFixed(2)}%)
              </span>
            )}
            {stock.type === 'loser' && (
              <span className="change minus">
                <span className="arrow minus">▼</span>{stock.ticker} ${stock.price} ({parseFloat(stock.change_percentage).toFixed(2)}%)
              </span>
            )}
          </li>
        ))}
      </ul>
      {limitReached && (
        <div style={{ textAlign: 'center', color: '#E6C87A', fontWeight: 'bold', marginTop: 8 }}>
          Daily stock API request limit reached. Showing last cached data.
        </div>
      )}
    </div>
  );
};

export default StockTicker; 