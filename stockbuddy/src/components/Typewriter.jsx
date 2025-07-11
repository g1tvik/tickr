import React, { useState, useEffect } from "react";

const Typewriter = ({ text, speed = 70, className, style, ...props }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i === text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className} style={style} {...props}>{displayed}</span>
  );
};

export default Typewriter; 