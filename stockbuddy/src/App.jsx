import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useState } from 'react';
import NavBar from "./components/NavBar";
import Home from "./pages/Home"; // or "./pages/Home.tsx"
import SignIn from "./pages/SignIn";
import SignUp from "./pages/Signup";
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home isLoggedIn={isLoggedIn} />} />
        <Route path="/signin" element={<SignIn setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App; 