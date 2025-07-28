# Frontend Environment Setup

## Quick Fix for the "process is not defined" Error

The error you encountered is because Vite uses `import.meta.env` instead of `process.env` for environment variables.

## Create Environment File

Create a file called `.env` in your `stockbuddy` folder with these contents:

```env
# StockBuddy Frontend Environment Variables
# Vite requires environment variables to be prefixed with VITE_

# API Configuration
VITE_API_URL=http://localhost:5001/api

# Google OAuth (optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## What I Fixed

1. **Updated `src/services/api.js`**: Changed `process.env.REACT_APP_API_URL` to `import.meta.env.VITE_API_URL`
2. **Updated `src/App.jsx`**: Changed `import.meta.env.VITE_REACT_APP_GOOGLE_CLIENT_ID` to `import.meta.env.VITE_GOOGLE_CLIENT_ID`

## Vite Environment Variable Rules

- All environment variables must be prefixed with `VITE_`
- Use `import.meta.env.VITE_VARIABLE_NAME` to access them
- Only variables prefixed with `VITE_` are exposed to the browser

## Test Your Setup

1. Create the `.env` file above
2. Restart your development server: `npm run dev`
3. The error should be gone!

## Optional: Google OAuth Setup

If you want to use Google OAuth:
1. Get your Google Client ID from Google Cloud Console
2. Replace `your_google_client_id_here` in the `.env` file
3. The app will work without it (just won't have Google login)

That's it! Your app should now work without the "process is not defined" error. 