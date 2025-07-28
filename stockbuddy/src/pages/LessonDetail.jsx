import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { lessonContent } from "../data/lessonContent";
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from "../marblePalette";
import { fontHeading, fontBody } from "../fontPalette";

export default function LessonDetail() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const lesson = lessonContent[lessonId];
  
  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);

  useEffect(() => {
    // Reset state when lesson changes
    setCurrentSection(0);
    setShowQuiz(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setLessonCompleted(false);
  }, [lessonId]);

  if (!lesson) {
  return (
    <div style={{
      minHeight: "100vh",
        background: marbleWhite,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
        justifyContent: "center",
      padding: "2rem 1rem"
    }}>
      <h1 style={{
        fontSize: "2rem",
        fontWeight: 700,
          color: marbleDarkGray,
          marginBottom: "1rem"
        }}>
          Lesson not found
        </h1>
        <button
          onClick={() => navigate('/learn')}
          style={{
            background: marbleGold,
            color: marbleDarkGray,
            border: "none",
            borderRadius: 8,
            padding: "0.8rem 1.6rem",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer"
          }}
        >
          Back to Lessons
        </button>
      </div>
    );
  }

  const handleQuizSubmit = () => {
    let correct = 0;
    const total = lesson.quiz.questions.length;
    
    lesson.quiz.questions.forEach((question, index) => {
      if (quizAnswers[index] === question.correct) {
        correct++;
      }
    });
    
    const score = Math.round((correct / total) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    
    // Mark lesson as completed if score is 70% or higher
    if (score >= 70) {
      setLessonCompleted(true);
    }
  };

  const renderContent = (content) => {
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: content }}
        style={{
          lineHeight: 1.6,
          fontSize: '16px'
        }}
      />
    );
  };

  const renderQuiz = () => {
    return (
      <div style={{
        backgroundColor: marbleLightGray,
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '800px',
        width: '100%'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: marbleDarkGray,
          marginBottom: '24px',
          fontFamily: fontHeading
        }}>
          {lesson.quiz.title}
        </h2>
        
        {!quizSubmitted ? (
          <div>
            {lesson.quiz.questions.map((question, index) => (
              <div key={index} style={{
                backgroundColor: marbleWhite,
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: marbleDarkGray,
                  marginBottom: '16px'
                }}>
                  Question {index + 1}: {question.question}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {question.options.map((option, optionIndex) => (
                    <label key={optionIndex} style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      border: `2px solid ${quizAnswers[index] === optionIndex ? marbleGold : '#e0e0e0'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: quizAnswers[index] === optionIndex ? marbleGold : 'transparent',
                      transition: 'all 0.2s'
                    }}>
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={optionIndex}
                        checked={quizAnswers[index] === optionIndex}
                        onChange={(e) => setQuizAnswers({
                          ...quizAnswers,
                          [index]: parseInt(e.target.value)
                        })}
                        style={{ marginRight: '12px' }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            
            <button
              onClick={handleQuizSubmit}
              disabled={Object.keys(quizAnswers).length < lesson.quiz.questions.length}
              style={{
                background: marbleGold,
                color: marbleDarkGray,
                border: "none",
                borderRadius: 12,
                padding: "16px 32px",
                fontWeight: 600,
                fontSize: "16px",
                cursor: "pointer",
                opacity: Object.keys(quizAnswers).length < lesson.quiz.questions.length ? 0.5 : 1
              }}
            >
              Submit Quiz
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              <div style={{
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                {quizScore >= 70 ? '🎉' : '📚'}
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                marginBottom: '8px'
              }}>
                Quiz Complete!
              </h3>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: quizScore >= 70 ? '#22c55e' : '#ef4444'
              }}>
                {quizScore}%
              </div>
              <p style={{
                color: marbleGray,
                marginTop: '8px'
              }}>
                {quizScore >= 70 
                  ? 'Great job! You passed the quiz.' 
                  : 'Keep studying! You need 70% to pass.'}
              </p>
            </div>
            
            {lesson.quiz.questions.map((question, index) => (
              <div key={index} style={{
                backgroundColor: marbleWhite,
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '16px',
                border: `2px solid ${quizAnswers[index] === question.correct ? '#22c55e' : '#ef4444'}`
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: marbleDarkGray,
                  marginBottom: '12px'
                }}>
                  Question {index + 1}: {question.question}
                </h4>
                
                <div style={{
                  padding: '12px',
                  backgroundColor: quizAnswers[index] === question.correct ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    color: quizAnswers[index] === question.correct ? '#22c55e' : '#ef4444',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}>
                    {quizAnswers[index] === question.correct ? '✓ Correct!' : '✗ Incorrect'}
                  </div>
                  <div style={{ color: marbleDarkGray }}>
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                </div>
              </div>
            ))}
            
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              {quizScore >= 70 ? (
                <button
                  onClick={() => {
                    setLessonCompleted(true);
                    setShowQuiz(false);
                  }}
                  style={{
                    background: '#22c55e',
                    color: 'white',
                    border: "none",
                    borderRadius: 12,
                    padding: "16px 32px",
                    fontWeight: 600,
                    fontSize: "16px",
                    cursor: "pointer"
                  }}
                >
                  Complete Lesson
                </button>
              ) : (
                <button
                  onClick={() => {
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                    setQuizScore(0);
                  }}
                  style={{
                    background: marbleGold,
                    color: marbleDarkGray,
                    border: "none",
                    borderRadius: 12,
                    padding: "16px 32px",
                    fontWeight: 600,
                    fontSize: "16px",
                    cursor: "pointer"
                  }}
                >
                  Retake Quiz
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: marbleWhite,
      padding: "24px",
      fontFamily: fontBody
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: "32px"
      }}>
        {/* Sidebar */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px"
        }}>
          {/* Lesson Info */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: "20px",
            padding: "24px"
          }}>
            <h1 style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: marbleDarkGray,
              marginBottom: "12px",
              fontFamily: fontHeading
            }}>
              {lesson.title}
            </h1>
            
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px"
            }}>
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: lesson.status === "completed" ? "#22c55e" : 
                               lesson.status === "current" ? marbleGold : marbleGray
              }} />
              <span style={{
                fontSize: "14px",
                color: marbleGray,
                textTransform: "capitalize"
              }}>
                {lesson.status}
              </span>
            </div>
            
            <div style={{
              fontSize: "14px",
              color: marbleGray,
              marginBottom: "16px"
            }}>
              Duration: {lesson.duration}
            </div>
            
            <div>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: marbleDarkGray,
                marginBottom: "12px"
              }}>
                Learning Objectives:
              </h3>
              <ul style={{
                fontSize: "14px",
                color: marbleGray,
                paddingLeft: "16px"
              }}>
                {lesson.objectives.map((objective, index) => (
                  <li key={index} style={{ marginBottom: "4px" }}>
                    {objective}
                  </li>
                ))}
        </ul>
            </div>
          </div>

          {/* Progress */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: "20px",
            padding: "24px"
          }}>
            <h3 style={{
              fontSize: "18px",
              fontWeight: "600",
              color: marbleDarkGray,
              marginBottom: "16px"
            }}>
              Lesson Progress
            </h3>
            
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {lesson.content.map((section, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSection(index)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: currentSection === index ? marbleGold : marbleWhite,
                    color: currentSection === index ? marbleDarkGray : marbleGray,
                    cursor: "pointer",
                    textAlign: "left",
                    fontWeight: currentSection === index ? "600" : "400"
                  }}
                >
                  {section.title}
                </button>
              ))}
              
              <button
                onClick={() => setShowQuiz(true)}
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: showQuiz ? marbleGold : marbleWhite,
                  color: showQuiz ? marbleDarkGray : marbleGray,
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: showQuiz ? "600" : "400"
                }}
              >
                📝 {lesson.quiz.title}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px"
        }}>
          {showQuiz ? (
            renderQuiz()
          ) : (
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: "20px",
              padding: "32px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px"
              }}>
                <h2 style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: marbleDarkGray,
                  fontFamily: fontHeading
                }}>
                  {lesson.content[currentSection].title}
                </h2>
                
                <div style={{
                  display: "flex",
                  gap: "12px"
                }}>
                  <button
                    onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                    disabled={currentSection === 0}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: currentSection === 0 ? marbleGray : marbleDarkGray,
                      color: "white",
                      cursor: currentSection === 0 ? "not-allowed" : "pointer",
                      opacity: currentSection === 0 ? 0.5 : 1
                    }}
                  >
                    Previous
                  </button>
                  
                  <button
                    onClick={() => setCurrentSection(Math.min(lesson.content.length - 1, currentSection + 1))}
                    disabled={currentSection === lesson.content.length - 1}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: currentSection === lesson.content.length - 1 ? marbleGray : marbleGold,
                      color: currentSection === lesson.content.length - 1 ? "white" : marbleDarkGray,
                      cursor: currentSection === lesson.content.length - 1 ? "not-allowed" : "pointer",
                      opacity: currentSection === lesson.content.length - 1 ? 0.5 : 1
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
              
              <div style={{
                backgroundColor: marbleWhite,
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "24px"
              }}>
                {renderContent(lesson.content[currentSection].content)}
              </div>
              
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{
                  fontSize: "14px",
                  color: marbleGray
                }}>
                  Section {currentSection + 1} of {lesson.content.length}
                </div>
                
                {currentSection === lesson.content.length - 1 && (
          <button
                    onClick={() => setShowQuiz(true)}
            style={{
                      background: marbleGold,
                      color: marbleDarkGray,
              border: "none",
                      borderRadius: 12,
                      padding: "12px 24px",
              fontWeight: 600,
                      fontSize: "16px",
              cursor: "pointer"
            }}
          >
                    Take Quiz
          </button>
                )}
              </div>
            </div>
          )}
          
          {lessonCompleted && (
            <div style={{
              backgroundColor: "#22c55e",
              color: "white",
              padding: "16px 24px",
              borderRadius: "12px",
              textAlign: "center",
              fontWeight: "500"
            }}>
              🎉 Congratulations! You've completed this lesson. You can now move on to the next lesson in your learning path.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 