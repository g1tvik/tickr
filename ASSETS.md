# Adding images & animations to tickr

Everything visual in the app is wired so you can drop in real assets **without touching
code**. This is the one doc you need.

---

## TL;DR

- **Images** → put a correctly-named file in `stockbuddy/public/images/` and it appears.
  Until then, an on-brand placeholder shows (no broken images, ever).
- **Favicon / social card** → already branded (`stockbuddy/public/favicon.svg`,
  `stockbuddy/public/og.svg`). Replace those files to rebrand.
- **Animations** → a Lottie slot (`stockbuddy/public/hero-lottie.json`) and a global
  motion toggle are already in place.

---

## 1. Images

All images render through one component — `src/components/AppImage.jsx` — which shows a
tasteful placeholder until the real file exists. **You never edit code; you just add files.**

Drop files into **`stockbuddy/public/images/`** using these exact names:

| Where in the app | Filename | Suggested size / format |
|---|---|---|
| Article: Investing Basics | `investing-basics.jpg` | 600×400 JPG |
| Article: Stock Analysis | `stock-analysis.jpg` | 600×400 JPG |
| Article: Market Trends | `market-trends.jpg` | 600×400 JPG |
| Article: Day Trading | `day-trading.jpg` | 600×400 JPG |
| Ticker logos | `spy-logo.png`, `vti-logo.png`, `aapl-logo.png`, `msft-logo.png`, `nvda-logo.png`, `tsla-logo.png`, `qqq-logo.png` | 100×100 PNG (transparent) |
| Home: phone screen art | `phone-app.png` | 540×1100 PNG |
| Home: feature bullet icons | `feature-data.png`, `feature-paper.png`, `feature-lessons.png`, `feature-coach.png` | 48×48 PNG |
| About: team photo | `team.jpg` | 1200×675 JPG |
| About: product screenshot | `product-shot.jpg` | 1600×1000 JPG |
| Profile: avatar | `avatar.png` | 256×256 PNG |

Want an image somewhere new? In any page use:

```jsx
import AppImage from '../components/AppImage';
<AppImage src="/images/my-photo.jpg" alt="what it shows" ratio="16/9" />
```

`ratio`, `rounded`, and `objectFit` props handle all the sizing/cropping for you.

---

## 2. Favicon & social share card (Open Graph)

Already shipped and branded:

- **Favicon** — `stockbuddy/public/favicon.svg` (the tickr mark). Replace the file to rebrand.
- **Social card** — `stockbuddy/public/og.svg` (1200×630). It renders on most modern link
  previews. For maximum compatibility on X/Twitter and older Facebook, export a
  **1200×630 `og.png`** into `stockbuddy/public/`, then change the two `og:image` /
  `twitter:image` lines in `stockbuddy/index.html` from `/og.svg` to `/og.png`.

---

## 3. Animations

- **Lottie** — `stockbuddy/public/hero-lottie.json` is a ready slot. Replace it with any
  Lottie JSON to swap the animation.
- **Home page motion** (custom cursor, parallax, film grain, floating particles) is on by
  default and already respects the OS "reduce motion" setting.
- **Turn all heavy motion off globally** — add the attribute to `stockbuddy/index.html`:

  ```html
  <html lang="en" data-motion="reduce">
  ```

  This is read by `src/hooks/useReducedMotion.js`; every animated surface honors it.
- **Background video instead of the animated hero** — drop `hero.mp4` into
  `public/`, then in `src/pages/Home.jsx` the hero preview area is a single self-contained
  block you can replace with a `<video>` (a `// TODO: swap for owner video` marker is there).

---

## 4. Where the placeholders live (so you know what to expect)

Until you add a file, you'll see a soft cream/gold placeholder with the image's label — that
is intentional and looks finished. Replace the file and refresh; no rebuild needed in dev
(`npm run dev`), and for production just rebuild (`npm run build` or `docker compose up --build`).

See also `stockbuddy/public/images/README.md` for the same manifest next to the files.
