import React from 'react';
import { render, screen } from '@testing-library/react';
import { SuperChart } from './SuperChart';

// Mock the lightweight-charts library
jest.mock('lightweight-charts', () => ({
  createChart: jest.fn(() => ({
    addCandlestickSeries: jest.fn(() => ({
      setData: jest.fn(),
    })),
    addHistogramSeries: jest.fn(() => ({
      setData: jest.fn(),
    })),
    subscribeCrosshairMove: jest.fn(),
    applyOptions: jest.fn(),
    remove: jest.fn(),
    chartElement: jest.fn(() => ({
      getBoundingClientRect: () => ({ width: 800, height: 400 }),
    })),
  })),
}));

// Mock the chart store
jest.mock('../stores/chartStore', () => ({
  useChartStore: jest.fn(() => ({
    drawings: [],
    indicators: [],
    chartSettings: {
      theme: 'dark',
      showVolume: true,
      showGrid: true,
      showCrosshair: true,
      autoScale: true,
      logScale: false,
    },
    addDrawing: jest.fn(),
    updateDrawing: jest.fn(),
    removeDrawing: jest.fn(),
    addIndicator: jest.fn(),
    removeIndicator: jest.fn(),
    updateChartSettings: jest.fn(),
  })),
}));

// Mock the chart data hook
jest.mock('../hooks/useChartData', () => ({
  useChartData: jest.fn(() => ({
    chartData: {
      symbol: 'AAPL',
      interval: '1d',
      candles: [
        {
          timestamp: 1640995200,
          open: 150.0,
          high: 155.0,
          low: 149.0,
          close: 153.0,
          volume: 1000000,
        },
        {
          timestamp: 1641081600,
          open: 153.0,
          high: 157.0,
          low: 152.0,
          close: 156.0,
          volume: 1200000,
        },
      ],
      lastUpdated: '2024-01-01T00:00:00.000Z',
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

describe('SuperChart', () => {
  it('renders without crashing', () => {
    render(
      <SuperChart
        symbol="AAPL"
        initialInterval="1d"
        theme="dark"
        realtime={false}
        height={500}
      />
    );
    
    // Should render the chart container
    expect(document.querySelector('.chart-container')).toBeInTheDocument();
  });

  it('displays loading state when data is loading', () => {
    // Mock loading state
    jest.mocked(require('../hooks/useChartData').useChartData).mockReturnValue({
      chartData: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <SuperChart
        symbol="AAPL"
        initialInterval="1d"
        theme="dark"
        realtime={false}
        height={500}
      />
    );
    
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('displays error state when there is an error', () => {
    // Mock error state
    jest.mocked(require('../hooks/useChartData').useChartData).mockReturnValue({
      chartData: null,
      isLoading: false,
      error: 'Failed to load chart data',
      refetch: jest.fn(),
    });

    render(
      <SuperChart
        symbol="AAPL"
        initialInterval="1d"
        theme="dark"
        realtime={false}
        height={500}
      />
    );
    
    expect(screen.getByText('Failed to load chart data')).toBeInTheDocument();
  });

  it('displays placeholder when no symbol is provided', () => {
    render(
      <SuperChart
        symbol=""
        initialInterval="1d"
        theme="dark"
        realtime={false}
        height={500}
      />
    );
    
    expect(screen.getByText('Select a stock to view the chart')).toBeInTheDocument();
  });
});
