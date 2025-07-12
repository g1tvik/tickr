import React from 'react';

function Card({ title, text, image, children }) {
  return (
    <div className="card shadow-sm" style={{ width: '18rem', margin: '1rem' }}>
      {image && <img src={image} className="card-img-top" alt={title} />}
      <div className="card-body">
        {title && <h5 className="card-title">{title}</h5>}
        {text && <p className="card-text">{text}</p>}
        {children}
      </div>
    </div>
  );
}

export default Card; 