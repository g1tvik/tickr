import React, { useEffect, useRef } from 'react';
import { IChartApi, ISeriesApi, LineData, UTCTimestamp } from 'lightweight-charts';
import { Indicator } from '../../stores/chartStore';
import { ChartData } from '../../hooks/useChartData';

interface IndicatorManagerProps {
  chart: IChartApi | null;
  indicators: Indicator[];
  chartData: ChartData | null;
  theme: 'light' | 'dark';
}

export const IndicatorManager: React.FC<IndicatorManagerProps> = ({
  chart,
  indicators,
  chartData,
  theme
}) => {
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());

  // Calculate SMA (Simple Moving Average)
  const calculateSMA = (data: any[], period: number): LineData[] => {
    const smaData: LineData[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + parseFloat(item.close), 0);
      const sma = sum / period;
      
      smaData.push({
        time: (data[i].timestamp || data[i].time || new Date(data[i].date).getTime() / 1000) as UTCTimestamp,
        value: sma
      });
    }
    
    return smaData;
  };

  // Calculate EMA (Exponential Moving Average)
  const calculateEMA = (data: any[], period: number): LineData[] => {
    const emaData: LineData[] = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    let ema = data.slice(0, period).reduce((acc, item) => acc + parseFloat(item.close), 0) / period;
    
    for (let i = 0; i < data.length; i++) {
      if (i >= period - 1) {
        ema = (parseFloat(data[i].close) * multiplier) + (ema * (1 - multiplier));
      }
      
      emaData.push({
        time: (data[i].timestamp || data[i].time || new Date(data[i].date).getTime() / 1000) as UTCTimestamp,
        value: ema
      });
    }
    
    return emaData;
  };

  // Calculate VWAP (Volume Weighted Average Price)
  const calculateVWAP = (data: any[]): LineData[] => {
    const vwapData: LineData[] = [];
    let cumulativeTPV = 0; // Total Price * Volume
    let cumulativeVolume = 0;
    
    for (let i = 0; i < data.length; i++) {
      const typicalPrice = (parseFloat(data[i].high) + parseFloat(data[i].low) + parseFloat(data[i].close)) / 3;
      const volume = parseFloat(data[i].volume || 0);
      
      cumulativeTPV += typicalPrice * volume;
      cumulativeVolume += volume;
      
      const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice;
      
      vwapData.push({
        time: (data[i].timestamp || data[i].time || new Date(data[i].date).getTime() / 1000) as UTCTimestamp,
        value: vwap
      });
    }
    
    return vwapData;
  };

  // Calculate Bollinger Bands
  const calculateBollingerBands = (data: any[], period: number, stdDev: number = 2) => {
    const upperData: LineData[] = [];
    const lowerData: LineData[] = [];
    const middleData: LineData[] = [];

    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const closes = slice.map(item => parseFloat(item.close));
      const sma = closes.reduce((acc, val) => acc + val, 0) / period;
      
      const variance = closes.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      const upperBand = sma + (standardDeviation * stdDev);
      const lowerBand = sma - (standardDeviation * stdDev);

      const time = (data[i].timestamp || data[i].time || new Date(data[i].date).getTime() / 1000) as UTCTimestamp;
      
      upperData.push({ time, value: upperBand });
      lowerData.push({ time, value: lowerBand });
      middleData.push({ time, value: sma });
    }

    return { upper: upperData, lower: lowerData, middle: middleData };
  };

  // Add indicator to chart
  const addIndicator = (indicator: Indicator) => {
    if (!chart || !chartData?.candles) return;

    const existingSeries = indicatorSeriesRef.current.get(indicator.id);
    if (existingSeries) {
      chart.removeSeries(existingSeries);
    }

    let seriesData: LineData[] = [];

    switch (indicator.type) {
      case 'sma':
        seriesData = calculateSMA(chartData.candles, indicator.period);
        break;
      case 'ema':
        seriesData = calculateEMA(chartData.candles, indicator.period);
        break;
      case 'vwap':
        seriesData = calculateVWAP(chartData.candles);
        break;
      case 'bollinger':
        const bbData = calculateBollingerBands(chartData.candles, indicator.period);
        
        // Add all three lines for Bollinger Bands
        const upperSeries = chart.addLineSeries({
          color: indicator.color,
          lineWidth: 1,
          title: `BB Upper ${indicator.period}`,
        });
        upperSeries.setData(bbData.upper);
        indicatorSeriesRef.current.set(`${indicator.id}_upper`, upperSeries);

        const lowerSeries = chart.addLineSeries({
          color: indicator.color,
          lineWidth: 1,
          title: `BB Lower ${indicator.period}`,
        });
        lowerSeries.setData(bbData.lower);
        indicatorSeriesRef.current.set(`${indicator.id}_lower`, lowerSeries);

        const middleSeries = chart.addLineSeries({
          color: indicator.color,
          lineWidth: 2,
          title: `BB Middle ${indicator.period}`,
        });
        middleSeries.setData(bbData.middle);
        indicatorSeriesRef.current.set(`${indicator.id}_middle`, middleSeries);
        
        return; // Early return for Bollinger Bands
    }

    if (seriesData.length > 0) {
      const series = chart.addLineSeries({
        color: indicator.color,
        lineWidth: 2,
        title: `${indicator.type.toUpperCase()} ${indicator.period}`,
      });
      series.setData(seriesData);
      indicatorSeriesRef.current.set(indicator.id, series);
    }
  };

  // Remove indicator from chart
  const removeIndicator = (indicatorId: string) => {
    if (!chart) return;

    // Handle Bollinger Bands (multiple series)
    if (indicatorId.includes('bollinger')) {
      const upperSeries = indicatorSeriesRef.current.get(`${indicatorId}_upper`);
      const lowerSeries = indicatorSeriesRef.current.get(`${indicatorId}_lower`);
      const middleSeries = indicatorSeriesRef.current.get(`${indicatorId}_middle`);

      if (upperSeries) {
        chart.removeSeries(upperSeries);
        indicatorSeriesRef.current.delete(`${indicatorId}_upper`);
      }
      if (lowerSeries) {
        chart.removeSeries(lowerSeries);
        indicatorSeriesRef.current.delete(`${indicatorId}_lower`);
      }
      if (middleSeries) {
        chart.removeSeries(middleSeries);
        indicatorSeriesRef.current.delete(`${indicatorId}_middle`);
      }
    } else {
      const series = indicatorSeriesRef.current.get(indicatorId);
      if (series) {
        chart.removeSeries(series);
        indicatorSeriesRef.current.delete(indicatorId);
      }
    }
  };

  // Update indicators when chart data or indicators change
  useEffect(() => {
    if (!chart || !chartData?.candles) return;

    // Clear existing indicators
    indicatorSeriesRef.current.forEach((series) => {
      chart.removeSeries(series);
    });
    indicatorSeriesRef.current.clear();

    // Add visible indicators
    indicators.forEach((indicator) => {
      if (indicator.visible) {
        addIndicator(indicator);
      }
    });
  }, [chart, chartData, indicators]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chart) {
        indicatorSeriesRef.current.forEach((series) => {
          chart.removeSeries(series);
        });
        indicatorSeriesRef.current.clear();
      }
    };
  }, [chart]);

  return null; // This component doesn't render anything visible
};
