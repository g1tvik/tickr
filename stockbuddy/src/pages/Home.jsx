import React from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="container pt-7 pb-5">
      <div className="d-flex flex-column align-items-center justify-content-center">
        <h1 className="fw-bold text-center mb-3 hero-title">
          Invest smarter. Learn faster.
        </h1>
        <p className="lead text-center mb-4 hero-subtitle">
          tickr helps beginners master stock trading with interactive lessons, paper trading, and real market insights.
        </p>
        <div className="d-flex gap-3">
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