import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import PageTransition from "./components/PageTransition";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/Signup";
import Dashboard from './pages/Dashboard';

// Wrapper component to handle location changes
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Start transition immediately when location changes
    setIsTransitioning(true);
    
    // After transition out, update location and transition back in
    const timer = setTimeout(() => {
      setCurrentLocation(location);
      setIsTransitioning(false);
    }, 300); // Match the CSS transition duration
    
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
              <Route path="/signup" element={<SignUp />} />
              <Route path="/dashboard" element={<Dashboard />} />
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