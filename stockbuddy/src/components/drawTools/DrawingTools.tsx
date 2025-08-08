import React, { useEffect, useRef, useState } from 'react';
import { IChartApi } from 'lightweight-charts';
import { Drawing } from '../../stores/chartStore';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../../marblePalette';

interface DrawingToolsProps {
  chart: IChartApi | null;
  drawings: Drawing[];
  onAddDrawing: (drawing: Omit<Drawing, 'id'>) => void;
  onUpdateDrawing: (id: string, updates: Partial<Drawing>) => void;
  onRemoveDrawing: (id: string) => void;
  theme: 'light' | 'dark';
}

export const DrawingTools: React.FC<DrawingToolsProps> = ({
  chart,
  drawings,
  onAddDrawing,
  onUpdateDrawing,
  onRemoveDrawing,
  theme
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);

  // Drawing state
  const [drawingState, setDrawingState] = useState<'idle' | 'drawing' | 'editing'>('idle');

  useEffect(() => {
    if (!canvasRef.current || !chart) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match chart container
    const resizeCanvas = () => {
      const container = chart.chartElement();
      if (container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [chart]);

  // Render drawings on canvas
  useEffect(() => {
    if (!canvasRef.current || !chart) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render each drawing
    drawings.forEach((drawing) => {
      if (!drawing.visible) return;

      const points = drawing.points;
      if (points.length < 2) return;

      ctx.strokeStyle = drawing.selected ? marbleGold : drawing.style.color;
      ctx.lineWidth = drawing.selected ? drawing.style.width + 2 : drawing.style.width;
      ctx.setLineDash(drawing.style.style === 'dashed' ? [5, 5] : 
                     drawing.style.style === 'dotted' ? [2, 2] : []);

      ctx.beginPath();

      switch (drawing.type) {
        case 'trendline':
          if (points.length >= 2) {
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
          }
          break;

        case 'horizontal':
          if (points.length >= 1) {
            const y = points[0].y;
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
          }
          break;

        case 'vertical':
          if (points.length >= 1) {
            const x = points[0].x;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
          }
          break;

        case 'fibonacci':
          if (points.length >= 2) {
            const start = points[0];
            const end = points[1];
            const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
            
            levels.forEach((level, index) => {
              const y = start.y + (end.y - start.y) * level;
              ctx.moveTo(start.x, y);
              ctx.lineTo(end.x, y);
            });
          }
          break;

        case 'text':
          if (points.length >= 1 && drawing.text) {
            ctx.font = '12px Arial';
            ctx.fillStyle = drawing.style.color;
            ctx.fillText(drawing.text, points[0].x, points[0].y);
          }
          break;
      }

      ctx.stroke();

      // Draw selection handles
      if (drawing.selected) {
        points.forEach((point) => {
          ctx.fillStyle = marbleGold;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });
  }, [drawings, chart]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chart || !currentTool) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawingPoints([{ x, y }]);
    setIsDrawing(true);
    setDrawingState('drawing');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentTool) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawingPoints(prev => [...prev.slice(0, 1), { x, y }]);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !currentTool) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const finalPoints = [...drawingPoints, { x, y }];

    // Create new drawing
    const newDrawing: Omit<Drawing, 'id'> = {
      type: currentTool as any,
      points: finalPoints,
      style: {
        color: '#ff6b6b',
        width: 2,
        style: 'solid' as const,
      },
      visible: true,
      selected: false,
    };

    onAddDrawing(newDrawing);

    // Reset state
    setIsDrawing(false);
    setDrawingPoints([]);
    setCurrentTool(null);
    setDrawingState('idle');
  };

  const handleClick = (e: React.MouseEvent) => {
    if (drawingState !== 'idle') return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a drawing
    const clickedDrawing = drawings.find(drawing => {
      return drawing.points.some(point => {
        const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
        return distance < 10;
      });
    });

    if (clickedDrawing) {
      setSelectedDrawingId(clickedDrawing.id);
      // Update drawing selection
      drawings.forEach(drawing => {
        onUpdateDrawing(drawing.id, { selected: drawing.id === clickedDrawing.id });
      });
    } else {
      setSelectedDrawingId(null);
      // Clear all selections
      drawings.forEach(drawing => {
        onUpdateDrawing(drawing.id, { selected: false });
      });
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' && selectedDrawingId) {
      onRemoveDrawing(selectedDrawingId);
      setSelectedDrawingId(null);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDrawingId]);

  if (!chart) return null;

  return (
    <div className="drawing-tools-overlay position-absolute" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: currentTool ? 'auto' : 'none',
          zIndex: 10,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      />
      
      {/* Drawing preview */}
      {isDrawing && drawingPoints.length >= 2 && (
        <svg
          className="drawing-preview position-absolute"
          style={{
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 11,
          }}
        >
          {currentTool === 'trendline' && drawingPoints.length >= 2 && (
            <line
              x1={drawingPoints[0].x}
              y1={drawingPoints[0].y}
              x2={drawingPoints[1].x}
              y2={drawingPoints[1].y}
              stroke="#ff6b6b"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
          {currentTool === 'horizontal' && drawingPoints.length >= 1 && (
            <line
              x1="0"
              y1={drawingPoints[0].y}
              x2="100%"
              y2={drawingPoints[0].y}
              stroke="#ff6b6b"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
          {currentTool === 'vertical' && drawingPoints.length >= 1 && (
            <line
              x1={drawingPoints[0].x}
              y1="0"
              x2={drawingPoints[0].x}
              y2="100%"
              stroke="#ff6b6b"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          )}
        </svg>
      )}
    </div>
  );
};
