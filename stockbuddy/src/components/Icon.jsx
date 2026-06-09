import React from 'react';

// ============================================================================
//  Icon — tickr's monoline icon set (Terminal Editorial).
//  Replaces ALL emoji across the app. Stroke uses currentColor, so color it by
//  setting `color` on the parent or passing `color`. Filled glyphs (triangles,
//  dot, diamond, play) set their own fill.
//
//  Usage:  <Icon name="search" size={16} />
//          <Icon name="tri-up" size={10} color="#4FB477" />
// ============================================================================

const STROKE = (
  // default stroked icons — each entry is the inner SVG for a 24x24 viewBox
  {
    search: <><circle cx="11" cy="11" r="7" /><line x1="16.65" y1="16.65" x2="21" y2="21" /></>,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    minus: <line x1="5" y1="12" x2="19" y2="12" />,
    'chevron-down': <polyline points="6 9 12 15 18 9" />,
    'chevron-up': <polyline points="6 15 12 9 18 15" />,
    'chevron-right': <polyline points="9 6 15 12 9 18" />,
    'chevron-left': <polyline points="15 6 9 12 15 18" />,
    'arrow-right': <><line x1="4" y1="12" x2="20" y2="12" /><polyline points="13 5 20 12 13 19" /></>,
    'arrow-left': <><line x1="20" y1="12" x2="4" y2="12" /><polyline points="11 5 4 12 11 19" /></>,
    'arrow-up': <><line x1="12" y1="20" x2="12" y2="4" /><polyline points="5 11 12 4 19 11" /></>,
    'arrow-down': <><line x1="12" y1="4" x2="12" y2="20" /><polyline points="5 13 12 20 19 13" /></>,
    external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>,
    refresh: <><path d="M21 12a9 9 0 1 1-2.64-6.36" /><polyline points="21 4 21 9 16 9" /></>,
    send: <><line x1="22" y1="2" x2="11" y2="13" /><path d="M22 2 15 22 11 13 2 9 22 2Z" /></>,
    chart: <><polyline points="3 16 9 10 13 14 21 6" /><polyline points="15 6 21 6 21 12" /></>,
    candles: <><line x1="7" y1="4" x2="7" y2="20" /><rect x="5" y="8" width="4" height="8" rx="1" /><line x1="16" y1="6" x2="16" y2="18" /><rect x="14" y="10" width="4" height="6" rx="1" /></>,
    'trending-up': <><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></>,
    'trending-down': <><polyline points="3 7 9 13 13 9 21 17" /><polyline points="15 17 21 17 21 11" /></>,
    activity: <polyline points="2 12 6 12 9 4 15 20 18 12 22 12" />,
    dollar: <><line x1="12" y1="2" x2="12" y2="22" /><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    wallet: <><path d="M20 7H5a2 2 0 0 1 0-4h13v4" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H4" /><circle cx="17" cy="13.5" r="1.1" fill="currentColor" stroke="none" /></>,
    coin: <><circle cx="12" cy="12" r="9" /><path d="M15 9.4a3.2 3.2 0 0 0-3-2 3.2 3.2 0 0 0 0 6.4 3.2 3.2 0 0 0 3-2" /></>,
    bag: <><path d="M5 7h14l-1.1 12.1a1 1 0 0 1-1 .9H7.1a1 1 0 0 1-1-.9L5 7Z" /><path d="M8.5 7V6a3.5 3.5 0 0 1 7 0v1" /></>,
    box: <><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" /><path d="M3 7.5 12 12l9-4.5" /><line x1="12" y1="12" x2="12" y2="21" /></>,
    trophy: <><path d="M8 21h8" /><line x1="12" y1="17" x2="12" y2="21" /><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11" /><path d="M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></>,
    bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
    gift: <><rect x="3" y="9" width="18" height="12" rx="1" /><line x1="3" y1="13" x2="21" y2="13" /><line x1="12" y1="9" x2="12" y2="21" /><path d="M12 9C12 9 10.5 4 8 4a2 2 0 0 0 0 5" /><path d="M12 9c0 0 1.5-5 4-5a2 2 0 0 1 0 5" /></>,
    shield: <path d="M12 3 20 6v6c0 4.2-3.2 7.3-8 9-4.8-1.7-8-4.8-8-9V6l8-3Z" />,
    'shield-check': <><path d="M12 3 20 6v6c0 4.2-3.2 7.3-8 9-4.8-1.7-8-4.8-8-9V6l8-3Z" /><polyline points="8.5 12 11 14.5 15.5 9.5" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    'skip-forward': <><path d="M5 4 15 12 5 20Z" /><line x1="19" y1="5" x2="19" y2="19" /></>,
    pause: <><rect x="6" y="5" width="3.5" height="14" rx="1" /><rect x="14.5" y="5" width="3.5" height="14" rx="1" /></>,
    chat: <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />,
    sparkle: <><path d="M12 3l1.7 5.1 5.1 1.7-5.1 1.7L12 16.6l-1.7-5.1L5.2 9.8l5.1-1.7L12 3Z" /><path d="M19 14.5l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6.6-1.8Z" /></>,
    book: <><path d="M12 6S9.5 4 4 4v14c5.5 0 8 2 8 2s2.5-2 8-2V4c-5.5 0-8 2-8 2Z" /><line x1="12" y1="6" x2="12" y2="20" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    star: <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9L12 2.5Z" />,
    info: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="8" r="0.8" fill="currentColor" stroke="none" /></>,
    alert: <><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><line x1="12" y1="9" x2="12" y2="13" /><circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>,
    flame: <path d="M12 2.5c1 3.5 4 5 4 8.5a4 4 0 0 1-8 0c0-1 .3-1.8.8-2.6.6 1 1.5 1.3 2.2 1.3-.7-2.8.5-5.4 1-7.2Z" />,
    cap: <><path d="M22 9 12 5 2 9l10 4 10-4Z" /><path d="M6 11v5c0 1.3 2.7 3 6 3s6-1.7 6-3v-5" /><line x1="22" y1="9" x2="22" y2="14" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    trash: <><polyline points="3 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></>,
    eye: <><path d="M2 12S5.5 5 12 5s10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    'eye-off': <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></>,
    home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" /></>,
    list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    calendar: <><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><line x1="16" y1="2.5" x2="16" y2="6.5" /><line x1="8" y1="2.5" x2="8" y2="6.5" /><line x1="3" y1="9.5" x2="21" y2="9.5" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><polyline points="3 7 12 13 21 7" /></>,
    flag: <><line x1="4" y1="22" x2="4" y2="3" /><path d="M4 4h13l-2 4 2 4H4" /></>,
  }
);

const FILLED = {
  'tri-up': <path d="M12 6 20 18 4 18Z" fill="currentColor" stroke="none" />,
  'tri-down': <path d="M12 18 4 6 20 6Z" fill="currentColor" stroke="none" />,
  dot: <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />,
  diamond: <path d="M12 3 19.5 12 12 21 4.5 12Z" fill="currentColor" stroke="none" />,
  play: <path d="M6 4 20 12 6 20Z" fill="currentColor" stroke="none" />,
};

export default function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  color = 'currentColor',
  className,
  style,
  title,
}) {
  const filled = FILLED[name];
  const inner = filled || STROKE[name] || STROKE.dollar;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={filled ? 'none' : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, display: 'block', ...style }}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {inner}
    </svg>
  );
}

// Named export too, for `import { Icon }` ergonomics.
export { Icon };
