# StockBuddy

A modern, fintech dashboard built with React, Vite, and styled-components.

## Features
- **Dashboard:** Overview of your portfolio, paper trading, and quick stats
- **Learn:** Interactive lessons and quizzes to boost your investing knowledge
- **Trade:** Simulate buying and selling stocks in real time
- **Profile:** Track your XP, badges, and trading history
- **Authentication:** Signup and login pages
- **Sidebar:** Scrollable, responsive sidebar for quick access to account info, notifications, and watchlist
- **Reusable Components:** NavBar, Card, Sidebar, and more


## Tech Stack
- [React](https://react.dev/) 19
- [Vite](https://vitejs.dev/) for fast development
- [styled-components](https://styled-components.com/) for modular, themeable styling
- [react-router-dom](https://reactrouter.com/) for routing
- [Axios](https://axios-http.com/) for API requests

## Design System
- **Colors:**
  - Accent Green: `#00c805`
  - Accent Yellow: `#f7e600`
  - Card Background: `#181a1b`
  - Muted Text: `#b0b3b8`
- **Typography:**
  - Modern, readable fonts (Inter, Roboto, Segoe UI, etc.)
- **Spacing:**
  - Generous padding and margin for a clean, uncluttered look
- **Components:**
  - All UI is built with styled-components for easy customization

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
2. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
3. **Build for production:**
   ```bash
   npm run build
   # or
   yarn build
   ```
4. **Preview production build:**
   ```bash
   npm run preview
   # or
   yarn preview
   ```

## Project Structure
```
stockbuddy/
  src/
    app/           # Global styles and layout
    components/    # Reusable UI components (NavBar, Sidebar, Card, etc.)
    pages/         # Main app pages (Dashboard, Learn, Trade, Profile, etc.)
    public/        # Static assets
  .env             # Environment variables (not committed)
  .gitignore       # Ignores .env, Figma exports, etc.
```

## Customization
- All colors and spacing are defined in `src/app/globals.css` as CSS variables.
- UI is fully responsive and scrollable where needed.
- Sidebar and cards are easily extendable with new sections or widgets.

## License
MIT
