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

const AppWrapper = styled.div`
  background: var(--background, #0a0a0a);
  color: var(--text-main, #f5f6fa);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
`;

const ContentArea = styled.div`
  flex: 1 1 0;
  padding: 8rem 0 0 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
`;

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      console.log('body.scrollTop:', document.body.scrollTop, 'documentElement.scrollTop:', document.documentElement.scrollTop);
    };
    document.body.addEventListener('scroll', handleScroll);
    document.documentElement.addEventListener('scroll', handleScroll);
    return () => {
      document.body.removeEventListener('scroll', handleScroll);
      document.documentElement.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Placeholder login function
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // Placeholder logout function
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <AppWrapper>
        {isLoggedIn && <NavBar onLogout={handleLogout} />}
        <MainContent>
          <ContentArea>
            <Routes>
              <Route path="/" element={
                isLoggedIn ? <Dashboard /> : <Home onLogin={handleLogin} />
              } />
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
          </ContentArea>
          {isLoggedIn && <Sidebar />}
        </MainContent>
      </AppWrapper>
    </Router>
  );
};

export default App; 