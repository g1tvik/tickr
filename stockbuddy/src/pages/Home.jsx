import React from "react";
import Typewriter from "../components/Typewriter";

const Home = () => (
  <div className="container py-5">
    <div className="row justify-content-center">
      <div className="col-12 col-lg-10">
        <h1 className="fw-bold text-center mb-4" style={{
          fontSize: "4rem",
          textShadow: "0 0 12px #fff8dc, 0 0 4px #fff"
        }}>
          <Typewriter
            text="Invest smarter. Learn faster."
            speed={70}
            style={{
              fontWeight: "bold",
              fontSize: "4rem",
              color: "#fff",
              textShadow: "0 0 12px #fff8dc, 0 0 4px #fff",
              fontFamily: "inherit"
            }}
          />
        </h1>
        <p className="lead text-center mb-4 text-light">
          tickr helps beginners master stock trading with interactive lessons, paper trading, and real market insights.
        </p>
        <div className="d-flex justify-content-center gap-3 mb-5">
          <button className="btn btn-light fw-bold px-4 py-2 shadow">Get Started Free</button>
          <button className="btn btn-dark fw-bold px-4 py-2">Learn More</button>
        </div>
      </div>
    </div>
    {/* Add more Bootstrap-based sections as needed */}
  </div>
);

export default Home; 