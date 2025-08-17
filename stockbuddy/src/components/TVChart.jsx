import { useEffect, useMemo, useRef, useState } from "react";

export default function TVChart({
  symbol,
  interval = "5",
  scenarioId,
  active,
  mode = "widget",
  startDate,
  endDate,
}) {
  const hostRef = useRef(null);
  const widgetRef = useRef(null);
  const roRef = useRef(null);
  const [hadError, setHadError] = useState(false);

  const normSymbol = useMemo(() => normalizeSymbol(symbol.trim()), [symbol]);
  const containerId = useMemo(
    () => `tv-chart-${scenarioId}-${Math.random().toString(36).slice(2)}`,
    [scenarioId]
  );

  // Convert scenario dates to timestamps for TradingView
  const dateRange = useMemo(() => {
    if (!startDate || !endDate) return null;
    try {
      const start = Math.floor(new Date(startDate + 'T00:00:00Z').getTime() / 1000);
      const end = Math.floor(new Date(endDate + 'T23:59:59Z').getTime() / 1000);
      return { start, end };
    } catch {
      return null;
    }
  }, [startDate, endDate]);

  const hasSize = () => {
    const el = hostRef.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const cleanup = () => {
    try { roRef.current?.disconnect(); } catch {}
    roRef.current = null;
    try { widgetRef.current?.remove?.(); } catch {}
    widgetRef.current = null;
    if (hostRef.current) hostRef.current.replaceChildren();
  };

  // Clear potentially corrupted saved chart state (only our namespace)
  // TradingView stores some state in localStorage; bad state can crash create_series.
  useEffect(() => {
    // keys observed to hold layout/state; keep this surgical.
    const keys = Object.keys(localStorage);
    keys.forEach((k) => {
      if (
        k.startsWith("tradingview.chart.lastUsed") ||
        k.startsWith("tradingview.favorite_intervals") ||
        k.startsWith("tradingview.chartproperties") ||
        k.includes("chartsettings")
      ) {
        try { localStorage.removeItem(k); } catch {}
      }
    });
  }, [scenarioId]);

  useEffect(() => {
    if (!active || !hostRef.current || !hasSize()) return;

    cleanup();
    setHadError(false);

    // Ensure inner container exists
    const inner = document.createElement("div");
    inner.id = containerId;
    inner.style.width = "100%";
    inner.style.height = "100%";
    hostRef.current.appendChild(inner);

    const initWidget = () => {
      if (mode === "embed") {
        const target = document.getElementById(containerId);
        if (!target) return false;
        target.innerHTML = "";
        const s = document.createElement("script");
        s.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        s.async = true;
        s.innerHTML = JSON.stringify({
          symbol: normSymbol,         // IMPORTANT
          interval,                   // "5" | "15" | "60" | "1D"
          autosize: true,
          theme: "dark",
          locale: "en",
          allow_symbol_change: false,
          withdateranges: true,
          range: dateRange ? `${dateRange.start}-${dateRange.end}` : "1M",
          time_frames: dateRange ? [
            { text: "Scenario", resolution: interval, description: `${startDate} to ${endDate}` }
          ] : undefined,
        });
        s.onerror = () => setHadError(true);
        target.appendChild(s);
        widgetRef.current = { type: "embed" };
        return true;
      }

      const tv = window.TradingView;
      if (!tv?.widget) return false;

      try {
        const w = new tv.widget({
          symbol: normSymbol,               // IMPORTANT
          interval,
          autosize: true,
          theme: "dark",
          locale: "en",
          timezone: "Etc/UTC",
          container_id: containerId,        // pass ID string
          // Disable real-time updates for historical scenarios
          realtime: false,
          // Set date range for scenario context
          ...(dateRange && { range: `${dateRange.start}-${dateRange.end}` }),
          // Avoid loading user-saved layouts that could be corrupt
          // disabled_features: ["use_localstorage_for_settings"],
        });

        // If TradingView throws internally, signal UI
        // onChartReady is a good hook to try a fit/resize
        w.onChartReady?.(() => {
          try {
            w?.chart?.().timeScale?.().fitContent?.();
          } catch {}
        });

        widgetRef.current = w;
        return true;
      } catch {
        return false;
      }
    };

    // 1st try
    let ok = initWidget();

    // If tv.js not ready yet, or it threw, retry once on next frame
    if (!ok) {
      const raf = requestAnimationFrame(() => {
        const ok2 = initWidget();
        if (!ok2) setHadError(true);
      });
      widgetRef.current = { _raf: raf };
    }

    // Resize handling
    const ro = new ResizeObserver(() => {
      try {
        widgetRef.current?.resize?.();
        widgetRef.current?.chart?.().timeScale?.().fitContent?.();
      } catch {}
    });
    ro.observe(hostRef.current);
    roRef.current = ro;

    return cleanup;
  }, [active, normSymbol, interval, scenarioId, mode, containerId, dateRange]);

  // Kick a resize when tab becomes visible
  useEffect(() => {
    if (!active) return;
    const id = requestAnimationFrame(() => {
      try {
        widgetRef.current?.resize?.();
        widgetRef.current?.chart?.().timeScale?.().fitContent?.();
      } catch {}
    });
    return () => cancelAnimationFrame(id);
  }, [active]);

  return (
    <div className="w-full" style={{ height: 420, minHeight: 420 }}>
      <div
        ref={hostRef}
        className="tvchart-container"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

function normalizeSymbol(s) {
  // TradingView's free data expects an exchange prefix for some symbols.
  // Handle specific symbols with their correct exchanges
  if (!s?.includes(":")) {
    if (/^[A-Z.]+$/.test(s)) {
      // Special cases for specific symbols
      if (s === "GME") return "NYSE:GME";        // GameStop is on NYSE
      if (s === "BTC") return "CRYPTOCAP:BTC";  // Bitcoin uses CRYPTOCAP
      if (s === "TSLA") return "NASDAQ:TSLA";   // Tesla is on NASDAQ
      if (s === "AAPL") return "NASDAQ:AAPL";   // Apple is on NASDAQ
      
      // Default to NASDAQ for other symbols
      return `NASDAQ:${s}`;
    }
  }
  return s;
}
