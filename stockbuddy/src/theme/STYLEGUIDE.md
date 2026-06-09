# tickr — Terminal Editorial style guide

The single source of truth for the site's visual identity. A **private-bank trading
desk meets editorial print**. Read this fully before restyling any surface.

The colors are NOT the problem — the gold/charcoal/cream palette stays. The job is to
fix the **shapes, type, icons, and structure** that read as "AI-generated / vibecoded".

---

## 0. Golden rules

1. **STYLING ONLY.** Never change logic, handlers, props, hooks, state, router targets,
   data shapes, API calls, `useSEO`, accessibility attributes, or controlled-input wiring.
   Read the file first; restyle in place (prefer surgical Edits over full rewrites,
   especially for large files). The component must behave identically afterward.
2. **NO emoji.** Replace every emoji/decorative glyph with `<Icon name="…" />` (see §4).
3. **Numbers are the hero.** Every price, %, count, date, XP, coin, level → monospace
   tabular figures via the `mono` style (see §3). Right-align numeric columns.
4. **No card-soup.** Do not stack rounded shadow-cards 3 deep. Group content into
   **sections** separated by **hairline rules**; panels are flat with a 1px hairline
   border and a small radius. Elevation comes from hierarchy, not glow.
5. **Labels are small-caps.** Section/field labels use the `label` style (uppercase,
   tracked, ~10.5px, muted), usually beside or above a hairline rule.
6. **Tight geometry.** Radii 4–8px (`tk.r`/`tk.rSm`). Kill heavy `box-shadow`/glows and
   `backdrop-filter`. A modal/overlay may use one subtle shadow; panels use none.
7. **Restrained gold.** Reserve gold for the primary action, active states, and accents
   — not flat-filled on everything.

## 1. Do NOT touch these shared files (import from them only)
`src/theme/terminal.js`, `src/components/Icon.jsx`, `src/globals.css`, `src/fontPalette.js`,
`src/marblePalette.js`.

## 2. Imports

Pages (`src/pages/*.jsx`):
```js
import tk, { label, mono, panel, inset, heading, btnPrimary, btnGhost, tag, tone } from '../theme/terminal';
import Icon from '../components/Icon';
```
Components (`src/components/*.jsx`):
```js
import tk, { label, mono, panel, inset, heading, btnPrimary, btnGhost, tag, tone } from '../theme/terminal';
import Icon from './Icon';
```
Import only what you use. You don't have to delete existing palette imports if still used.

## 3. Tokens & style helpers (from terminal.js)

```
tk.bg #1F1F1F   tk.surface #262626   tk.raised #2E2E2E   tk.inset #191919
tk.text #F4F1E9 (cream)   tk.muted #9A958B   tk.faint #6B665E
tk.gold #B69C60   tk.goldBright #E6C87A   tk.goldDim #8C7A4C
tk.up #4FB477 (+upBg)   tk.down #E0605A (+downBg)   tk.warn #D9A441
tk.hair rgba(244,241,233,.10)   tk.hairStrong .16   tk.goldHair rgba(182,156,96,.38)
tk.r 8   tk.rSm 5   tk.rXs 3
tone(n) -> tk.up if n>0, tk.down if n<0, else tk.muted
```
Style objects to spread into inline `style={{ ...x }}`:
`label` (small-caps), `mono` (tabular numerals), `panel` (flat hairline panel),
`inset` (input/well), `heading` (Creato Display), `btnPrimary`, `btnGhost`, `tag`.

## 4. Emoji → Icon map (replace ALL of these)

| was | `<Icon name>` | | was | `<Icon name>` |
|---|---|---|---|---|
| 🎯 | target | | 📅 | calendar |
| 🪙 | coin | | 💰 | wallet |
| 💼 | wallet | | 📊 | chart |
| 📈 | trending-up | | 📉 | trending-down |
| 💬 | chat | | 🤖 | sparkle |
| 🏆 / 👑 | trophy | | 📝 | edit |
| 🔒 | lock | | 🛡️ | shield |
| ⚡ | bolt | | 🎁 | gift |
| ⏭️ | skip-forward | | ⏸️ | pause |
| 📦 / 🎒 | box | | 🛍️ | bag |
| 👤 | user | | 📚 | book |
| 💾 | download | | 🔧 | settings |
| ⭐ ★ ✦ ✶ | star | | ◆ ◇ ◈ | diamond |
| 🔍 | search | | ⚠️ | alert |
| ↻ 🔄 | refresh | | × ✕ ❌ | x |
| ✓ ✅ | check | | 💡 | sparkle |
| ▲ △ | tri-up | | ▼ ▽ | tri-down |
| ← | arrow-left | | → ➡️ | arrow-right |
| ● (status dot) | dot | | 🎉 | sparkle |

- Size icons 14–18 (inline with text), 9–10 for the tri-up/tri-down gain/loss markers.
- Color via the parent's `color`, or `color={...}` (e.g. gold for accents, `tone(n)` for deltas).
- Scenario emoji (🚗🎮🍎₿) and similar content glyphs → drop the emoji and show the **ticker
  symbol in a `tag`** (e.g. `<span style={tag}>TSLA</span>`).
- In-chat text like "🤔 Analyzing your decision…" → drop the emoji (plain text).
- The "← Back" affordance → `<Icon name="arrow-left" size={14}/>` + text.

## 5. Canonical patterns (match these exactly)

**Section header** (small-caps label + hairline rule that fills the row; optional right meta):
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
  <span style={label}>portfolio</span>
  <span style={{ flex: 1, height: 1, background: tk.hair }} />
  <span style={{ ...mono, fontSize: 11, color: tk.muted }}>mkt open</span>
</div>
```

**Panel** (flat, hairline — replaces shadowed rounded cards):
```jsx
<div style={{ ...panel, padding: 20 }}> … </div>
```

**Stat** (tiny caps label over big mono value + delta):
```jsx
<div>
  <div style={{ ...label, marginBottom: 8 }}>portfolio value</div>
  <div style={{ ...mono, fontSize: 30, fontWeight: 500, color: tk.text, lineHeight: 1 }}>{fmt(value)}</div>
  <div style={{ ...mono, fontSize: 12, color: tone(ret), display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
    <Icon name={ret >= 0 ? 'tri-up' : 'tri-down'} size={9} /> {fmtPct(ret)}
  </div>
</div>
```

**Data row** (holding / market row — aligned, hairline divider, mono numbers):
```jsx
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: `1px solid ${tk.hair}` }}>
  <div>
    <div style={{ ...mono, fontSize: 13, fontWeight: 600, color: tk.text }}>AAPL</div>
    <div style={{ fontSize: 11, color: tk.muted }}>Apple Inc.</div>
  </div>
  <div style={{ textAlign: 'right' }}>
    <div style={{ ...mono, fontSize: 13, color: tk.text }}>{fmt(price)}</div>
    <div style={{ ...mono, fontSize: 11, color: tone(ch), display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Icon name={ch >= 0 ? 'tri-up' : 'tri-down'} size={8} /> {fmtPct(ch)}
    </div>
  </div>
</div>
```

**Buttons** (rectangular, small radius; primary gold / secondary ghost; icon optional):
```jsx
<button style={btnPrimary}>Trade</button>
<button style={{ ...btnGhost, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
  <Icon name="refresh" size={14} /> Refresh
</button>
```

**Tag / status chip:**
```jsx
<span style={tag}>owned</span>
<span style={{ ...tag, color: tk.up, borderColor: 'rgba(79,180,119,.4)' }}>
  <Icon name="dot" size={7} /> market open
</span>
```

**Input / select:**
```jsx
<input style={{ ...inset, padding: '11px 14px', color: tk.text, fontFamily: tk.fontBody, fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' }} />
```

**Empty state** (NOT a giant centered emoji — restrained, left/center aligned with a hairline-framed icon):
```jsx
<div style={{ textAlign: 'center', padding: '40px 24px' }}>
  <div style={{ width: 44, height: 44, margin: '0 auto 14px', border: `1px solid ${tk.goldHair}`, borderRadius: tk.rSm, display: 'grid', placeItems: 'center', color: tk.gold }}>
    <Icon name="search" size={18} />
  </div>
  <div style={{ ...heading, fontSize: 16, marginBottom: 6 }}>Pick a stock to start trading</div>
  <div style={{ fontSize: 13, color: tk.muted, lineHeight: 1.5, maxWidth: 360, margin: '0 auto' }}>Search above…</div>
</div>
```

**Page scaffold** (dark pages): wrapper `background: tk.bg`, content `maxWidth` centered.
Page title uses `heading` (sentence case, e.g. "Paper trading"), not bold-700 + emoji.

## 6. Headings & type

- Page title: `heading` (Creato Display, weight 500, tight tracking), ~24–30px. Sentence case.
- Section labels: `label` (small-caps tracked).
- Body: `tk.fontBody`, `tk.text`/`tk.muted`.
- Data/numbers: `mono`. **Never** set big monetary/% values in the body font.
- Drop emoji from headings; if a heading needs a mark, prefix a small `<Icon/>` in gold.

## 7. Styled-components surfaces (Home.jsx, About.jsx, NotFound.jsx)

Import `{ tk }` and interpolate tokens into the styled templates, e.g.
`background: ${tk.surface}; border: 1px solid ${tk.hair}; border-radius: ${tk.r}px;`.
Use `<Icon/>` in JSX. Convert numeric/price text to a styled element with
`font-family: ${tk.fontMono}; font-variant-numeric: tabular-nums;`.
For **Home** specifically: flatten the 3D floating glass-card stack into one flat
hairline-ruled panel; remove or hard-gate behind reduced-motion the decorative layers
(custom cursor, film grain, magnetic buttons, cascade dots, glow orbs, scroll-spun phone,
shimmer tracer text); replace the multi-stop blue→gold page gradient with flat charcoal
(`tk.bg`) accented by at most one subtle gold hairline; small-caps section labels with a
hairline rule instead of the centered light-weight `SectionTitle`.

## 8. Acceptance checklist (every surface must pass)

- [ ] Zero emoji remain; all glyphs are `<Icon/>`.
- [ ] Every number/price/%/date/count is `mono` (tabular).
- [ ] Section labels are small-caps with hairline rules; no card-soup.
- [ ] Radii ≤ 8px; no heavy shadows/glows/backdrop-filter on panels.
- [ ] Brand colors only (gold/charcoal/cream + semantic up/down).
- [ ] Logic, props, handlers, router targets, a11y unchanged. Builds clean.
