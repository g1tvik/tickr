import React, { useRef, useEffect, useState } from "react";
import "./CascadeText.css";

const CascadeText = ({ lines, baseDelay = 0, delayStep = 120, className = "" }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`cascade-text ${className}`}>
      {lines.map((line, idx) => (
        <div
          key={idx}
          className={`cascade-line${visible ? " is-visible" : ""}`}
          style={{ transitionDelay: `${baseDelay + idx * delayStep}ms` }}
        >
          {line}
        </div>
      ))}
    </div>
  );
};

export default CascadeText; 