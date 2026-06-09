import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createChart, IChartApi, CandlestickSeries } from 'lightweight-charts';
import { useChartStore } from '../stores/chartStore';
import { useChartData } from '../hooks/useChartData';
import { white, lightGray, gray, marbleDarkGray, marbleGold } from '../marblePalette';
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
  // Optional explicit historical window to fetch from the API (YYYY-MM-DD)
  dateRange?: { start: string; end: string };
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
  visibleRange,
  dateRange
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
  const { chartData, isLoading: dataLoading, error: dataError, refetch } = useChartData(
    symbol,
    currentInterval,
    realtime,
    dateRange?.start,
    dateRange?.end
  );

  // Keep the latest callbacks in refs so changing their identity never forces a
  // chart re-creation (passing inline callbacks would otherwise rebuild the chart).
  const onChartReadyRef = useRef(onChartReady);
  onChartReadyRef.current = onChartReady;

  // Initialize the chart once per symbol/theme/height. Returns a REAL cleanup so
  // React — including the StrictMode mount→unmount→mount double-invoke — tears the
  // chart down and rebuilds it correctly. (The previous version discarded its
  // cleanup, which under StrictMode could leave the container with no canvas.)
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !symbol) return;

    container.style.width = '100%';
    container.style.height = `${height}px`;
    const width = Math.max(container.getBoundingClientRect().width, 400);

    setError(null);
    let chart: any;
    try {
      chart = createChart(container, {
        width,
        height,
        autoSize: false,
        layout: {
          background: { color: theme === 'dark' ? '#1a1a1a' : '#ffffff' },
          textColor: theme === 'dark' ? '#ffffff' : '#000000',
        },
        grid: {
          vertLines: { color: theme === 'dark' ? '#333333' : '#e0e0e0' },
          horzLines: { color: theme === 'dark' ? '#333333' : '#e0e0e0' },
        },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: theme === 'dark' ? '#333333' : '#e0e0e0', visible: true },
        timeScale: { borderColor: theme === 'dark' ? '#333333' : '#e0e0e0', timeVisible: true, secondsVisible: false },
      });
      chartRef.current = chart;

      const candlestickSeries = (chart as any).addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      candlestickSeriesRef.current = candlestickSeries;
      chart.timeScale().fitContent();
      setIsChartReady(true);
      onChartReadyRef.current?.(chart);
    } catch (err) {
      console.error('Error initializing chart:', err);
      setError('Failed to initialize chart');
      return;
    }

    // Keep the chart sized to its container.
    const handleResize = () => {
      if (!chartRef.current || !chartContainerRef.current) return;
      const w = chartContainerRef.current.getBoundingClientRect().width || 800;
      try { chartRef.current.applyOptions({ width: w }); } catch { /* ignore */ }
    };
    window.addEventListener('resize', handleResize);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    ro?.observe(container);

    return () => {
      window.removeEventListener('resize', handleResize);
      ro?.disconnect();
      try { chart.remove(); } catch { /* ignore */ }
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      setIsChartReady(false);
    };
  }, [symbol, theme, height]);

  // Update chart data
  useEffect(() => {
    if (!chartData || !candlestickSeriesRef.current) {
      return;
    }

    try {
      const formatData = (data: any[]) => {
        if (!data || !Array.isArray(data)) return [];
        
        const formatted = data.map(item => {
          // Check if timestamp is in milliseconds (13 digits) or seconds (10 digits)
          let timestamp = item.timestamp;
          if (timestamp.toString().length === 13) {
            timestamp = Math.floor(timestamp / 1000); // Convert milliseconds to seconds
          }
          
          return {
            time: Math.floor(timestamp),
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
          };
        });
        
        return formatted;
      };

      const candleData = formatData(chartData.candles || []);

      if (candleData.length > 0) {
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
      }

      if (onDataUpdate) {
        onDataUpdate(chartData);
      }
    } catch (err) {
      console.error('Error updating chart data:', err);
      setError('Failed to update chart data');
    }
  }, [chartData, onDataUpdate, currentInterval, visibleRange, isChartReady]);

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
      setCurrentInterval(newInterval as any);
    }
  }, [currentInterval]);

  // Handle drawing updates
  useEffect(() => {
    if (onDrawingUpdate) {
      onDrawingUpdate(drawings);
    }
  }, [drawings, onDrawingUpdate]);

  if (!symbol) {
    return (
      <div className="d-flex align-items-center justify-content-center" 
           style={{ 
             backgroundColor: lightGray, 
             borderRadius: '20px', 
             padding: '24px', 
             height: height,
             color: gray,
             fontSize: '16px'
           }}>
        Select a stock to view the chart
      </div>
    );
  }

  // NOTE: loading and error states are rendered as OVERLAYS inside the main
  // markup below — never as separate early-returns. Early-returning a different
  // tree would unmount the chart container div, and the chart-init effect (keyed
  // on symbol/theme/height) would not re-run to recreate the chart on the
  // remounted div, leaving the chart blank.

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

      {/* Chart Container.
          IMPORTANT: this div must have NO JSX children — lightweight-charts
          appends its canvas here imperatively, and React would wipe that canvas
          on re-render if it were reconciling JSX children of this element.
          The debug overlay and tooltip are therefore rendered as SIBLINGS. */}
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
        />

        {/* Loading overlay — sits over the (always-mounted) chart container */}
        {dataLoading && !chartData && (
          <div className="d-flex align-items-center justify-content-center flex-column"
               style={{ position: 'absolute', inset: 0, gap: '12px', borderRadius: '12px',
                        backgroundColor: theme === 'dark' ? 'rgba(26,26,26,0.85)' : 'rgba(255,255,255,0.85)', zIndex: 5 }}>
            <div className="spinner-border" role="status" style={{ color: marbleGold }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <div style={{ color: theme === 'dark' ? lightGray : gray, fontSize: '14px' }}>Loading chart data…</div>
          </div>
        )}

        {/* Error overlay */}
        {(error || dataError) && (
          <div className="d-flex align-items-center justify-content-center flex-column"
               style={{ position: 'absolute', inset: 0, gap: '12px', borderRadius: '12px', padding: '24px', textAlign: 'center',
                        backgroundColor: theme === 'dark' ? 'rgba(26,26,26,0.92)' : 'rgba(255,255,255,0.92)', zIndex: 6 }}>
            <div style={{ color: '#ef4444', fontWeight: 700 }}>{error || dataError}</div>
            <button onClick={() => refetch()} className="btn btn-sm" style={{ background: marbleGold, color: marbleDarkGray, fontWeight: 600 }}>
              Retry
            </button>
          </div>
        )}

        {/* Debug overlay (hidden by default) — sibling, not a child of the chart div */}
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
              border: `1px solid ${theme === 'dark' ? gray : lightGray}`,
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
