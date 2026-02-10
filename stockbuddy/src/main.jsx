import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { fontHeading, fontBody, fontMono } from './fontPalette';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./globals.css"; // <-- import your custom styles after Bootstrap
import "./styles/tv.css"; // <-- import TradingView chart styles

// Sync font palette to CSS variables so all styles use the same fonts
document.documentElement.style.setProperty('--fontHeading', fontHeading);
document.documentElement.style.setProperty('--fontBody', fontBody);
document.documentElement.style.setProperty('--fontMono', fontMono);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 