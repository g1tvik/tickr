import React from "react";
import { useNavigate } from "react-router-dom";

const isLoggedIn = false; // Replace with real auth logic later

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container pt-4 pb-5">
      <div className="d-flex flex-column align-items-center justify-content-center">
        <h1 className="fw-bold text-center mb-3 hero-title">
          Invest smarter. Learn faster.
        </h1>
        <p className="lead text-center mb-4 hero-subtitle">
          tickr helps beginners master stock trading with interactive lessons, paper trading, and real market insights.
        </p>
        <div className="d-flex gap-3">
          <button
            className="btn btn-light fw-bold px-4 py-2 shadow"
            onClick={() => navigate("/signup")}
          >
            Get Started Free
          </button>
          <button
            className="btn btn-dark fw-bold px-4 py-2 border border-light"
            onClick={() => {
              if (!isLoggedIn) {
                navigate("/signin");
              } else {
                // navigate to learn or another page if logged in
              }
            }}
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home; 