import React, { forwardRef } from 'react';
import { UTCTimestamp } from 'lightweight-charts';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';

interface ChartTooltipProps {
  data: {
    time: UTCTimestamp;
    candlestick: {
      open: number;
      high: number;
      low: number;
      close: number;
    };
    volume?: {
      value: number;
    };
  };
  position: { x: number; y: number };
  theme: 'light' | 'dark';
}

export const ChartTooltip = forwardRef<HTMLDivElement, ChartTooltipProps>(
  ({ data, position, theme }, ref) => {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
    };

    const formatVolume = (volume: number) => {
      if (volume >= 1e9) {
        return `${(volume / 1e9).toFixed(2)}B`;
      } else if (volume >= 1e6) {
        return `${(volume / 1e6).toFixed(2)}M`;
      } else if (volume >= 1e3) {
        return `${(volume / 1e3).toFixed(2)}K`;
      }
      return volume.toLocaleString();
    };

    const formatTime = (timestamp: UTCTimestamp) => {
      const date = new Date(timestamp * 1000);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const getPriceChange = () => {
      const change = data.candlestick.close - data.candlestick.open;
      const changePercent = (change / data.candlestick.open) * 100;
      return { change, changePercent };
    };

    const { change, changePercent } = getPriceChange();
    const isPositive = change >= 0;

    return (
      <div
        ref={ref}
        className={`chart-tooltip ${theme === 'dark' ? 'bg-dark' : 'bg-light'} border rounded shadow-lg`}
        style={{
          position: 'absolute',
          left: position.x + 10,
          top: position.y - 10,
          zIndex: 1000,
          minWidth: '200px',
          padding: '12px',
          fontSize: '12px',
          border: `1px solid ${theme === 'dark' ? marbleGray : marbleLightGray}`,
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}
      >
        {/* Time */}
        <div className={`mb-2 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}
             style={{ fontWeight: 'bold', fontSize: '11px' }}>
          {formatTime(data.time)}
        </div>

        {/* OHLC Data */}
        <div className="row g-2 mb-2">
          <div className="col-6">
            <div className={`${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
              <span className="text-muted">O:</span> {formatPrice(data.candlestick.open)}
            </div>
            <div className={`${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
              <span className="text-muted">H:</span> {formatPrice(data.candlestick.high)}
            </div>
          </div>
          <div className="col-6">
            <div className={`${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
              <span className="text-muted">L:</span> {formatPrice(data.candlestick.low)}
            </div>
            <div className={`${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
              <span className="text-muted">C:</span> {formatPrice(data.candlestick.close)}
            </div>
          </div>
        </div>

        {/* Price Change */}
        <div className={`mb-2 ${isPositive ? 'text-success' : 'text-danger'}`}
             style={{ fontWeight: 'bold' }}>
          {isPositive ? '+' : ''}{formatPrice(change)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </div>

        {/* Volume */}
        {data.volume && (
          <div className={`${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
            <span className="text-muted">Vol:</span> {formatVolume(data.volume.value)}
          </div>
        )}

        {/* Arrow pointing to data point */}
        <div
          className="tooltip-arrow"
          style={{
            position: 'absolute',
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: `6px solid ${theme === 'dark' ? marbleDarkGray : marbleWhite}`,
          }}
        />
      </div>
    );
  }
);

ChartTooltip.displayName = 'ChartTooltip';
