/**
 * useModalA11y — makes an inline modal/dialog keyboard-accessible without
 * changing its markup structure. Attach the returned ref to the dialog panel
 * and pair it with role="dialog" aria-modal="true".
 *
 * When `isOpen` is true it:
 *   - moves focus into the dialog (first focusable element, else the panel),
 *   - traps Tab / Shift+Tab within the dialog,
 *   - closes on Escape (via onClose),
 *   - locks background scroll,
 *   - restores focus to the previously-focused element on close.
 *
 * Escape-only dismissal is intentional: form dialogs shouldn't close on a stray
 * backdrop click and lose what the user typed.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @returns {React.RefObject<HTMLElement>} ref to attach to the dialog panel
 */
import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
  'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function useModalA11y(isOpen, onClose) {
  const ref = useRef(null);
  // Keep the latest onClose in a ref so callers can pass an inline arrow
  // without re-running (and re-stealing focus on) every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;

    const dialog = ref.current;
    const previouslyFocused = document.activeElement;

    // Move focus into the dialog.
    const focusables = dialog ? dialog.querySelectorAll(FOCUSABLE) : [];
    if (focusables.length) {
      focusables[0].focus();
    } else if (dialog) {
      dialog.setAttribute('tabindex', '-1');
      dialog.focus();
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      // Focus trap: keep Tab cycling within the dialog.
      const items = dialog.querySelectorAll(FOCUSABLE);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    // Lock background scroll while the dialog is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      // Restore focus to whatever opened the dialog.
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]); // onClose is read via onCloseRef, so it isn't a dependency

  return ref;
}
