// ============================================================================
//  TERMINAL EDITORIAL — tickr design system
//  A private-bank trading desk meets editorial print. Import these tokens and
//  style helpers everywhere so the whole app shares ONE identity.
//
//  PRINCIPLES (read before styling a surface):
//   1. NO card-soup. Don't stack rounded shadow-cards 3 deep. Group content
//      into SECTIONS divided by thin hairline rules. Panels are flat with a
//      1px hairline border and a small radius — elevation comes from hierarchy,
//      not glow.
//   2. Numbers are the hero. Every price, %, count, date, XP, coin → `mono`
//      (monospace + tabular figures). Right-align numeric columns.
//   3. Labels are small-caps. Section/field labels use `label` (uppercase,
//      tracked, 11px, muted), usually beside or above a hairline rule.
//   4. NO emoji. Use <Icon name=".." /> (src/components/Icon.jsx) for every
//      glyph. Monoline, currentColor.
//   5. Tight, architectural radii (4–8px). Hairlines over heavy borders.
//      Reserve gold for accents, active states, and the primary action.
// ============================================================================

import { fontHeading, fontBody, fontMono } from '../fontPalette';

export const tk = {
  // ── Surfaces (charcoal ramp, layered) ──────────────────────────────────────
  bg: '#1F1F1F',        // page background
  surface: '#262626',   // primary panel
  raised: '#2E2E2E',    // nested / interactive surface
  inset: '#191919',     // deepest inset (chart wells, inputs, scroll areas)

  // ── Text ────────────────────────────────────────────────────────────────────
  text: '#F4F1E9',      // primary cream
  muted: '#9A958B',     // secondary / labels
  faint: '#6B665E',     // tertiary / disabled

  // ── Brand gold ───────────────────────────────────────────────────────────────
  gold: '#B69C60',
  goldBright: '#E6C87A',
  goldDim: '#8C7A4C',

  // ── Semantic (refined, less "default Tailwind") ──────────────────────────────
  up: '#4FB477',
  upBg: 'rgba(79,180,119,0.12)',
  down: '#E0605A',
  downBg: 'rgba(224,96,90,0.12)',
  warn: '#D9A441',

  // ── Lines ─────────────────────────────────────────────────────────────────────
  hair: 'rgba(244,241,233,0.10)',        // structural hairline
  hairStrong: 'rgba(244,241,233,0.16)',  // emphasis hairline
  goldHair: 'rgba(182,156,96,0.38)',     // accent hairline
  goldHairFaint: 'rgba(182,156,96,0.18)',

  // ── Geometry ───────────────────────────────────────────────────────────────────
  r: 8,     // panels
  rSm: 5,   // chips / buttons / inputs
  rXs: 3,   // ticks / tiny

  // ── Fonts (re-exported for convenience) ──────────────────────────────────────
  fontHeading,
  fontBody,
  fontMono,
};

// Pick gain/loss color from a number (0 → muted).
export const tone = (n) => (n > 0 ? tk.up : n < 0 ? tk.down : tk.muted);

// ── Reusable style objects (spread into inline style props) ───────────────────

// Small-caps tracked label. Use for section + field labels.
export const label = {
  fontFamily: fontBody,
  fontSize: '10.5px',
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: tk.muted,
};

// Monospace tabular numerals — the data signature. Spread onto any number.
export const mono = {
  fontFamily: fontMono,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.01em',
};

// Flat hairline panel (NOT a floating shadow-card).
export const panel = {
  background: tk.surface,
  border: `1px solid ${tk.hair}`,
  borderRadius: `${tk.r}px`,
};

// Deepest inset well (inputs, chart frame, scroll regions).
export const inset = {
  background: tk.inset,
  border: `1px solid ${tk.hair}`,
  borderRadius: `${tk.rSm}px`,
};

// Display heading (page titles). Use sparingly; sentence or Title Case, tight.
export const heading = {
  fontFamily: fontHeading,
  fontWeight: 500,
  letterSpacing: '-0.01em',
  color: tk.text,
};

// Primary action — solid gold, dark ink, rectangular.
export const btnPrimary = {
  fontFamily: fontBody,
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.02em',
  color: '#1F1F1F',
  background: tk.gold,
  border: 'none',
  borderRadius: `${tk.rSm}px`,
  padding: '9px 16px',
  cursor: 'pointer',
};

// Secondary action — ghost with hairline border.
export const btnGhost = {
  fontFamily: fontBody,
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '0.01em',
  color: tk.text,
  background: 'transparent',
  border: `1px solid ${tk.hairStrong}`,
  borderRadius: `${tk.rSm}px`,
  padding: '8px 15px',
  cursor: 'pointer',
};

// Small tracked tag / pill (status, rarity, category).
export const tag = {
  fontFamily: fontMono,
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: tk.gold,
  background: 'transparent',
  border: `1px solid ${tk.goldHair}`,
  borderRadius: `${tk.rXs}px`,
  padding: '2px 7px',
};

export default tk;
