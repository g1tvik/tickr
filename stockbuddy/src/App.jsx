import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
// Google OAuth temporarily disabled
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
import Shop from './pages/Shop';
import ArticleReader from './components/ArticleReader';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const location = useLocation();

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setCurrentLocation(location);
      setIsTransitioning(false);
    }, 300);
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