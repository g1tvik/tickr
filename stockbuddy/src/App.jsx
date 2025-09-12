import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import PageTransition from "./components/PageTransition";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/Signup";
import Dashboard from './pages/Dashboard';
import Trade from './pages/Trade';
import Learn from './pages/Learn';
import Settings from './pages/Settings';
import LessonDetail from "./pages/LessonDetail";
import Discover from './pages/Discover';
import AICoach from './pages/AICoach';
import Shop from './pages/Shop';
import ArticleReader from './components/ArticleReader';
import { useNavbarBackground } from './hooks/useNavbarBackground';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const location = useLocation();
  const { setNavbarBackground } = useNavbarBackground();

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
        mainContent.classList.remove('page-light');
        pageTransition.classList.remove('page-light');
        body.classList.remove('page-light');
        html.classList.remove('page-light');
        
        // Set navbar to dark theme
        if (navbar) {
          navbar.classList.add('page-dark');
          navbar.classList.remove('page-light');
          setNavbarBackground('var(--marbleDarkGray)');
          console.log('App: Setting navbar to dark theme for Trade/AI Coach page');
        }
      } else {
        mainContent.classList.remove('page-dark');
        pageTransition.classList.remove('page-dark');
        body.classList.remove('page-dark');
        html.classList.remove('page-dark');
        mainContent.classList.add('page-light');
        pageTransition.classList.add('page-light');
        body.classList.add('page-light');
        html.classList.add('page-light');
        
        // Set navbar to light theme (will be overridden by Home page if needed)
        if (navbar) {
          navbar.classList.remove('page-dark');
          navbar.classList.add('page-light');
          setNavbarBackground('var(--marbleWhite)');
          console.log('App: Setting navbar to light theme for other pages');
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

  return (
    <div className="app-container">
      <NavBar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <main className="main-content">
        <PageTransition isVisible={!isTransitioning}>
          <div className="page-content">
            <Routes location={currentLocation || location}>
              <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
              <Route path="/signin" element={<SignIn setIsLoggedIn={setIsLoggedIn} />} />
              <Route path="/signup" element={<SignUp setIsLoggedIn={setIsLoggedIn} />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/trade" element={<Trade />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/ai-coach" element={<AICoach />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/learn/lesson/:lessonId" element={<LessonDetail />} />
              <Route path="/article/:articleId" element={<ArticleReader />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </PageTransition>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App; 