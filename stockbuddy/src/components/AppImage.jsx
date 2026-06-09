import React, { useState } from 'react';

/**
 * AppImage — the single drop-in image component for the whole app.
 *
 * WHY: lets the owner add real images with zero layout work. Point `src` at a
 * file in /public (e.g. "/images/hero.jpg"); if the file is missing or fails to
 * load, a branded on-brand placeholder is shown instead of a broken-image icon,
 * so the UI always looks finished even before assets are dropped in.
 *
 * HOW TO ADD AN IMAGE:
 *   1. Put the file in stockbuddy/public/images/  (see public/images/README.md)
 *   2. <AppImage src="/images/your-file.jpg" alt="describe it" ratio="16/9" />
 *   That's it — sizing, rounding, object-fit and the fallback are handled here.
 *
 * Props:
 *   src        - path under /public (or any URL). Omit to show the placeholder.
 *   alt        - required for accessibility.
 *   ratio      - CSS aspect-ratio string, e.g. "16/9", "1", "4/3". Default "16/9".
 *   rounded    - border radius (number px or CSS string). Default 16.
 *   objectFit  - 'cover' | 'contain'. Default 'cover'.
 *   label      - text shown on the placeholder (defaults to alt).
 *   className, style - passed through to the wrapper.
 */
export default function AppImage({
  src,
  alt = '',
  ratio = '16/9',
  rounded = 16,
  objectFit = 'cover',
  label,
  className = '',
  style = {},
}) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;
  const radius = typeof rounded === 'number' ? `${rounded}px` : rounded;

  return (
    <div
      className={`app-image ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: ratio,
        borderRadius: radius,
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, var(--color-gray-200, #EDE9DF) 0%, var(--color-gray-100, #F4F1E9) 100%)',
        ...style,
      }}
    >
      {showPlaceholder ? (
        <div
          aria-label={alt || 'image placeholder'}
          role="img"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--color-gray-500, #6B7280)',
            textAlign: 'center',
            padding: 16,
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="8.5" cy="8.5" r="1.8" fill="currentColor" />
            <path d="M21 16l-5-5L5 21" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.04em', maxWidth: '90%' }}>
            {label || alt || 'Image'}
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit,
            display: 'block',
          }}
        />
      )}
    </div>
  );
}
