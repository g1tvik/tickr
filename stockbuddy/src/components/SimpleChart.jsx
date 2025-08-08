import React, { useEffect, useRef, useState } from 'react';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

const SimpleChart = ({ 
  symbol, 
  stockData, 
  theme = 'dark',
  height = 400 
}) => {
  const canvasRef = useRef(null);
  const [timeframe, setTimeframe] = useState('1D');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!canvasRef.current || !stockData?.candles) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set background
    ctx.fillStyle = theme === 'dark' ? marbleDarkGray : marbleWhite;
    ctx.fillRect(0, 0, width, height);

    if (!stockData.candles || stockData.candles.length === 0) {
      // Draw placeholder
      ctx.fillStyle = marbleGray;
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No chart data available', width / 2, height / 2);
      return;
    }

    // Calculate chart dimensions
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Find min/max values
    const prices = stockData.candles.map(candle => [
      parseFloat(candle.high),
      parseFloat(candle.low)
    ]).flat();
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = marbleGray;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw candlesticks
    const candleWidth = chartWidth / stockData.candles.length;
    const candleSpacing = candleWidth * 0.8;

    stockData.candles.forEach((candle, index) => {
      const x = padding + (index * candleWidth) + (candleWidth - candleSpacing) / 2;
      const open = parseFloat(candle.open);
      const close = parseFloat(candle.close);
      const high = parseFloat(candle.high);
      const low = parseFloat(candle.low);

      // Calculate Y positions
      const yOpen = padding + chartHeight - ((open - minPrice) / priceRange) * chartHeight;
      const yClose = padding + chartHeight - ((close - minPrice) / priceRange) * chartHeight;
      const yHigh = padding + chartHeight - ((high - minPrice) / priceRange) * chartHeight;
      const yLow = padding + chartHeight - ((low - minPrice) / priceRange) * chartHeight;

      // Draw wick
      ctx.strokeStyle = close >= open ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleSpacing / 2, yHigh);
      ctx.lineTo(x + candleSpacing / 2, yLow);
      ctx.stroke();

      // Draw body
      const bodyHeight = Math.abs(yClose - yOpen);
      const bodyY = Math.min(yOpen, yClose);
      
      ctx.fillStyle = close >= open ? '#22c55e' : '#ef4444';
      ctx.fillRect(x, bodyY, candleSpacing, bodyHeight);
    });

    // Draw price labels
    ctx.fillStyle = theme === 'dark' ? marbleWhite : marbleDarkGray;
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const price = maxPrice - (i * priceRange / 5);
      const y = padding + (i * chartHeight / 5);
      ctx.fillText(`$${price.toFixed(2)}`, padding - 10, y + 4);
    }

    // Draw title
    ctx.fillStyle = theme === 'dark' ? marbleWhite : marbleDarkGray;
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${symbol} Chart (${timeframe})`, width / 2, 20);

  }, [stockData, theme, timeframe]);

  if (!symbol) {
    return (
      <div style={{
        backgroundColor: marbleLightGray,
        borderRadius: '20px',
        padding: '24px',
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: marbleGray,
        fontSize: '16px'
      }}>
        Select a stock to view the chart
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{
        backgroundColor: marbleLightGray,
        borderRadius: '20px',
        padding: '24px',
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: `3px solid ${marbleGray}`,
          borderTop: `3px solid ${marbleGold}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{
          color: marbleGray,
          fontSize: '14px'
        }}>
          Loading chart...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: marbleLightGray,
        borderRadius: '20px',
        padding: '24px',
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          color: '#ef4444',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: marbleGold,
            color: marbleDarkGray,
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: marbleLightGray,
      borderRadius: '20px',
      padding: '24px'
    }}>
      {/* Chart Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: marbleDarkGray,
          margin: 0,
          fontFamily: fontHeading
        }}>
          {symbol} Chart
        </h3>
        
        {/* Timeframe Selector */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          {['1H', '4H', '1D', '1W', '1M'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className="chart-timeframe-btn"
              style={{
                backgroundColor: timeframe === tf ? marbleGold : 'transparent',
                color: timeframe === tf ? marbleDarkGray : marbleGray,
                border: `1px solid ${timeframe === tf ? marbleGold : marbleGray}`,
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div style={{
        width: '100%',
        height: height,
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: theme === 'dark' ? marbleDarkGray : marbleWhite
      }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={height}
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
      </div>
    </div>
  );
};

export default SimpleChart;
