import React, { useRef, useEffect, useState } from 'react';
import './StockTicker.css';

const ALPHA_API_KEY = import.meta.env.VITE_ALPHA_API_KEY;
const API_URL = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_API_KEY}`;
const DAILY_LIMIT = 25;
const CACHE_KEY = "stock_ticker_cache";
const COUNT_KEY = "stock_ticker_count";
const LAST_FETCH_KEY = "stock_ticker_last_fetch";
const FETCH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

const getToday = () => new Date().toISOString().slice(0, 10);

function stocksEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].ticker !== b[i].ticker ||
      a[i].price !== b[i].price ||
      a[i].change_percentage !== b[i].change_percentage ||
      a[i].type !== b[i].type
    ) {
      return false;
    }
  }
  return true;
}

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
    const lastFetchRaw = localStorage.getItem(LAST_FETCH_KEY);
    const lastFetch = lastFetchRaw ? parseInt(lastFetchRaw, 10) : 0;
    const now = Date.now();

    // If API limit reached, show cache if available
    if (countObj.date === today && countObj.count >= DAILY_LIMIT) {
      setLimitReached(true);
      if (cache && cache.stocks && cache.stocks.length > 0) {
        setStocks(cache.stocks);
      } else {
        setNoCache(true);
        setStocks([]);
      }
      return;
    }

    // If under limit, but less than 1 hour since last fetch, show cached stocks if available
    if (lastFetch && now - lastFetch < FETCH_INTERVAL_MS) {
      if (cache && cache.stocks && cache.stocks.length > 0) {
        setStocks(cache.stocks);
      } else {
        setNoCache(true);
        setStocks([]);
      }
      return;
    }

    // Otherwise, fetch new data
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
        // Only update if data is different from cache
        if (!cache || !stocksEqual(interleaved, cache.stocks)) {
          setStocks(interleaved);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, stocks: interleaved }));
          countObj.count += 1;
          localStorage.setItem(COUNT_KEY, JSON.stringify(countObj));
          localStorage.setItem(LAST_FETCH_KEY, now.toString());
        } else {
          // Data is the same, just update last fetch timestamp and show cached stocks
          setStocks(cache.stocks);
          localStorage.setItem(LAST_FETCH_KEY, now.toString());
        }
      } catch (e) {
        // On fetch failure, show cache if available
        if (cache && cache.stocks && cache.stocks.length > 0) {
          setStocks(cache.stocks);
        } else {
          setNoCache(true);
          setStocks([]);
        }
      }
    }
    fetchTopMovers();
    // No interval: only fetch on mount or after 1 hour
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
                <span className="arrow plus">▲</span>{stock.ticker} ${stock.price} (<span className="percent-change percent-positive">+{parseFloat(stock.change_percentage).toFixed(2)}%</span>)
              </span>
            )}
            {stock.type === 'loser' && (
              <span className="change minus">
                <span className="arrow minus">▼</span>{stock.ticker} ${stock.price} (<span className="percent-change percent-negative">{parseFloat(stock.change_percentage).toFixed(2)}%</span>)
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
                <span className="arrow plus">▲</span>{stock.ticker} ${stock.price} (<span className="percent-change percent-positive">+{parseFloat(stock.change_percentage).toFixed(2)}%</span>)
              </span>
            )}
            {stock.type === 'loser' && (
              <span className="change minus">
                <span className="arrow minus">▼</span>{stock.ticker} ${stock.price} (<span className="percent-change percent-negative">{parseFloat(stock.change_percentage).toFixed(2)}%</span>)
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