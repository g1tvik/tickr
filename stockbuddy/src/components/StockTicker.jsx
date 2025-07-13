import React, { useRef, useEffect, useState } from 'react';
import './StockTicker.css';

const ALPHA_API_KEY = "X5A9KJJE73YAL7GY";
const API_URL = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_API_KEY}`;

const StockTicker = () => {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const [stocks, setStocks] = useState([]);

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
        // Interleave gainers and losers
        const interleaved = [];
        for (let i = 0; i < 3; i++) {
          if (gainers[i]) interleaved.push(gainers[i]);
          if (losers[i]) interleaved.push(losers[i]);
        }
        setStocks(interleaved);
      } catch (e) {
        setStocks([]);
      }
    }
    fetchTopMovers();
    const interval = setInterval(fetchTopMovers, 3600000); // 60 minutes
    return () => clearInterval(interval);
  }, []);

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
    </div>
  );
};

export default StockTicker; 