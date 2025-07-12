import React, { useRef, useEffect, useState } from "react";
import "./FadeInSection.css";

const FadeInSection = ({ children, delay = 0 }) => {
  const domRef = useRef();
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => setVisible(entry.isIntersecting));
    });
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fade-in-section${isVisible ? " is-visible" : ""}`}
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default FadeInSection; 