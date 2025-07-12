import React from "react";
import { useNavigate } from "react-router-dom";
import Typewriter from "../components/Typewriter";
import StockTicker from "../components/StockTicker";

function Home({ isLoggedIn }) {
  const navigate = useNavigate();

  const handleLearnMore = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/signin');
    }
  };

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="container pb-5 pt-cum">
      <div className="d-flex flex-column align-items-center justify-content-center">
        <h1 className="fw-bold text-center mb-3 hero-title">
          <Typewriter 
            text="Invest smarter. Learn faster." 
            speed={100}
            className="fw-bold"
          />
        </h1>
        <StockTicker />
        <div className="d-flex gap-3 mt-4">
          <button className="btn btn-light fw-bold px-4 py-2 shadow" onClick={handleGetStarted}>
            Get Started Free
          </button>
          <button
            className="btn btn-outline-light"
            onClick={handleLearnMore}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home; 