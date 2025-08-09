import React, { useState } from 'react';
import { Indicator } from '../stores/chartStore';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

interface ChartToolbarProps {
  symbol: string;
  currentInterval: string;
  onIntervalChange: (interval: string) => void;
  theme: 'light' | 'dark';
  indicators: Indicator[];
  onAddIndicator: (indicator: Omit<Indicator, 'id'>) => void;
  onRemoveIndicator: (id: string) => void;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  symbol,
  currentInterval,
  onIntervalChange,
  theme,
  indicators,
  onAddIndicator,
  onRemoveIndicator
}) => {
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);
  const [showDrawingTools, setShowDrawingTools] = useState(false);

  const intervals = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' },
    { value: '1w', label: '1w' },
    { value: '1M', label: '1M' },
  ];

  const availableIndicators = [
    { type: 'sma', label: 'SMA', defaultPeriod: 20 },
    { type: 'ema', label: 'EMA', defaultPeriod: 20 },
    { type: 'vwap', label: 'VWAP', defaultPeriod: 20 },
    { type: 'bollinger', label: 'Bollinger Bands', defaultPeriod: 20 },
  ];

  const handleAddIndicator = (type: string, period: number) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    onAddIndicator({
      type: type as any,
      period,
      color: randomColor,
      visible: true,
      settings: {}
    });
    setShowIndicatorModal(false);
  };

  return (
    <div className={`chart-toolbar ${theme === 'dark' ? 'bg-dark' : 'bg-light'} p-3 mb-3 rounded`}
         style={{ border: `1px solid ${theme === 'dark' ? marbleGray : marbleLightGray}` }}>
      
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
        
        {/* Symbol and Title */}
        <div className="d-flex align-items-center">
          <h5 className={`mb-0 ${theme === 'dark' ? 'text-light' : 'text-dark'}`}
              style={{ fontFamily: fontHeading, fontWeight: 'bold' }}>
            {symbol}
          </h5>
        </div>

        {/* Interval Selector */}
        <div className="d-flex align-items-center gap-2">
          <span className={`small ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
            Timeframe:
          </span>
          <div className="btn-group btn-group-sm" role="group">
            {intervals.map((interval) => (
              <button
                key={interval.value}
                type="button"
                className={`btn ${currentInterval === interval.value 
                  ? 'btn-primary' 
                  : theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'}`}
                onClick={() => onIntervalChange(interval.value)}
                style={{
                  minWidth: '40px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {interval.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drawing Tools */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm ${showDrawingTools 
              ? 'btn-primary' 
              : theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'}`}
            onClick={() => setShowDrawingTools(!showDrawingTools)}
            title="Drawing Tools"
          >
            <i className="bi bi-pencil"></i>
            <span className="ms-1 d-none d-sm-inline">Draw</span>
          </button>
        </div>

        {/* Indicators */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'}`}
            onClick={() => setShowIndicatorModal(true)}
            title="Add Indicator"
          >
            <i className="bi bi-graph-up"></i>
            <span className="ms-1 d-none d-sm-inline">Indicators</span>
          </button>
          
          {/* Active Indicators */}
          {indicators.length > 0 && (
            <div className="d-flex gap-1">
              {indicators.map((indicator) => (
                <button
                  key={indicator.id}
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  style={{ 
                    borderColor: indicator.color, 
                    color: indicator.color,
                    fontSize: '10px'
                  }}
                  onClick={() => onRemoveIndicator(indicator.id)}
                  title={`Remove ${indicator.type.toUpperCase()} (${indicator.period})`}
                >
                  {indicator.type.toUpperCase()}({indicator.period})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'}`}
            title="Chart Settings"
          >
            <i className="bi bi-gear"></i>
          </button>
        </div>
      </div>

      {/* Drawing Tools Panel */}
      {showDrawingTools && (
        <div className={`mt-3 p-3 rounded ${theme === 'dark' ? 'bg-secondary' : 'bg-light'}`}
             style={{ border: `1px solid ${theme === 'dark' ? marbleGray : marbleLightGray}` }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className={`small ${theme === 'dark' ? 'text-light' : 'text-dark'}`}>
              Drawing Tools:
            </span>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {[
              { type: 'trendline', icon: 'bi-arrow-up-right', label: 'Trend Line' },
              { type: 'horizontal', icon: 'bi-dash', label: 'Horizontal' },
              { type: 'vertical', icon: 'bi-dash-vertical', label: 'Vertical' },
              { type: 'fibonacci', icon: 'bi-diagram-3', label: 'Fibonacci' },
              { type: 'text', icon: 'bi-type', label: 'Text' },
            ].map((tool) => (
              <button
                key={tool.type}
                type="button"
                className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-dark'}`}
                title={tool.label}
              >
                <i className={`bi ${tool.icon}`}></i>
                <span className="ms-1 d-none d-sm-inline">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Indicator Modal */}
      {showIndicatorModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className={`modal-content ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
              <div className="modal-header">
                <h5 className="modal-title">Add Indicator</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowIndicatorModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="list-group">
                  {availableIndicators.map((indicator) => (
                    <button
                      key={indicator.type}
                      type="button"
                      className={`list-group-item list-group-item-action ${
                        theme === 'dark' ? 'bg-dark text-light border-secondary' : 'bg-light text-dark'
                      }`}
                      onClick={() => handleAddIndicator(indicator.type, indicator.defaultPeriod)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{indicator.label}</span>
                        <small className="text-muted">Period: {indicator.defaultPeriod}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
