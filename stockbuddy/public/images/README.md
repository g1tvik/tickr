# Image assets — drop your files here

Every image in the app loads through `<AppImage>` (`src/components/AppImage.jsx`),
which shows an on-brand placeholder until the real file exists. So you can ship
now and add images later with **zero code changes** — just drop a correctly named
file into this folder.

## How to add an image

1. Export your image at the suggested size below (JPG for photos, PNG for logos/UI, SVG for icons).
2. Save it in `stockbuddy/public/images/` with the **exact filename** listed.
3. Refresh — the placeholder is replaced automatically. No code edit needed.

## Files the app looks for

### Learn → Articles (featured images, ~600×400, JPG)
| Filename | Used by |
|---|---|
| `investing-basics.jpg` | "Investing Basics" article |
| `stock-analysis.jpg`   | "Stock Analysis" article |
| `market-trends.jpg`    | "Market Trends" article |
| `day-trading.jpg`      | "Day Trading" article |

### Ticker logos (square, ~100×100, PNG with transparency)
`spy-logo.png`, `vti-logo.png`, `aapl-logo.png`, `msft-logo.png`,
`nvda-logo.png`, `tsla-logo.png`, `qqq-logo.png`

### Home page (optional — these have animated placeholders already)
| Filename | Suggested | Where |
|---|---|---|
| `hero-app.png` / `hero-app.mp4` | 1200×900 / short loop | Hero preview (replaces the CSS mock cards) |
| `phone-app.png` | 600×1200 | Inside the 3D phone mockup screen |
| `feature-chart.svg` etc. | 48×48 | Icons next to the "why tickr" feature bullets |

### About page
| Filename | Suggested |
|---|---|
| `team.jpg` | 1200×675 team/founder photo |
| `product-shot.jpg` | 1600×1000 screenshot of the app |

### Social / branding (in `public/`, not here)
- `favicon.svg` — ✅ already added (Tickr mark). Replace to rebrand.
- `og.svg` — ✅ already added (social share card). For maximum compatibility on
  X/Twitter and older Facebook, export a **1200×630 `og.png`** and change the
  `og:image` / `twitter:image` tags in `stockbuddy/index.html` to `/og.png`.

## Animations

- `hero-lottie.json` (already present) powers a Lottie animation slot. Swap the
  file to change it.
- Set `<html data-motion="reduce">` in `index.html` to globally disable heavy
  motion (custom cursor, parallax, film grain). See `src/hooks/useReducedMotion.js`.
