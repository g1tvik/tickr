import React from "react";
import { useParams } from "react-router-dom";
import { lessons } from "../lessonRoadmap";

export default function LessonDetail() {
  const { lessonId } = useParams();
  const lesson = lessons.find(l => l.id === Number(lessonId));

  if (!lesson) {
    return <div>Lesson not found.</div>;
  }

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
        {lesson.title}
      </h1>
      <div style={{
        background: "var(--marbleGray)",
        borderRadius: 12,
        padding: "1.5rem 2rem",
        maxWidth: 600,
        color: "var(--marbleDarkGray)",
        marginBottom: "2rem"
      }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 12 }}>Lesson Overview</h2>
        <p>
          This is a placeholder for the lesson content. Here you can add explanations, videos, quizzes, or interactive content for <b>{lesson.title}</b>.
        </p>
        <ul>
          <li>Objective 1: Understand the basics of this topic.</li>
          <li>Objective 2: Learn key terms and concepts.</li>
          <li>Objective 3: Complete a short quiz at the end.</li>
        </ul>
        <div style={{ marginTop: 24 }}>
          <button
            style={{
              background: "var(--marbleGold)",
              color: "var(--marbleBlack)",
              border: "none",
              borderRadius: 8,
              padding: "0.6rem 1.4rem",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer"
            }}
            disabled
          >
            Mark as Complete (coming soon)
          </button>
        </div>
      </div>
    </div>
  );
} 