/**
 * ToastContext — app-wide, Terminal Editorial toast notifications.
 * Replaces window.alert() for user feedback: flat hairline panels stacked
 * bottom-right, auto-dismissing, screen-reader announced (aria-live).
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast('Profile updated');                                  // success (default)
 *   toast('Could not save', { variant: 'error' });
 *   toast('80% — passed!', { title: 'Unit test complete', duration: 6000 });
 */
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import tk, { label as labelStyle } from '../theme/terminal';
import Icon from '../components/Icon';

const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: 'check', accent: tk.up, border: 'rgba(79,180,119,0.4)' },
  error: { icon: 'alert', accent: tk.down, border: 'rgba(224,96,90,0.4)' },
  info: { icon: 'sparkle', accent: tk.gold, border: tk.goldHair },
};

const DEFAULT_DURATION = 4500;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, opts = {}) => {
    const id = ++idRef.current;
    const variant = VARIANTS[opts.variant] ? opts.variant : 'success';
    setToasts((list) => [...list, { id, message, title: opts.title || null, variant }]);
    const duration = opts.duration ?? DEFAULT_DURATION;
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Stack: fixed bottom-right, above modals (modal overlays use z 1000). */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 'min(380px, calc(100vw - 40px))',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => {
          const v = VARIANTS[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: tk.surface,
                border: `1px solid ${v.border}`,
                borderLeft: `2px solid ${v.accent}`,
                borderRadius: tk.rSm,
                padding: '12px 14px',
                color: tk.text,
                fontFamily: tk.fontBody,
              }}
            >
              <span style={{ color: v.accent, display: 'inline-flex', marginTop: 1 }}>
                <Icon name={v.icon} size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <div style={{ ...labelStyle, color: v.accent, marginBottom: 4 }}>{t.title}</div>
                )}
                <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{t.message}</div>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: tk.muted,
                  cursor: 'pointer',
                  padding: 2,
                  display: 'inline-flex',
                }}
              >
                <Icon name="x" size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
