import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

const LiveChart = ({ 
  symbol, 
  stockData, 
  onChartReady,
  theme = 'dark',
  height = 400 
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [timeframe, setTimeframe] = useState('1D');
  const [indicators, setIndicators] = useState({
    sma: true,
    ema: false,
    bollinger: false,
    rsi: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chart theme configuration
  const chartTheme = {
    dark: {
      layout: {
        background: { color: marbleDarkGray },
        textColor: marbleWhite,
      },
      grid: {
        vertLines: { color: marbleGray },
        horzLines: { color: marbleGray },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: marbleGray,
      },
      timeScale: {
        borderColor: marbleGray,
        timeVisible: true,
        secondsVisible: false,
      },
    },
    light: {
      layout: {
        background: { color: marbleWhite },
        textColor: marbleDarkGray,
      },
      grid: {
        vertLines: { color: marbleLightGray },
        horzLines: { color: marbleLightGray },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: marbleGray,
      },
      timeScale: {
        borderColor: marbleGray,
        timeVisible: true,
        secondsVisible: false,
      },
    }
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !symbol) return;

    setIsLoading(true);
    setError(null);

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
    }

    // Create new chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      ...chartTheme[theme],
      watermark: {
        color: marbleGray,
        visible: true,
        fontSize: 24,
        text: symbol,
        horzAlign: 'left',
        vertAlign: 'top',
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // Handle window resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    setIsChartReady(true);
    setIsLoading(false);
    if (onChartReady) onChartReady(chart);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [symbol, theme, height, onChartReady]);

  // Update chart data
  useEffect(() => {
    if (!isChartReady || !stockData || !candlestickSeriesRef.current) return;

    try {
      const formatData = (data) => {
        if (!data || !Array.isArray(data)) return [];
        
        return data.map(item => ({
          time: item.timestamp || item.time || new Date(item.date).getTime() / 1000,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseFloat(item.volume || 0)
        }));
      };

      const candleData = formatData(stockData.candles);
      const volumeData = formatData(stockData.candles);

      if (candleData.length > 0) {
        candlestickSeriesRef.current.setData(candleData);
      }
      
      if (volumeData.length > 0) {
        volumeSeriesRef.current.setData(volumeData);
      }
    } catch (err) {
      console.error('Error updating chart data:', err);
      setError('Failed to update chart data');
    }
  }, [stockData, isChartReady]);

  // Add technical indicators
  const addSMA = useCallback((period = 20) => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    const smaSeries = chartRef.current.addLineSeries({
      color: marbleGold,
      lineWidth: 2,
      title: `SMA ${period}`,
    });

    // Calculate SMA
    if (stockData?.candles) {
      const smaData = calculateSMA(stockData.candles, period);
      smaSeries.setData(smaData);
    }
  }, [stockData]);

  const addEMA = useCallback((period = 20) => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    const emaSeries = chartRef.current.addLineSeries({
      color: '#3b82f6',
      lineWidth: 2,
      title: `EMA ${period}`,
    });

    // Calculate EMA
    if (stockData?.candles) {
      const emaData = calculateEMA(stockData.candles, period);
      emaSeries.setData(emaData);
    }
  }, [stockData]);

  const addBollingerBands = useCallback((period = 20, stdDev = 2) => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    const upperSeries = chartRef.current.addLineSeries({
      color: '#ef4444',
      lineWidth: 1,
      title: 'Upper Band',
    });

    const lowerSeries = chartRef.current.addLineSeries({
      color: '#ef4444',
      lineWidth: 1,
      title: 'Lower Band',
    });

    const middleSeries = chartRef.current.addLineSeries({
      color: marbleGold,
      lineWidth: 1,
      title: 'Middle Band',
    });

    // Calculate Bollinger Bands
    if (stockData?.candles) {
      const bbData = calculateBollingerBands(stockData.candles, period, stdDev);
      upperSeries.setData(bbData.upper);
      lowerSeries.setData(bbData.lower);
      middleSeries.setData(bbData.middle);
    }
  }, [stockData]);

  // Helper functions for technical indicators
  const calculateSMA = (data, period) => {
    const smaData = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + parseFloat(item.close), 0);
      const sma = sum / period;
      smaData.push({
        time: data[i].timestamp || data[i].time || new Date(data[i].date).getTime() / 1000,
        value: sma
      });
    }
    return smaData;
  };

  const calculateEMA = (data, period) => {
    const emaData = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    let ema = data.slice(0, period).reduce((acc, item) => acc + parseFloat(item.close), 0) / period;
    
    for (let i = 0; i < data.length; i++) {
      if (i >= period - 1) {
        ema = (parseFloat(data[i].close) * multiplier) + (ema * (1 - multiplier));
      }
      emaData.push({
        time: data[i].timestamp || data[i].time || new Date(data[i].date).getTime() / 1000,
        value: ema
      });
    }
    return emaData;
  };

  const calculateBollingerBands = (data, period, stdDev) => {
    const upper = [];
    const lower = [];
    const middle = [];

    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const closes = slice.map(item => parseFloat(item.close));
      const sma = closes.reduce((acc, val) => acc + val, 0) / period;
      
      const variance = closes.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      const upperBand = sma + (standardDeviation * stdDev);
      const lowerBand = sma - (standardDeviation * stdDev);

      upper.push({
        time: data[i].timestamp || data[i].time || new Date(data[i].date).getTime() / 1000,
        value: upperBand
      });
      
      lower.push({
        time: data[i].timestamp || data[i].time || new Date(data[i].date).getTime() / 1000,
        value: lowerBand
      });
      
      middle.push({
        time: data[i].timestamp || data[i].time || new Date(data[i].date).getTime() / 1000,
        value: sma
      });
    }

    return { upper, lower, middle };
  };

  // Handle indicator toggles
  useEffect(() => {
    if (indicators.sma) {
      addSMA(20);
    }
    if (indicators.ema) {
      addEMA(20);
    }
    if (indicators.bollinger) {
      addBollingerBands(20, 2);
    }
  }, [indicators, addSMA, addEMA, addBollingerBands]);

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

      {/* Indicators Toggle */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        {Object.entries(indicators).map(([indicator, enabled]) => (
          <button
            key={indicator}
            onClick={() => setIndicators(prev => ({ ...prev, [indicator]: !enabled }))}
            className="chart-indicator-btn"
            style={{
              backgroundColor: enabled ? marbleGold : 'transparent',
              color: enabled ? marbleDarkGray : marbleGray,
              border: `1px solid ${enabled ? marbleGold : marbleGray}`,
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '500',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            {indicator}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef}
        className="chart-container"
        style={{
          width: '100%',
          height: height,
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      />
    </div>
  );
};

export default LiveChart;
