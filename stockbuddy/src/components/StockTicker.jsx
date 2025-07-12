import React, { useRef, useEffect } from 'react';
import './StockTicker.css';

const stocks = [
  { company: 'AAPL', price: '181.16', change: '-1.36 (-0.75%)', type: 'minus' },
  { company: 'TSLA', price: '199.40', change: '+7.43 (+3.87%)', type: 'plus' },
  { company: 'NFLX', price: '587.65', change: '+4.09 (+0.70%)', type: 'plus' },
  { company: 'GOOG', price: '138.75', change: '-6.54 (-4.50%)', type: 'minus' },
  { company: 'NVDA', price: '790.92', change: '+2.75 (+0.35%)', type: 'plus' },
  { company: 'MSFT', price: '407.54', change: '-2.80 (-0.68%)', type: 'minus' },
  { company: 'META', price: '487.05', change: '+5.31 (+1.10%)', type: 'plus' },
  { company: 'KO', price: '60.34', change: '-0.37 (-0.61%)', type: 'minus' },
];

const StockTicker = () => {
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
          // Left fade-in zone: grow from minScale to maxScale
          const t = (itemCenter - containerRect.left) / (containerRect.width * 0.10);
          scale = minScale + t * (maxScale - minScale);
          if (scale < minScale) scale = minScale;
        } else if (itemCenter > rightFade) {
          // Right fade-out zone: shrink from maxScale to minScale
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

  return (
    <div className="stock-ticker" ref={containerRef}>
      <ul>
        {stocks.map((stock, idx) => (
          <li className={stock.type} key={idx} ref={el => itemRefs.current[idx] = el}>
            <span className="company">{stock.company}</span>
            <span className="price">{stock.price}</span>
            <span className="change">{stock.change}</span>
          </li>
        ))}
      </ul>
      <ul aria-hidden="true">
        {stocks.map((stock, idx) => (
          <li className={stock.type} key={idx} ref={el => itemRefs.current[idx + stocks.length] = el}>
            <span className="company">{stock.company}</span>
            <span className="price">{stock.price}</span>
            <span className="change">{stock.change}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StockTicker; 