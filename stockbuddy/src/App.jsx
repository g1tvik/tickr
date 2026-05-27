import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import PageTransition from "./components/PageTransition";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/Signup";
import Dashboard from './pages/Dashboard';
import Trade from './pages/Trade';
import Learn from './pages/Learn';
import Settings from './pages/Settings';
import LessonDetail from "./pages/LessonDetail";
import AICoach from './pages/AICoach';
import Shop from './pages/Shop';
import Inventory from './pages/Inventory';
import ArticleReader from './components/ArticleReader';
import Waitlist from './pages/Waitlist';
import NotFound from './pages/NotFound';
import About from './pages/About';
import Profile from './pages/Profile';
import Protected from './routes/Protected';
import { NavbarProvider, useNavbar } from './context/NavbarContext';
import { isAuthenticated } from './services/api';
import { useUser } from './store/user';

const LOCKDOWN = import.meta.env.VITE_LOCKDOWN === 'true';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { setNavbarBackground, navbarTheme } = useNavbar();
  const fetchUser = useUser((state) => state.fetchUser);

  // Check token validity on mount and when location changes
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      
      // Fetch user data if authenticated
      if (authenticated) {
        await fetchUser();
      }
      
      // In lockdown mode, only allow /waitlist - redirect everything else
      if (LOCKDOWN && location.pathname !== '/waitlist') {
        console.log('Lockdown mode: redirecting to waitlist');
        navigate('/waitlist', { replace: true });
        return;
      }
      
      // If not in lockdown and user is on a protected route and not authenticated, redirect to sign in
      if (!LOCKDOWN) {
        const protectedRoutes = ['/dashboard', '/trade', '/learn', '/ai-coach', '/shop', '/settings', '/inventory', '/profile'];
        const isProtectedRoute = protectedRoutes.some(route => location.pathname.startsWith(route));
        
        if (isProtectedRoute && !authenticated) {
          console.log('User not authenticated, redirecting to sign in...');
          navigate('/signin', { replace: true });
        }
      }
    };
    
    checkAuth();
  }, [location.pathname, navigate, fetchUser]);

  // Handle page background transitions and navbar coordination
  useEffect(() => {
    console.log(`App: Route changed to ${location.pathname}`);
    const mainContent = document.querySelector('.main-content');
    const pageTransition = document.querySelector('.page-transition');
    const body = document.body;
    const html = document.documentElement;
    const navbar = document.querySelector('.navbar-color');
    
    if (mainContent && pageTransition) {
      // Determine page type based on route
      const isDarkPage = location.pathname === '/trade' || location.pathname === '/ai-coach';
      console.log(`App: isDarkPage = ${isDarkPage} for route ${location.pathname}`);
      
      // Add appropriate classes
      if (isDarkPage) {
        mainContent.classList.add('page-dark');
        pageTransition.classList.add('page-dark');
        body.classList.add('page-dark');
        html.classList.add('page-dark');
        body.classList.remove('home-shell');
        html.classList.remove('home-shell');
        mainContent.classList.remove('page-light');
        pageTransition.classList.remove('page-light');
        body.classList.remove('page-light');
        html.classList.remove('page-light');
        
        // Set navbar to dark theme
        if (navbar) {
          navbar.classList.add('page-dark');
          navbar.classList.remove('page-light');
          setNavbarBackground('var(--color-ink)', { theme: 'dark' });
          console.log('App: Setting navbar to dark theme for Trade/AI Coach page');
        }
      } else {
        const isHomePage = location.pathname === '/';
        // Home uses the lunar dark shell; other non-dark routes remain light.
        mainContent.classList.remove('page-dark', 'page-light');
        pageTransition.classList.remove('page-dark', 'page-light');
        body.classList.remove('page-dark', 'page-light');
        html.classList.remove('page-dark', 'page-light');

        mainContent.classList.add(isHomePage ? 'page-dark' : 'page-light');
        pageTransition.classList.add(isHomePage ? 'page-dark' : 'page-light');
        body.classList.add(isHomePage ? 'page-dark' : 'page-light');
        html.classList.add(isHomePage ? 'page-dark' : 'page-light');
        body.classList.toggle('home-shell', isHomePage);
        html.classList.toggle('home-shell', isHomePage);

        // Home controls navbar dynamically; avoid forcing light on initial load
        if (navbar) {
          navbar.classList.remove('page-dark', 'page-light');
          navbar.classList.add(isHomePage ? 'page-dark' : 'page-light');

          if (isHomePage) {
            setNavbarBackground('transparent', { theme: 'dark' });
            console.log('App: Leaving navbar dark on Home for hero sync');
          } else {
            setNavbarBackground('var(--color-gray-100)', { theme: 'light' });
            console.log('App: Setting navbar to light theme for non-home light pages');
          }
        }
      }
    }
  }, [location.pathname, setNavbarBackground]);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setCurrentLocation(location);
      setIsTransitioning(false);
    }, 0); // No delay - immediate transition to merge with navbar
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const isHomePage = location.pathname === '/';

  return (
    <div className={`app-container${isHomePage ? ' app-container-home' : ''}`}>
      {!LOCKDOWN && <NavBar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} navbarTheme={navbarTheme} />}
      <main className="main-content">
        <PageTransition isVisible={!isTransitioning}>
          <div className="page-content">
            <Routes location={currentLocation || location}>
              {/* In lockdown mode, only waitlist is accessible */}
              {LOCKDOWN ? (
                <>
                  <Route path="/waitlist" element={<Waitlist />} />
                  <Route path="*" element={<Navigate to="/waitlist" replace />} />
                </>
              ) : (
                <>
                  {/* Public routes */}
                  <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
                  <Route path="/signin" element={<SignIn setIsLoggedIn={setIsLoggedIn} />} />
                  <Route path="/signup" element={<SignUp setIsLoggedIn={setIsLoggedIn} />} />
                  <Route path="/waitlist" element={<Waitlist />} />
                  <Route path="/about" element={<About />} />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <Protected>
                      <Dashboard />
                    </Protected>
                  } />
                  <Route path="/trade" element={
                    <Protected>
                      <Trade />
                    </Protected>
                  } />
                  <Route path="/learn" element={
                    <Protected>
                      <Learn />
                    </Protected>
                  } />
                  <Route path="/ai-coach" element={
                    <Protected>
                      <AICoach />
                    </Protected>
                  } />
                  <Route path="/shop" element={
                    <Protected>
                      <Shop />
                    </Protected>
                  } />
                  <Route path="/inventory" element={
                    <Protected>
                      <Inventory />
                    </Protected>
                  } />
                  <Route path="/learn/lesson/:lessonId" element={
                    <Protected>
                      <LessonDetail />
                    </Protected>
                  } />
                  <Route path="/article/:articleId" element={
                    <Protected>
                      <ArticleReader />
                    </Protected>
                  } />
                  <Route path="/settings" element={
                    <Protected>
                      <Settings />
                    </Protected>
                  } />
                  <Route path="/profile" element={
                    <Protected>
                      <Profile />
                    </Protected>
                  } />

                  {/* 404 catch-all */}
                  <Route path="*" element={<NotFound />} />
                </>
              )}
            </Routes>
          </div>
        </PageTransition>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <NavbarProvider>
          <AppContent />
        </NavbarProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
