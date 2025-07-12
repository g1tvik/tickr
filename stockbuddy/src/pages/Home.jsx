import React from "react";
import { useNavigate } from "react-router-dom";
import Typewriter from "../components/Typewriter";
import StockTicker from "../components/StockTicker";

const isLoggedIn = false; // Replace with real auth logic later

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="container pt-8 pb-5">
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