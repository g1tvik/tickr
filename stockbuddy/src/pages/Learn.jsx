import React from "react";
import { useNavigate } from "react-router-dom";
import "../globals.css";
import { lessons as initialLessons } from "../lessonRoadmap";

export default function Learn() {
  const [lessons] = React.useState(initialLessons);
  const navigate = useNavigate();

  // Handler for clicking a lesson
  const handleLessonClick = (lesson) => {
    if (lesson.status === "locked") return;
    navigate(`/learn/${lesson.id}`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--marbleWhite)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "2rem 1rem"
    }}>
      <h1 style={{
        fontSize: "2rem",
        fontWeight: 700,
        color: "var(--marbleDarkGray)",
        marginBottom: "1.5rem"
      }}>
        Learning Roadmap
      </h1>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2.5rem"
      }}>
        {lessons.map((lesson, idx) => (
          <div key={lesson.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <button
              onClick={() => handleLessonClick(lesson)}
              disabled={lesson.status === "locked"}
              style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                border: "none",
                background:
                  lesson.status === "completed"
                    ? "var(--marbleGold)"
                    : lesson.status === "current"
                    ? "var(--marbleDarkGray)"
                    : "var(--marbleGray)",
                color:
                  lesson.status === "completed"
                    ? "var(--marbleBlack)"
                    : lesson.status === "current"
                    ? "#fff"
                    : "#bbb",
                fontWeight: 700,
                fontSize: "1.1rem",
                boxShadow: lesson.status === "current"
                  ? "0 0 0 4px var(--marbleGold)"
                  : "0 2px 8px rgba(0,0,0,0.08)",
                cursor: lesson.status === "locked" ? "not-allowed" : "pointer",
                transition: "background 0.2s, color 0.2s"
              }}
            >
              {lesson.status === "completed" ? "✓" : idx + 1}
            </button>
            <div style={{
              marginTop: 8,
              color: lesson.status === "locked"
                ? "var(--marbleGray)"
                : "var(--marbleDarkGray)",
              fontWeight: lesson.status === "current" ? 700 : 500,
              fontSize: "1rem",
              textAlign: "center",
              maxWidth: 120
            }}>
              {lesson.title}
            </div>
            {/* Draw connector line except after last lesson */}
            {idx < lessons.length - 1 && (
              <div style={{
                width: 4,
                height: 40,
                background: "var(--marbleGray)",
                margin: "0 auto"
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 