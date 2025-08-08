import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Drawing {
  id: string;
  type: 'trendline' | 'horizontal' | 'vertical' | 'fibonacci' | 'text';
  points: Array<{ x: number; y: number; time?: number; price?: number }>;
  style: {
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
  };
  text?: string;
  visible: boolean;
  selected: boolean;
}

export interface Indicator {
  id: string;
  type: 'sma' | 'ema' | 'vwap' | 'bollinger';
  period: number;
  color: string;
  visible: boolean;
  settings: Record<string, any>;
}

export interface ChartSettings {
  theme: 'light' | 'dark';
  showVolume: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  autoScale: boolean;
  logScale: boolean;
}

interface ChartState {
  // State
  drawings: Drawing[];
  indicators: Indicator[];
  chartSettings: ChartSettings;
  selectedDrawingId: string | null;
  
  // Actions
  addDrawing: (drawing: Omit<Drawing, 'id'>) => void;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  removeDrawing: (id: string) => void;
  selectDrawing: (id: string | null) => void;
  
  addIndicator: (indicator: Omit<Indicator, 'id'>) => void;
  updateIndicator: (id: string, updates: Partial<Indicator>) => void;
  removeIndicator: (id: string) => void;
  
  updateChartSettings: (settings: Partial<ChartSettings>) => void;
  
  // Undo/Redo
  history: Array<{
    drawings: Drawing[];
    indicators: Indicator[];
  }>;
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // Reset
  reset: () => void;
}

const MAX_HISTORY = 50;

export const useChartStore = create<ChartState>()(
  devtools(
    (set, get) => ({
      // Initial state
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
      selectedDrawingId: null,
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false,

      // Drawing actions
      addDrawing: (drawing) => {
        const newDrawing: Drawing = {
          ...drawing,
          id: `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        
        set((state) => {
          const newDrawings = [...state.drawings, newDrawing];
          return {
            drawings: newDrawings,
            selectedDrawingId: newDrawing.id,
          };
        });
        
        get().saveToHistory();
      },

      updateDrawing: (id, updates) => {
        set((state) => ({
          drawings: state.drawings.map((drawing) =>
            drawing.id === id ? { ...drawing, ...updates } : drawing
          ),
        }));
        
        get().saveToHistory();
      },

      removeDrawing: (id) => {
        set((state) => ({
          drawings: state.drawings.filter((drawing) => drawing.id !== id),
          selectedDrawingId: state.selectedDrawingId === id ? null : state.selectedDrawingId,
        }));
        
        get().saveToHistory();
      },

      selectDrawing: (id) => {
        set((state) => ({
          selectedDrawingId: id,
          drawings: state.drawings.map((drawing) => ({
            ...drawing,
            selected: drawing.id === id,
          })),
        }));
      },

      // Indicator actions
      addIndicator: (indicator) => {
        const newIndicator: Indicator = {
          ...indicator,
          id: `indicator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        
        set((state) => ({
          indicators: [...state.indicators, newIndicator],
        }));
        
        get().saveToHistory();
      },

      updateIndicator: (id, updates) => {
        set((state) => ({
          indicators: state.indicators.map((indicator) =>
            indicator.id === id ? { ...indicator, ...updates } : indicator
          ),
        }));
        
        get().saveToHistory();
      },

      removeIndicator: (id) => {
        set((state) => ({
          indicators: state.indicators.filter((indicator) => indicator.id !== id),
        }));
        
        get().saveToHistory();
      },

      // Chart settings
      updateChartSettings: (settings) => {
        set((state) => ({
          chartSettings: { ...state.chartSettings, ...settings },
        }));
      },

      // History management
      saveToHistory: () => {
        const state = get();
        const currentState = {
          drawings: state.drawings,
          indicators: state.indicators,
        };

        set((state) => {
          const newHistory = [...state.history.slice(0, state.historyIndex + 1), currentState];
          
          // Trim history if it exceeds max size
          if (newHistory.length > MAX_HISTORY) {
            newHistory.shift();
          }

          return {
            history: newHistory,
            historyIndex: newHistory.length - 1,
            canUndo: newHistory.length > 1,
            canRedo: false,
          };
        });
      },

      undo: () => {
        const state = get();
        if (state.historyIndex > 0) {
          const previousState = state.history[state.historyIndex - 1];
          set((state) => ({
            drawings: previousState.drawings,
            indicators: previousState.indicators,
            historyIndex: state.historyIndex - 1,
            canUndo: state.historyIndex - 1 > 0,
            canRedo: true,
          }));
        }
      },

      redo: () => {
        const state = get();
        if (state.historyIndex < state.history.length - 1) {
          const nextState = state.history[state.historyIndex + 1];
          set((state) => ({
            drawings: nextState.drawings,
            indicators: nextState.indicators,
            historyIndex: state.historyIndex + 1,
            canUndo: true,
            canRedo: state.historyIndex + 1 < state.history.length - 1,
          }));
        }
      },

      // Reset
      reset: () => {
        set({
          drawings: [],
          indicators: [],
          selectedDrawingId: null,
          history: [],
          historyIndex: -1,
          canUndo: false,
          canRedo: false,
        });
      },
    }),
    {
      name: 'chart-store',
    }
  )
);
