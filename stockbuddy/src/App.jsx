import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import PageTransition from "./components/PageTransition";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Trade = lazy(() => import('./pages/Trade'));
const Learn = lazy(() => import('./pages/Learn'));
const Settings = lazy(() => import('./pages/Settings'));
const LessonDetail = lazy(() => import("./pages/LessonDetail"));
const AICoach = lazy(() => import('./pages/AICoach'));
const Shop = lazy(() => import('./pages/Shop'));
const Inventory = lazy(() => import('./pages/Inventory'));
const ArticleReader = lazy(() => import('./components/ArticleReader'));
const Waitlist = lazy(() => import('./pages/Waitlist'));
const NotFound = lazy(() => import('./pages/NotFound'));
const About = lazy(() => import('./pages/About'));
const Profile = lazy(() => import('./pages/Profile'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Disclaimer = lazy(() => import('./pages/Disclaimer'));
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
        if (import.meta.env.DEV) console.log('Lockdown mode: redirecting to waitlist');
        navigate('/waitlist', { replace: true });
        return;
      }
      
      // If not in lockdown and user is on a protected route and not authenticated, redirect to sign in
      if (!LOCKDOWN) {
        const protectedRoutes = ['/dashboard', '/trade', '/learn', '/ai-coach', '/shop', '/settings', '/inventory', '/profile'];
        const isProtectedRoute = protectedRoutes.some(route => location.pathname.startsWith(route));
        
        if (isProtectedRoute && !authenticated) {
          if (import.meta.env.DEV) console.log('User not authenticated, redirecting to sign in...');
          navigate('/signin', { replace: true });
        }
      }
    };
    
    checkAuth();
  }, [location.pathname, navigate, fetchUser]);

  // Handle page background transitions and navbar coordination
  useEffect(() => {
    if (import.meta.env.DEV) console.log(`App: Route changed to ${location.pathname}`);
    const mainContent = document.querySelector('.main-content');
    const pageTransition = document.querySelector('.page-transition');
    const body = document.body;
    const html = document.documentElement;
    const navbar = document.querySelector('.navbar-color');
    
    if (mainContent && pageTransition) {
      // Every inner page now uses the Terminal Editorial dark theme, so the
      // navbar matches the dark content beneath it. Home is the exception: it
      // runs its own scroll-driven adaptive navbar (dark hero → light features
      // → dark footer) via its IntersectionObserver, so we only seed it here.
      const onHome = location.pathname === '/';

      const setShell = (el, dark) => {
        if (!el) return;
        el.classList.toggle('page-dark', dark);
        el.classList.toggle('page-light', !dark);
      };

      // All app shells are dark (Home included — its hero sits on the dark shell).
      [mainContent, pageTransition, body, html].forEach((el) => setShell(el, true));
      body.classList.toggle('home-shell', onHome);
      html.classList.toggle('home-shell', onHome);

      if (navbar) {
        navbar.classList.add('page-dark');
        navbar.classList.remove('page-light');
        // Solid charcoal matching the page background (--tk-bg) on every route.
        // Home re-applies this (and the cream features band) via its own observer.
        setNavbarBackground('var(--tk-bg)', { theme: 'dark' });
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
            <Suspense fallback={<div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
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
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/disclaimer" element={<Disclaimer />} />

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
            </Suspense>
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
