import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createChart, IChartApi, CandlestickSeries } from 'lightweight-charts';
import { useChartStore } from '../stores/chartStore';
import { useChartData } from '../hooks/useChartData';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

export interface SuperChartProps {
  symbol: string;
  initialInterval?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';
  theme?: 'light' | 'dark';
  realtime?: boolean;
  height?: number;
  onChartReady?: (chart: any) => void;
  onDataUpdate?: (data: any) => void;
  onDrawingUpdate?: (drawings: any[]) => void;
  showDebugOverlay?: boolean;
  visibleRange?: { from: number; to: number };
}

export const SuperChart: React.FC<SuperChartProps> = ({
  symbol,
  initialInterval = '1d',
  theme = 'dark',
  realtime = false,
  height = 500,
  onChartReady,
  onDataUpdate,
  onDrawingUpdate,
  showDebugOverlay = false,
  visibleRange
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const [isChartReady, setIsChartReady] = useState(false);
  const [currentInterval, setCurrentInterval] = useState(initialInterval);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Zustand store for chart state
  const {
    drawings,
    indicators,
    chartSettings,
    addDrawing,
    updateDrawing,
    removeDrawing,
    addIndicator,
    removeIndicator,
    updateChartSettings
  } = useChartStore();

  // Custom hook for chart data
  const { chartData, isLoading: dataLoading, error: dataError } = useChartData(
    symbol,
    currentInterval,
    realtime
  );

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !symbol) return;

    console.log('Initializing chart for symbol:', symbol);

    const initChart = () => {
      const container = chartContainerRef.current;
      if (!container) return;

      // Force container dimensions
      container.style.width = '100%';
      container.style.minWidth = '400px';
      container.style.height = `${height}px`;

      // Get computed dimensions
      const rect = container.getBoundingClientRect();
      const containerWidth = rect.width || 800;
      const containerHeight = rect.height || height || 500;

      console.log('Container dimensions:', containerWidth, 'x', containerHeight);

      if (containerWidth === 0) {
        console.warn('Container has zero width, retrying...');
        setTimeout(initChart, 100);
        return;
      }

      setError(null);

      try {
        // Clean up existing chart
        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch (e) {
            console.warn('Chart cleanup warning:', e);
          }
          chartRef.current = null;
          candlestickSeriesRef.current = null;
        }

        console.log('Creating chart with dimensions:', containerWidth, 'x', containerHeight);

        // Create new chart
        const chart = createChart(container, {
          width: containerWidth,
          height: containerHeight,
          layout: {
            background: { color: theme === 'dark' ? '#1a1a1a' : '#ffffff' },
            textColor: theme === 'dark' ? '#ffffff' : '#000000',
          },
          grid: {
            vertLines: { color: theme === 'dark' ? '#333333' : '#e0e0e0' },
            horzLines: { color: theme === 'dark' ? '#333333' : '#e0e0e0' },
          },
          crosshair: {
            mode: 1,
          },
          rightPriceScale: {
            borderColor: theme === 'dark' ? '#333333' : '#e0e0e0',
            visible: true,
          },
          timeScale: {
            borderColor: theme === 'dark' ? '#333333' : '#e0e0e0',
            timeVisible: true,
            secondsVisible: false,
          },
        });

        chartRef.current = chart;

        // Add candlestick series
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        });
        candlestickSeriesRef.current = candlestickSeries;
        
        console.log('Chart initialized successfully');

        // Handle window resize
        const handleResize = () => {
          if (chartRef.current && chartContainerRef.current) {
            try {
              const newRect = chartContainerRef.current.getBoundingClientRect();
              const newWidth = newRect.width || 800;
              chartRef.current.applyOptions({
                width: newWidth,
              });
            } catch (e) {
              console.warn('Resize error:', e);
            }
          }
        };

        window.addEventListener('resize', handleResize);

        // Set chart as ready
        setIsChartReady(true);
        console.log('Chart marked as ready');
        
        // Force a small delay to ensure state is set
        setTimeout(() => {
          console.log('Chart ready state after delay:', isChartReady);
        }, 100);
        
        if (onChartReady) onChartReady(chart);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (chartRef.current) {
            try {
              chartRef.current.remove();
            } catch (e) {
              console.warn('Chart removal warning:', e);
            }
            chartRef.current = null;
            candlestickSeriesRef.current = null;
          }
        };
      } catch (err) {
        console.error('Error initializing chart:', err);
        setError('Failed to initialize chart');
        setIsChartReady(false);
        
        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch (e) {
            console.warn('Error cleanup warning:', e);
          }
          chartRef.current = null;
          candlestickSeriesRef.current = null;
        }
      }
    };

    // Start initialization
    initChart();
  }, [symbol, theme, height, onChartReady]);

  // Update chart data
  useEffect(() => {
    console.log('Data update effect triggered:', { 
      isChartReady, 
      hasData: !!chartData, 
      hasSeries: !!candlestickSeriesRef.current,
      dataLength: chartData?.candles?.length || 0
    });

    if (!chartData || !candlestickSeriesRef.current) {
      console.log('Missing data or series, skipping update');
      return;
    }

    try {
      const formatData = (data: any[]) => {
        if (!data || !Array.isArray(data)) return [];
        
        return data.map(item => ({
          time: Math.floor(item.timestamp),
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
        }));
      };

      const candleData = formatData(chartData.candles || []);

      if (candleData.length > 0) {
        console.log(`Setting ${candleData.length} candles for ${currentInterval}`);
        console.log('First candle:', candleData[0]);
        console.log('Last candle:', candleData[candleData.length - 1]);
        
        candlestickSeriesRef.current.setData(candleData);
        
        // Apply visible range if provided; otherwise fit content
        if (chartRef.current) {
          if (visibleRange && visibleRange.from && visibleRange.to) {
            try {
              chartRef.current.timeScale().setVisibleRange({ from: visibleRange.from, to: visibleRange.to });
            } catch (e) {
              console.warn('setVisibleRange failed, falling back to fitContent', e);
              chartRef.current.timeScale().fitContent();
            }
          } else {
            chartRef.current.timeScale().fitContent();
          }
        }
        
        console.log('Chart data set successfully');
      } else {
        console.warn('No candle data to display');
      }

      if (onDataUpdate) {
        onDataUpdate(chartData);
      }
    } catch (err) {
      console.error('Error updating chart data:', err);
      setError('Failed to update chart data');
    }
  }, [chartData, onDataUpdate, currentInterval]);

  // Update visible range when prop changes
  useEffect(() => {
    if (chartRef.current && visibleRange && visibleRange.from && visibleRange.to) {
      try {
        chartRef.current.timeScale().setVisibleRange({ from: visibleRange.from, to: visibleRange.to });
      } catch (e) {
        console.warn('setVisibleRange failed on prop change', e);
      }
    }
  }, [visibleRange]);

  // Handle interval changes
  const handleIntervalChange = useCallback((newInterval: string) => {
    if (newInterval !== currentInterval) {
      console.log(`Changing interval from ${currentInterval} to ${newInterval}`);
      setCurrentInterval(newInterval as any);
      // Don't reset chart state - just let the data update effect handle it
    }
  }, [currentInterval]);

  // Handle drawing updates
  useEffect(() => {
    if (onDrawingUpdate) {
      onDrawingUpdate(drawings);
    }
  }, [drawings, onDrawingUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {
          console.warn('Unmount cleanup warning:', e);
        }
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    };
  }, []);

  if (!symbol) {
    return (
      <div className="d-flex align-items-center justify-content-center" 
           style={{ 
             backgroundColor: marbleLightGray, 
             borderRadius: '20px', 
             padding: '24px', 
             height: height,
             color: marbleGray,
             fontSize: '16px'
           }}>
        Select a stock to view the chart
      </div>
    );
  }

  if (dataLoading && !chartData) {
    return (
      <div className="d-flex align-items-center justify-content-center flex-column" 
           style={{ 
             backgroundColor: marbleLightGray, 
             borderRadius: '20px', 
             padding: '24px', 
             height: height,
             gap: '16px'
           }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div style={{ color: marbleGray, fontSize: '14px' }}>
          Loading chart data...
        </div>
      </div>
    );
  }

  if (error || dataError) {
    return (
      <div className="d-flex align-items-center justify-content-center flex-column" 
           style={{ 
             backgroundColor: marbleLightGray, 
             borderRadius: '20px', 
             padding: '24px', 
             height: height,
             gap: '16px'
           }}>
        <div className="text-danger fw-bold">
          {error || dataError}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary btn-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`chart-container ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}
         style={{ borderRadius: '20px', padding: '24px' }}
         key={symbol}>
      
      {/* Simple Chart Toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className={`mb-0 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}
            style={{ fontFamily: fontHeading, fontWeight: 'bold' }}>
          {symbol}
        </h5>
        <div className="btn-group btn-group-sm" role="group">
          {['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'].map((interval) => (
            <button
              key={interval}
              type="button"
              className={`btn ${currentInterval === interval 
                ? 'btn-primary' 
                : theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'}`}
              onClick={() => handleIntervalChange(interval)}
              style={{
                minWidth: '40px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {interval}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="position-relative">
                 <div 
           ref={chartContainerRef}
           className="chart-engine"
           style={{
             width: '100%',
             minWidth: '400px',
             height: height,
             borderRadius: '12px',
             overflow: 'hidden',
             backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
             border: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`,
             position: 'relative',
             display: 'block'
           }}
          >
            {/* Debug overlay (hidden by default) */}
            {showDebugOverlay && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                color: 'white',
                fontSize: '12px',
                zIndex: 1000,
                pointerEvents: 'none',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                Chart: {chartContainerRef.current?.getBoundingClientRect()?.width || 0} x {height}
              </div>
            )}
          </div>

        {/* Tooltip */}
        {tooltipData && (
          <div
            ref={tooltipRef}
            className={`chart-tooltip ${theme === 'dark' ? 'bg-dark' : 'bg-light'} border rounded shadow-lg`}
            style={{
              position: 'absolute',
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y - 10,
              zIndex: 1000,
              minWidth: '200px',
              padding: '12px',
              fontSize: '12px',
              border: `1px solid ${theme === 'dark' ? marbleGray : marbleLightGray}`,
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <div className={`mb-2 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}
                 style={{ fontWeight: 'bold', fontSize: '11px' }}>
              {new Date(tooltipData.time * 1000).toLocaleString()}
            </div>
            <div className="row g-2">
              <div className="col-6">
                <div className={`${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
                  <span className="text-muted">O:</span> ${tooltipData.candlestick.open.toFixed(2)}
                </div>
                <div className={`${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
                  <span className="text-muted">H:</span> ${tooltipData.candlestick.high.toFixed(2)}
                </div>
              </div>
              <div className="col-6">
                <div className={`${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
                  <span className="text-muted">L:</span> ${tooltipData.candlestick.low.toFixed(2)}
                </div>
                <div className={`${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
                  <span className="text-muted">C:</span> ${tooltipData.candlestick.close.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
