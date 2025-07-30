import React from 'react';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

// Market Status Component
export const MarketStatus = ({ marketStatus, lastUpdate }) => {
  const getMarketStatusColor = () => {
    return marketStatus === 'open' ? '#22c55e' : '#ef4444';
  };

  const getMarketStatusText = () => {
    return marketStatus === 'open' ? 'Market Open' : 'Market Closed';
  };

  return (
    <div className="trade-header-section">
      <div className="header-top">
        <h1 className="trade-main-title">
          📈 Paper Trading
        </h1>
        <div className="market-status">
          <div 
            className="status-indicator"
            style={{ backgroundColor: getMarketStatusColor() }}
          ></div>
          {getMarketStatusText()}
        </div>
      </div>
      <p className="trade-description">
        💰 Practice trading with virtual money. Real-time data powered by Alpaca API.
        {lastUpdate && (
          <span className="last-update">
            🔄 Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </p>
    </div>
  );
};

// Stock Info Component
export const StockInfo = ({ selectedStock }) => {
  return (
    <div className="stock-info-card">
      <div className="stock-info-header">
        <div>
          <div className="stock-symbol">
            {selectedStock.symbol}
          </div>
          <div className="stock-name">
            {selectedStock.name || 'Loading...'}
          </div>
        </div>
        <div className="stock-price-section">
          <div className="stock-price">
            ${selectedStock.price ? selectedStock.price.toFixed(2) : 'Loading...'}
          </div>
          {selectedStock.change !== undefined && selectedStock.changePercent !== undefined && selectedStock.price && (
            <div className={`stock-change ${selectedStock.change >= 0 ? 'positive' : 'negative'}`}>
              {selectedStock.change >= 0 ? '+' : ''}{parseFloat(selectedStock.change).toFixed(2)} ({parseFloat(selectedStock.changePercent).toFixed(2)}%)
            </div>
          )}
        </div>
      </div>
      {selectedStock.volume && (
        <div className="stock-volume">
          Volume: {selectedStock.volume.toLocaleString()}
        </div>
      )}
    </div>
  );
};

// Order Form Component
export const OrderForm = ({ 
  orderType, 
  setOrderType, 
  shares, 
  setShares, 
  selectedStock, 
  calculateOrderTotal, 
  handleOrderSubmit, 
  isLoading 
}) => {
  return (
    <div className="order-form-card">
      <div className="order-type-section">
        <label className="form-label">
          Order Type
        </label>
        <div className="order-type-buttons">
          <button
            onClick={() => setOrderType('buy')}
            disabled={isLoading}
            className={`order-type-btn ${orderType === 'buy' ? 'buy-active' : 'inactive'}`}
          >
            Buy
          </button>
          <button
            onClick={() => setOrderType('sell')}
            disabled={isLoading}
            className={`order-type-btn ${orderType === 'sell' ? 'sell-active' : 'inactive'}`}
          >
            Sell
          </button>
        </div>
      </div>

      <div className="shares-section">
        <label className="form-label">
          Shares
        </label>
        <input
          type="number"
          min="1"
          value={shares}
          onChange={(e) => setShares(parseInt(e.target.value) || 1)}
          disabled={isLoading}
          className="shares-input"
        />
      </div>

      <div className="order-summary">
        <div className="summary-row">
          <span className="summary-label">Price per share:</span>
          <span className="summary-value">${selectedStock.price ? selectedStock.price.toFixed(2) : 'Loading...'}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Shares:</span>
          <span className="summary-value">{shares}</span>
        </div>
        <div className="summary-row total">
          <span className="summary-label">Total:</span>
          <span className="summary-value">${calculateOrderTotal().toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handleOrderSubmit}
        disabled={isLoading || !selectedStock.price}
        className="submit-order-btn"
      >
        {isLoading ? 'Processing...' : `${orderType === 'buy' ? 'Buy' : 'Sell'} ${shares} Share${shares > 1 ? 's' : ''}`}
      </button>
    </div>
  );
};

// Account Balance Component
export const AccountBalance = ({ portfolio }) => {
  return (
    <div className="balance-card">
      <h2 className="card-title">
        Account Balance
      </h2>
      {portfolio ? (
        <>
          <div className="balance-amount">
            ${portfolio.balance.toFixed(2)}
          </div>
          <div className="balance-subtitle">
            Available for trading
          </div>
        </>
      ) : (
        <div className="loading-text">
          Loading balance...
        </div>
      )}
    </div>
  );
};

// Portfolio Positions Component
export const PortfolioPositions = ({ portfolio, getPositionValue }) => {
  return (
    <div className="portfolio-card">
      <h2 className="card-title">
        Portfolio
      </h2>
      
      {!portfolio ? (
        <div className="loading-text">
          Loading portfolio...
        </div>
      ) : portfolio.positions.length === 0 ? (
        <div className="empty-portfolio">
          No positions yet. Start trading to build your portfolio!
        </div>
      ) : (
        <div className="positions-list">
          {portfolio.positions.map((position) => {
            const { currentValue, pnl, pnlPercent } = getPositionValue(position);
            return (
              <div key={position.symbol} className="position-item">
                <div className="position-header">
                  <div className="position-symbol">
                    {position.symbol}
                  </div>
                  <div className={`position-pnl ${pnl >= 0 ? 'positive' : 'negative'}`}>
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                  </div>
                </div>
                <div className="position-details">
                  <span>{position.shares} shares</span>
                  <span>${currentValue.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Market Watch Component
export const MarketWatch = ({ stocks, lastUpdate, loadMarketData, isLoading }) => {
  return (
    <div className="market-watch-card">
      <div className="market-watch-header">
        <h2 className="card-title">
          Market Watch
        </h2>
        <div className="market-watch-controls">
          {lastUpdate && (
            <span className="last-update-time">
              Last: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadMarketData}
            disabled={isLoading}
            className="refresh-btn"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      {stocks.length > 0 ? (
        <div className="market-ticker-container">
          {/* StockTicker component will be rendered here */}
        </div>
      ) : (
        <div className="loading-text">
          Loading market data...
        </div>
      )}
    </div>
  );
};

// Order Confirmation Component
export const OrderConfirmation = ({ showOrderConfirmation }) => {
  if (!showOrderConfirmation) return null;
  
  return (
    <div className="order-confirmation">
      Order executed successfully! Check your portfolio for updates.
    </div>
  );
}; 