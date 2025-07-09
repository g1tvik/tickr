import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Trade from './pages/Trade';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { FaBars } from 'react-icons/fa'; // Add this for hamburger icon

// Grid container for the whole app
const GridWrapper = styled.div`
  display: grid;
  grid-template-areas:
    'navbar${props => props.hasSidebar ? ' navbar' : ''}'
    'main${props => props.hasSidebar ? ' sidebar' : ''}';
  grid-template-columns: ${props => props.hasSidebar ? '1fr 400px' : '1fr'};
  grid-template-rows: 4.5rem 1fr;
  min-height: 100vh;
  background: var(--background, #0a0a0a);
  color: var(--text-main, #f5f6fa);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      'navbar'
      'main';
  }
`;

const NavBarArea = styled.div`
  grid-area: navbar;
  z-index: 100;
`;

const MainArea = styled.main`
  grid-area: main;
  padding: 6rem 2rem 2rem 2rem;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SidebarArea = styled.aside`
  grid-area: sidebar;
  z-index: 50;
  @media (max-width: 900px) {
    display: none;
  }
`;

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Remove scroll event listeners (not needed for grid layout)
    return () => {};
  }, []);

  // Placeholder login function
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // Placeholder logout function
  const handleLogout = () => {
    setIsLoggedIn(false);
    setSidebarOpen(false);
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <Router>
      <GridWrapper>
        <NavBarArea>
          <NavBar onLogout={handleLogout} isLoggedIn={isLoggedIn} />
          {isLoggedIn && !sidebarOpen && (
            <button
              style={{
                position: 'fixed',
                top: '5.5rem',
                right: '2rem',
                zIndex: 300,
                background: '#23272a',
                color: '#00c805',
                border: 'none',
                borderRadius: '8px',
                padding: '0.7rem 1rem',
                fontSize: '1.3rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 8px 0 #0002',
                transition: 'background 0.2s, color 0.2s',
              }}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <FaBars />
            </button>
          )}
        </NavBarArea>
        <MainArea>
          <Routes>
            <Route path="/" element={<Home onLogin={handleLogin} />} />
            <Route path="/dashboard" element={
              isLoggedIn ? <Dashboard /> : <Home onLogin={handleLogin} />
            } />
            <Route path="/learn" element={
              isLoggedIn ? <Learn /> : <Home onLogin={handleLogin} />
            } />
            <Route path="/trade" element={
              isLoggedIn ? <Trade /> : <Home onLogin={handleLogin} />
            } />
            <Route path="/profile" element={
              isLoggedIn ? <Profile /> : <Home onLogin={handleLogin} />
            } />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
          </Routes>
        </MainArea>
        {isLoggedIn && (
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </GridWrapper>
    </Router>
  );
};

export default App; 