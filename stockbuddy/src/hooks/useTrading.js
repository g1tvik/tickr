import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { handleApiError } from '../utils/tradeUtils';

// How often we re-sync account, working orders, and the market clock. The
// background engine fills resting orders server-side; polling surfaces those
// fills (and price marks) in the UI.
const SYNC_MS = 10000;

const DEFAULTS = {
  intent: 'buy',
  orderKind: 'market',
  timeInForce: 'day',
};

/**
 * Trading state for the order ticket + blotter. Owns the full order model
 * (intent, type, conditional prices, TIF, extended hours), the account metrics
 * (equity / buying power / margin / settled cash / P&L), the working-order book,
 * and the holiday-aware session clock.
 */
export const useTrading = () => {
  // ── Selection + market data ────────────────────────────────────────────────
  const [selectedStock, setSelectedStock] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // ── Order ticket ───────────────────────────────────────────────────────────
  const [intent, setIntent] = useState(DEFAULTS.intent);        // buy | sell | sell_short | buy_to_cover
  const [orderKind, setOrderKind] = useState(DEFAULTS.orderKind); // market | limit | stop | stop_limit | trailing_stop
  const [shares, setShares] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [trailType, setTrailType] = useState('percent');
  const [trailValue, setTrailValue] = useState('');
  const [timeInForce, setTimeInForce] = useState(DEFAULTS.timeInForce);
  const [extendedHours, setExtendedHours] = useState(false);

  // ── Account + blotter ──────────────────────────────────────────────────────
  const [portfolio, setPortfolio] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [openOrders, setOpenOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // ── Status ─────────────────────────────────────────────────────────────────
  const [clock, setClock] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [lastOrderResult, setLastOrderResult] = useState(null);

  const selectedSymbolRef = useRef(null);
  selectedSymbolRef.current = selectedStock?.symbol || null;

  // Derived legacy status used by a couple of older bits of UI.
  const marketStatus = clock ? (clock.isOpen ? 'open' : 'closed') : 'loading';

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const loadAccount = useCallback(async () => {
    try {
      const res = await api.getAccount();
      if (res.success) {
        setPortfolio(res.portfolio);
        setMetrics(res.metrics);
        setLastUpdate(new Date());
        setError(null);
      }
    } catch (err) {
      console.error('Error loading account:', err);
    }
  }, []);

  const loadOpenOrders = useCallback(async () => {
    try {
      const res = await api.getOrders('open');
      if (res.success) setOpenOrders(res.orders || []);
    } catch (err) {
      console.error('Error loading open orders:', err);
    }
  }, []);

  const loadOrderHistory = useCallback(async () => {
    try {
      const res = await api.getOrders();
      if (res.success) setOrderHistory(res.orders || []);
    } catch (err) {
      console.error('Error loading order history:', err);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const res = await api.getTransactions();
      if (res.success) setTransactions(res.transactions || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  }, []);

  const loadMarketData = useCallback(async () => {
    try {
      const res = await api.getMarketData();
      if (res.success) {
        setStocks(res.marketData);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error loading market data:', err);
      setError(handleApiError(err, 'Failed to load market data. Please check your connection.'));
    }
  }, []);

  const loadClock = useCallback(async () => {
    try {
      const res = await api.getClock();
      if (res.success) setClock(res.clock);
    } catch (err) {
      console.error('Error loading market clock:', err);
    }
  }, []);

  const updateSelectedStockPrice = useCallback(async () => {
    const sym = selectedSymbolRef.current;
    if (!sym) return;
    try {
      const res = await api.getStockQuote(sym);
      if (res.success && selectedSymbolRef.current === sym) {
        setSelectedStock(res.quote);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Error updating stock price:', err);
    }
  }, []);

  const syncAll = useCallback(() => {
    loadAccount();
    loadOpenOrders();
    loadOrderHistory();
    loadTransactions();
    loadMarketData();
    loadClock();
    updateSelectedStockPrice();
  }, [loadAccount, loadOpenOrders, loadOrderHistory, loadTransactions, loadMarketData, loadClock, updateSelectedStockPrice]);

  // ── Initial load + polling ─────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please sign in to access trading features');
      return;
    }
    setIsAuthenticated(true);
    loadAccount();
    loadOpenOrders();
    loadOrderHistory();
    loadTransactions();
    loadMarketData();
    loadClock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const tick = () => {
      if (document.hidden) return;
      loadAccount();
      loadOpenOrders();
      loadClock();
      loadTransactions();
      updateSelectedStockPrice();
    };
    const id = setInterval(tick, SYNC_MS);
    const onVisibilityChange = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated, loadAccount, loadOpenOrders, loadClock, loadTransactions, updateSelectedStockPrice]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleStockSelect = useCallback(async (stock) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getStockQuote(stock.symbol);
      setSelectedStock(res.success ? res.quote : stock);
    } catch (err) {
      console.error('Error getting stock quote:', err);
      setSelectedStock(stock);
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  }, []);

  // Assemble + submit the order from current ticket state.
  const placeOrder = useCallback(async () => {
    if (!selectedStock) return;
    const qty = parseInt(shares, 10);
    if (!qty || qty < 1) { setError('Enter a valid number of shares'); return; }

    const params = {
      symbol: selectedStock.symbol,
      qty,
      intent,
      type: orderKind,
      timeInForce,
      extendedHours,
    };
    if (orderKind === 'limit' || orderKind === 'stop_limit') params.limitPrice = parseFloat(limitPrice);
    if (orderKind === 'stop' || orderKind === 'stop_limit') params.stopPrice = parseFloat(stopPrice);
    if (orderKind === 'trailing_stop') { params.trailType = trailType; params.trailValue = parseFloat(trailValue); }

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.placeOrder(params);
      if (res.success) {
        setPortfolio(res.portfolio);
        if (res.metrics) setMetrics(res.metrics);
        setLastOrderResult({ order: res.order, message: res.message, at: new Date() });
        setShowOrderConfirmation(true);
        setTimeout(() => setShowOrderConfirmation(false), 4000);
        // Reset conditional fields; keep symbol selected for fast re-orders.
        setShares(1);
        setLimitPrice('');
        setStopPrice('');
        setTrailValue('');
        // Refresh blotter + account.
        loadOpenOrders();
        loadOrderHistory();
        loadTransactions();
        loadAccount();
      } else {
        setError(res.message || 'Order failed');
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setError(handleApiError(err, 'Failed to place order. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedStock, shares, intent, orderKind, timeInForce, extendedHours, limitPrice, stopPrice, trailType, trailValue, loadOpenOrders, loadOrderHistory, loadTransactions, loadAccount]);

  const cancelOrder = useCallback(async (orderId) => {
    try {
      const res = await api.cancelOrder(orderId);
      if (res.success) {
        setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
        loadOrderHistory();
      }
    } catch (err) {
      console.error('Error canceling order:', err);
      setError(handleApiError(err, 'Failed to cancel order.'));
    }
  }, [loadOrderHistory]);

  const clearError = useCallback(() => setError(null), []);
  const refreshData = useCallback(() => syncAll(), [syncAll]);

  return {
    // selection + market
    selectedStock, setSelectedStock, stocks, lastUpdate,
    // order ticket
    intent, setIntent, orderKind, setOrderKind, shares, setShares,
    limitPrice, setLimitPrice, stopPrice, setStopPrice,
    trailType, setTrailType, trailValue, setTrailValue,
    timeInForce, setTimeInForce, extendedHours, setExtendedHours,
    // account + blotter
    portfolio, metrics, openOrders, orderHistory, transactions,
    // status
    clock, marketStatus, isLoading, error, isAuthenticated,
    showOrderConfirmation, lastOrderResult,
    // actions
    handleStockSelect, placeOrder, cancelOrder, clearError, refreshData,
    loadAccount, loadOpenOrders, loadMarketData, updateSelectedStockPrice,
  };
};
