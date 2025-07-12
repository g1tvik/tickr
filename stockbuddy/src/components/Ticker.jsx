import React, { useRef, useEffect } from 'react';
import './Ticker.css';

const companies = [
  'Salesforce', 'McKinsey & Co.', 'Reforge', 'Doordash', 'Daybreak', 'Jusbrasil', 'Jericho Security',
  'Serif', 'HubSpot', 'Coframe', 'Symbolic.ai'
];

const Ticker = () => {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    let running = true;
    function animate() {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const leftFade = containerRect.left + containerRect.width * 0.05;
      const rightFade = containerRect.left + containerRect.width * 0.95;
      const minScale = 0.7;
      const maxScale = 1;
      itemRefs.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const itemCenter = rect.left + rect.width / 2;
        let scale = maxScale;
        let opacity = maxScale;
        if (itemCenter < leftFade) {
          // Left fade-in zone
          const t = (itemCenter - containerRect.left) / (containerRect.width * 0.05);
          scale = minScale + t * (maxScale - minScale);
          opacity = scale;
          if (scale < minScale) scale = minScale;
          if (opacity < 0) opacity = 0;
        } else if (itemCenter > rightFade) {
          // Right fade-out zone
          const t = 1 - (itemCenter - rightFade) / (containerRect.width * 0.05);
          scale = minScale + t * (maxScale - minScale);
          opacity = scale;
          if (scale < minScale) scale = minScale;
          if (opacity < 0) opacity = 0;
        } else {
          // Center zone
          scale = maxScale;
          opacity = maxScale;
        }
        el.style.transform = `scale(${scale})`;
        el.style.opacity = opacity;
      });
      if (running) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    return () => { running = false; };
  }, []);

  return (
    <div className="ticker-container" ref={containerRef}>
      <div className="ticker-track">
        {companies.concat(companies).map((company, idx) => (
          <span
            className="ticker-item"
            key={idx}
            ref={el => itemRefs.current[idx] = el}
          >
            {company}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Ticker; 