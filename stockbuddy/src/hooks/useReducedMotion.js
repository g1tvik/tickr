import { useEffect, useState } from 'react';

/**
 * useReducedMotion — true when the user (or the device) prefers reduced motion.
 *
 * Use it to gate non-essential animation (custom cursor, parallax, film grain,
 * auto-playing motion) so the app respects accessibility settings and stays
 * comfortable on low-power devices.
 *
 *   const reduce = useReducedMotion();
 *   if (!reduce) { ...start parallax/cursor... }
 *
 * To force-disable all motion app-wide regardless of OS setting, the owner can
 * add `<html data-motion="reduce">` in index.html (handled below).
 */
export default function useReducedMotion() {
  const getInitial = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    if (document.documentElement.getAttribute('data-motion') === 'reduce') return true;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  const [reduced, setReduced] = useState(getInitial);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(getInitial());
    handler();
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  return reduced;
}
