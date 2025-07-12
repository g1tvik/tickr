import React, { useState, useEffect } from 'react';
import './PageTransition.css';

const PageTransition = ({ children, isVisible }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      // Keep content rendered during fade out, only remove after transition completes
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match the CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div className={`page-transition ${isVisible ? 'page-visible' : 'page-hidden'}`}>
      {children}
    </div>
  );
};

export default PageTransition; 