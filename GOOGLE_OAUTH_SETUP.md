# Google OAuth Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Identity API

## Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "tickr"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users (your email) if in testing mode

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost:5176` (for development)
   - `http://localhost:3000` (if needed)
5. Add authorized redirect URIs:
   - `http://localhost:5176`
   - `http://localhost:3000`
6. Copy the Client ID

## Step 4: Update Environment Variables

### Frontend (.env file in stockbuddy directory):
```
REACT_APP_GOOGLE_CLIENT_ID=your-actual-client-id-here
```

### Backend (.env file in auth-backend directory):
```
GOOGLE_CLIENT_ID=your-actual-client-id-here
JWT_SECRET=your-jwt-secret-here
MONGO_URI=your-mongodb-connection-string
```

## Step 5: Restart Your Servers

1. Stop both frontend and backend servers
2. Restart the backend: `cd auth-backend && npm start`
3. Restart the frontend: `cd stockbuddy && npm run dev`

## Features Added

✅ **Google Sign-In/Sign-Up buttons** on both login and registration pages
✅ **Automatic account linking** - if a user signs up with Google using an email that already exists, it links the accounts
✅ **JWT token generation** for Google users
✅ **User profile data** - stores name and profile picture from Google
✅ **Seamless authentication** - users can sign in with either email/password or Google

## Security Features

- Google ID tokens are verified on the backend
- JWT tokens are generated for session management
- Password is optional for Google OAuth users
- Existing email accounts can be linked with Google accounts

## Testing

1. Go to `http://localhost:5176/signup` or `http://localhost:5176/signin`
2. Click the "Sign in with Google" button
3. Complete Google authentication
4. You should be redirected to the dashboard with a valid session

## Troubleshooting

- Make sure your Google Client ID is correct in both .env files
- Ensure the authorized origins include your development URL
- Check that the Google+ API is enabled in your Google Cloud Console
- Verify that your OAuth consent screen is properly configured 