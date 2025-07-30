import React, { useRef, useEffect } from 'react';
import './StockTicker.css';

const StockTicker = ({ stocks = [] }) => {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

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

  if (!stocks || stocks.length === 0) {
    return (
      <div className="stock-ticker">
        <p style={{ color: '#666', textAlign: 'center', fontWeight: 'bold' }}>
          Loading market data...
        </p>
      </div>
    );
  }

  return (
    <div className="stock-ticker" ref={containerRef}>
      <ul>
        {stocks.map((stock, idx) => {
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
        {stocks.map((stock, idx) => {
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
  );
};

export default StockTicker; 