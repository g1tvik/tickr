import React from "react";
import "../globals.css";
import { useNavigate } from "react-router-dom";
import { lessons } from "../lessonRoadmap";

export default function Dashboard() {
  const navigate = useNavigate();
  // Find the current lesson
  const currentLesson = lessons.find(l => l.status === "current");

  return (
    <div className="dashboard-page-center" style={{
      minHeight: "100vh",
      background: "var(--marbleWhite)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "2rem 1rem"
    }}>
      <h1 style={{
        fontSize: "2.2rem",
        fontWeight: 700,
        color: "var(--marbleDarkGray)",
        marginBottom: "0.5rem"
      }}>
        Welcome back!
      </h1>
      <div style={{
        color: "var(--marbleGray)",
        marginBottom: "2rem",
        fontSize: "1.1rem"
      }}>
        Here’s your latest portfolio snapshot and quick actions.
      </div>

      {/* Portfolio Summary Card */}
      <div style={{
        background: "linear-gradient(135deg, #e6e6e6 0%, #f8f8f8 40%, #d1d1d1 100%)",
        borderRadius: 22,
        boxShadow: "0 2px 12px 2px rgba(120,120,120,0.10)",
        border: "2px solid #b0b0b0",
        padding: "2rem 2.5rem",
        minWidth: 320,
        maxWidth: "90vw",
        marginBottom: "2rem",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "1.1rem", color: "var(--marbleGray)", marginBottom: 8 }}>
          Portfolio Value
        </div>
        <div style={{
          fontSize: "2.1rem",
          fontWeight: 700,
          color: "var(--marbleDarkGray)",
          marginBottom: 6
        }}>
          $12,340.50
        </div>
        <div style={{
          fontSize: "1rem",
          color: "#2e7d32",
          fontWeight: 600
        }}>
          +$120.30 (1.0%) today
        </div>
      </div>

      {/* Only this Recent Activity / Continue Learning Box remains */}
      <div style={{
        width: "100%",
        maxWidth: 500,
        background: "var(--marbleGray)",
        borderRadius: 16,
        padding: "1.2rem 1.5rem",
        color: "var(--marbleDarkGray)",
        fontSize: "1rem",
        minHeight: 80,
        textAlign: "center",
        opacity: 0.85
      }}>
        {currentLesson ? (
          <>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Continue Learning</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>
              {currentLesson.title}
            </div>
            <button
              onClick={() => navigate(`/learn/${currentLesson.id}`)}
              style={{
                background: "var(--marbleDarkGray)",
                color: "#fff",
                borderRadius: 8,
                padding: "0.5rem 1.2rem",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "1rem",
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s"
              }}
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Recent Activity</div>
            <div style={{ color: "var(--marbleDarkGray)" }}>
              No recent activity yet. Start trading or learning!
            </div>
          </>
        )}
      </div>
    </div>
  );
} 