import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

export interface ChartData {
  symbol: string;
  interval: string;
  candles: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  lastUpdated: string;
}

export interface UseChartDataReturn {
  chartData: ChartData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useChartData = (
  symbol: string,
  interval: string,
  realtime: boolean = false
): UseChartDataReturn => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Cache for chart data
  const dataCache = useRef<Map<string, { data: ChartData; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache



  // Fetch historical data
  const fetchHistoricalData = useCallback(async (symbol: string, interval: string) => {
    console.log(`fetchHistoricalData: Fetching ${symbol} with interval ${interval}`);
    
    const cacheKey = `${symbol}_${interval}`;
    const cached = dataCache.current.get(cacheKey);
    
    // Check if we have valid cached data (disabled for debugging)
    // if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    //   console.log(`fetchHistoricalData: Using cached data for ${cacheKey}`);
    //   setChartData(cached.data);
    //   return;
    // }

    setIsLoading(true);
    setError(null);
    // Don't clear existing data during loading to prevent chart flicker

    try {
      // Get real data from API with maximum historical data
      let dataLimit;
      if (interval === '1m' || interval === '5m' || interval === '15m') {
        dataLimit = 1000; // Much more data for minute intervals
      } else if (interval === '1h' || interval === '4h') {
        dataLimit = 800; // More data for hourly intervals
      } else {
        dataLimit = 500; // Standard for daily+ intervals
      }
      const response = await api.getChartData(symbol, interval, dataLimit);
      
      if (response.success && response.chartData) {
        const normalizedData: ChartData = {
          symbol,
          interval,
          candles: response.chartData.candles || [],
          lastUpdated: new Date().toISOString()
        };
        
        console.log(`fetchHistoricalData: Got real data for ${symbol}, ${normalizedData.candles.length} candles`);
        setChartData(normalizedData);
        dataCache.current.set(cacheKey, { data: normalizedData, timestamp: Date.now() });
      } else {
        throw new Error('No chart data received from API');
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(`Failed to fetch chart data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // WebSocket connection for real-time data
  const connectWebSocket = useCallback((symbol: string, interval: string) => {
    if (!realtime) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      // In a real implementation, you'd connect to your WebSocket server
      // For now, we'll simulate real-time updates with setInterval
      const intervalId = setInterval(() => {
        if (chartData) {
          const lastCandle = chartData.candles[chartData.candles.length - 1];
          const newCandle = {
            timestamp: Math.floor(Date.now() / 1000),
            open: lastCandle.close,
            high: lastCandle.close + Math.random() * 5,
            low: lastCandle.close - Math.random() * 5,
            close: lastCandle.close + (Math.random() - 0.5) * 3,
            volume: Math.floor(Math.random() * 100000) + 50000
          };

          setChartData(prev => {
            if (!prev) return prev;
            
            const newCandles = [...prev.candles.slice(1), newCandle];
            return {
              ...prev,
              candles: newCandles,
              lastUpdated: new Date().toISOString()
            };
          });
        }
      }, 1000); // Update every second

      // Store the interval ID for cleanup
      wsRef.current = {
        close: () => clearInterval(intervalId)
      } as any;
    } catch (err) {
      console.error('Error connecting to WebSocket:', err);
      setError('Failed to connect to real-time feed');
    }
  }, [chartData, realtime]);

  // Main effect for data fetching
  useEffect(() => {
    if (!symbol || !interval) return;

    console.log(`useChartData: Fetching data for ${symbol} with interval ${interval}`);
    fetchHistoricalData(symbol, interval);
  }, [symbol, interval, fetchHistoricalData]);

  // WebSocket effect
  useEffect(() => {
    if (realtime && chartData) {
      connectWebSocket(symbol, interval);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [realtime, chartData, symbol, interval, connectWebSocket]);

  // Refetch function
  const refetch = useCallback(() => {
    if (symbol && interval) {
      // Clear cache for this symbol/interval
      const cacheKey = `${symbol}_${interval}`;
      dataCache.current.delete(cacheKey);
      
      fetchHistoricalData(symbol, interval);
    }
  }, [symbol, interval, fetchHistoricalData]);

  return {
    chartData,
    isLoading,
    error,
    refetch
  };
};
