import React from 'react';
import tk, { panel, heading } from '../theme/terminal';

function Card({ title, text, image, children }) {
  return (
    <div style={{ ...panel, width: '18rem', margin: '1rem', overflow: 'hidden' }}>
      {image && (
        <img
          src={image}
          alt={title}
          style={{ display: 'block', width: '100%', borderBottom: `1px solid ${tk.hair}` }}
        />
      )}
      <div style={{ padding: 20 }}>
        {title && (
          <h5 style={{ ...heading, fontSize: 16, lineHeight: 1.3, margin: 0, marginBottom: text ? 8 : 0 }}>
            {title}
          </h5>
        )}
        {text && (
          <p style={{ fontFamily: tk.fontBody, fontSize: 13, lineHeight: 1.55, color: tk.muted, margin: 0 }}>
            {text}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

export default Card; 