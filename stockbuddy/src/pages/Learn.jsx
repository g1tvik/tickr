import React from "react";

const lessons = [
  {
    title: "What is a stock?",
    description: "Learn the basics of what a stock is and why companies issue them.",
    button: "Complete Lesson",
  },
  {
    title: "How to read a stock chart",
    description: "Understand candlesticks, volume, and price movement.",
    button: "Start Lesson",
  },
  // ...add more lessons as needed
];

const Learn = () => (
  <div className="container py-5">
    <h1 className="mb-4 fw-bold text-center">Learn</h1>
    <div className="row">
      <div className="col-12 col-lg-8 mx-auto d-flex flex-column gap-2 px-3 py-2">
        {lessons.map((lesson, idx) => (
          <div className="card shadow-sm bg-dark text-light" key={idx}>
            <div className="card-body px-2 py-3">
              <h5 className="card-title fw-bold mb-2">{lesson.title}</h5>
              <p className="card-text mb-3">{lesson.description}</p>
              <button className="btn btn-light fw-bold">{lesson.button}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Learn; 