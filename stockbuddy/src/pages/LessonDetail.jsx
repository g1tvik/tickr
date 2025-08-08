import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonStructure } from '../data/lessonStructure';
import progressManager from '../utils/progressManager';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

export default function LessonDetail() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [lesson, setLesson] = useState(null);
  const [progress, setProgress] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessonAndProgress();
  }, [lessonId]);

  const loadLessonAndProgress = async () => {
    try {
      setLoading(true);
      
      // Find the lesson
      let foundLesson = null;
      for (const unit of lessonStructure.units) {
        const lessonFound = unit.lessons.find(l => l.id === parseInt(lessonId));
        if (lessonFound) {
          foundLesson = lessonFound;
          break;
        }
      }

      if (foundLesson) {
        setLesson(foundLesson);
        
        // Reset to first section when loading a new lesson
        setCurrentSection(0);
        setShowQuiz(false);
        setQuizAnswers({});
        
        // Load progress
        const lessonProgress = await progressManager.getLessonProgress(foundLesson.id);
        setProgress(lessonProgress);
      } else {
        navigate('/learn');
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      navigate('/learn');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to find the next lesson
  const findNextLesson = (currentLessonId) => {
    for (const unit of lessonStructure.units) {
      const lessonIndex = unit.lessons.findIndex(l => l.id === currentLessonId);
      if (lessonIndex !== -1) {
        // Check if there's a next lesson in this unit
        if (lessonIndex < unit.lessons.length - 1) {
          return unit.lessons[lessonIndex + 1];
        }
        // Check if there's a next unit with lessons
        const currentUnitIndex = lessonStructure.units.findIndex(u => u.id === unit.id);
        if (currentUnitIndex < lessonStructure.units.length - 1) {
          const nextUnit = lessonStructure.units[currentUnitIndex + 1];
          if (nextUnit && nextUnit.lessons.length > 0) {
            return nextUnit.lessons[0];
          }
        }
      }
    }
    return null;
  };

  const handleNextSection = () => {
    if (currentSection < lesson.content.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handlePreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleQuizSubmit = async () => {
    const correctAnswers = lesson.quiz.questions.filter((q, index) => 
      quizAnswers[`q${index}`] === q.correct
    ).length;
    
    const score = (correctAnswers / lesson.quiz.questions.length) * 100;
    
    try {
      // Record the attempt and complete the lesson
      await progressManager.recordLessonAttempt(lesson.id);
      const result = await progressManager.completeLesson(lesson.id, score);
      
      // Set completion data for the modal
      setCompletionData({
        score: score.toFixed(1),
        xpEarned: result.xpEarned,
        coinsEarned: result.coinsEarned,
        lessonCompleted: result.lessonCompleted,
        correctAnswers,
        totalQuestions: lesson.quiz.questions.length,
        rewardAlreadyGiven: result.rewardAlreadyGiven,
        totalXpPossible: result.totalXpPossible,
        totalCoinsPossible: result.totalCoinsPossible,
        xpRemaining: result.xpRemaining,
        coinsRemaining: result.coinsRemaining,
        totalXpEarned: result.totalXpEarned,
        totalCoinsEarned: result.totalCoinsEarned
      });
      
      setShowQuiz(false);
      
      // Reload progress
      const lessonProgress = await progressManager.getLessonProgress(lesson.id);
      setProgress(lessonProgress);
      
      setShowCompletionModal(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setShowQuiz(true);
    setShowCompletionModal(false);
  };

  const handleContinueToNext = () => {
    setShowCompletionModal(false); // Close the completion modal
    const nextLesson = findNextLesson(lesson.id);
    if (nextLesson) {
      navigate(`/learn/lesson/${nextLesson.id}`);
    } else {
      navigate('/learn');
    }
  };

  const handleBackToLearn = () => {
    // Force refresh progress when returning to learn page
    navigate('/learn', { state: { refresh: true } });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: marbleWhite,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontBody
      }}>
        <div>Loading lesson...</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: marbleWhite,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontBody
      }}>
        <div>Lesson not found</div>
      </div>
    );
  }

  const currentContent = lesson.content[currentSection];

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: marbleWhite,
      fontFamily: fontBody
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: marbleLightGray,
        padding: "24px",
        borderBottom: `1px solid ${marbleGray}`
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          <button
            onClick={() => navigate('/learn')}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: marbleDarkGray,
              fontSize: "16px",
              cursor: "pointer",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            ← Back to Learn
          </button>
          
          <h1 style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: marbleDarkGray,
            fontFamily: fontHeading,
            marginBottom: "8px"
          }}>
            {lesson.title}
          </h1>
          
          <p style={{
            fontSize: "18px",
            color: marbleGray,
            marginBottom: "16px"
          }}>
            {lesson.description}
          </p>
          
          {/* Progress Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px"
          }}>
            <div style={{
              flex: 1,
              height: "8px",
              backgroundColor: marbleGray,
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${((currentSection + 1) / lesson.content.length) * 100}%`,
                height: "100%",
                backgroundColor: marbleGold,
                transition: "width 0.3s ease"
              }} />
            </div>
            <span style={{
              fontSize: "14px",
              color: marbleGray,
              fontWeight: "500"
            }}>
              {currentSection + 1} of {lesson.content.length}
            </span>
          </div>
          
          {/* Lesson Info */}
          <div style={{
            display: "flex",
            gap: "24px",
            fontSize: "14px",
            color: marbleGray
          }}>
            <span>Duration: {lesson.duration}</span>
            <span>XP: {lesson.xp}</span>
            {progress?.completed && (
              <span style={{ color: marbleGold, fontWeight: "500" }}>
                ✓ Completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "48px 24px"
      }}>
        {!showQuiz ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "32px",
            alignItems: "start"
          }}>
            {/* Main Content */}
            <div>
              {/* Section Content */}
              <div style={{
                backgroundColor: marbleLightGray,
                borderRadius: "20px",
                padding: "32px",
                marginBottom: "32px"
              }}>
                <h2 style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: marbleDarkGray,
                  marginBottom: "24px",
                  fontFamily: fontHeading
                }}>
                  {currentContent.title}
                </h2>
                
                <div style={{
                  fontSize: "18px",
                  lineHeight: "1.6",
                  color: marbleDarkGray
                }}>
                  {currentContent.content}
                </div>
              </div>

              {/* Navigation */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <button
                  onClick={handlePreviousSection}
                  disabled={currentSection === 0}
                  style={{
                    backgroundColor: currentSection === 0 ? marbleGray : marbleDarkGray,
                    color: marbleWhite,
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: currentSection === 0 ? "not-allowed" : "pointer",
                    opacity: currentSection === 0 ? 0.6 : 1
                  }}
                >
                  Previous
                </button>
                
                <div style={{
                  fontSize: "14px",
                  color: marbleGray
                }}>
                  Section {currentSection + 1} of {lesson.content.length}
                </div>
                
                <button
                  onClick={handleNextSection}
                  style={{
                    backgroundColor: marbleGold,
                    color: marbleDarkGray,
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  {currentSection === lesson.content.length - 1 ? "Take Quiz" : "Next"}
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{
              position: "sticky",
              top: "24px"
            }}>
              {/* Progress Card */}
              <div style={{
                backgroundColor: marbleLightGray,
                borderRadius: "20px",
                padding: "24px",
                marginBottom: "24px"
              }}>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: marbleDarkGray,
                  marginBottom: "16px",
                  fontFamily: fontHeading
                }}>
                  Lesson Progress
                </h3>
                
                <div style={{
                  marginBottom: "16px"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px"
                  }}>
                    <span style={{
                      fontSize: "14px",
                      color: marbleGray
                    }}>
                      Progress
                    </span>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: marbleDarkGray
                    }}>
                      {currentSection + 1} of {lesson.content.length}
                    </span>
                  </div>
                  
                  <div style={{
                    height: "8px",
                    backgroundColor: marbleGray,
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${((currentSection + 1) / lesson.content.length) * 100}%`,
                      height: "100%",
                      backgroundColor: marbleGold,
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                </div>
                
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px"
                  }}>
                    <span style={{ color: marbleGray }}>Duration:</span>
                    <span style={{ color: marbleDarkGray, fontWeight: "500" }}>{lesson.duration}</span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px"
                  }}>
                    <span style={{ color: marbleGray }}>XP Reward:</span>
                    <span style={{ color: marbleGold, fontWeight: "500" }}>{lesson.xp} XP</span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px"
                  }}>
                    <span style={{ color: marbleGray }}>Coin Reward:</span>
                    <span style={{ color: marbleGold, fontWeight: "500" }}>{lesson.coins} 🪙</span>
                  </div>
                  {progress?.completed && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px"
                    }}>
                      <span style={{ color: marbleGray }}>Status:</span>
                      <span style={{ color: marbleGold, fontWeight: "500" }}>✓ Completed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Navigation */}
              <div style={{
                backgroundColor: marbleLightGray,
                borderRadius: "20px",
                padding: "24px"
              }}>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: marbleDarkGray,
                  marginBottom: "16px",
                  fontFamily: fontHeading
                }}>
                  Sections
                </h3>
                
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  {lesson.content.map((section, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSection(index)}
                      style={{
                        backgroundColor: index === currentSection ? marbleGold : marbleWhite,
                        color: index === currentSection ? marbleDarkGray : marbleDarkGray,
                        border: "none",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: index === currentSection ? "600" : "500",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "32px",
            alignItems: "start"
          }}>
            {/* Main Quiz Content */}
            <div>
              {/* Quiz */}
              <div style={{
                backgroundColor: marbleLightGray,
                borderRadius: "20px",
                padding: "32px",
                marginBottom: "32px"
              }}>
                <h2 style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: marbleDarkGray,
                  marginBottom: "24px",
                  fontFamily: fontHeading
                }}>
                  Lesson Quiz
                </h2>
                
                <p style={{
                  fontSize: "16px",
                  color: marbleGray,
                  marginBottom: "32px"
                }}>
                  Test your knowledge with this quiz. You have unlimited attempts!
                </p>
                
                {lesson.quiz.questions.map((question, index) => (
                  <div key={index} style={{ marginBottom: "32px" }}>
                    <p style={{
                      fontSize: "18px",
                      color: marbleDarkGray,
                      marginBottom: "16px",
                      fontWeight: "500"
                    }}>
                      {index + 1}. {question.question}
                    </p>
                    
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        style={{
                          display: "block",
                          padding: "16px",
                          marginBottom: "12px",
                          backgroundColor: marbleWhite,
                          borderRadius: "12px",
                          cursor: "pointer",
                          border: quizAnswers[`q${index}`] === optionIndex ? `2px solid ${marbleGold}` : "2px solid transparent",
                          transition: "border-color 0.2s ease"
                        }}
                      >
                        <input
                          type="radio"
                          name={`q${index}`}
                          value={optionIndex}
                          checked={quizAnswers[`q${index}`] === optionIndex}
                          onChange={(e) => setQuizAnswers({...quizAnswers, [`q${index}`]: parseInt(e.target.value)})}
                          style={{ marginRight: "12px" }}
                        />
                        <span style={{
                          fontSize: "16px",
                          color: marbleDarkGray
                        }}>
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                ))}
                
                <div style={{
                  display: "flex",
                  gap: "16px",
                  justifyContent: "center"
                }}>
                  <button
                    onClick={() => setShowQuiz(false)}
                    style={{
                      backgroundColor: marbleGray,
                      color: marbleWhite,
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "12px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Back to Lesson
                  </button>
                  
                  <button
                    onClick={handleQuizSubmit}
                    style={{
                      backgroundColor: marbleGold,
                      color: marbleDarkGray,
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "12px",
                      fontSize: "16px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    Submit Quiz
                  </button>
                </div>
              </div>
              
              {/* Completed Lesson Actions */}
              {progress?.completed && (
                <div style={{
                  backgroundColor: marbleLightGray,
                  borderRadius: "20px",
                  padding: "24px",
                  textAlign: "center"
                }}>
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: marbleDarkGray,
                    marginBottom: "16px"
                  }}>
                    Lesson Completed! 🎉
                  </h3>
                  
                  <div style={{
                    display: "flex",
                    gap: "16px",
                    justifyContent: "center"
                  }}>
                    <button
                      onClick={handleRetakeQuiz}
                      style={{
                        backgroundColor: marbleDarkGray,
                        color: marbleWhite,
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "12px",
                        fontSize: "16px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Retake Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quiz Sidebar */}
            <div style={{
              position: "sticky",
              top: "24px"
            }}>
              {/* Quiz Info Card */}
              <div style={{
                backgroundColor: marbleLightGray,
                borderRadius: "20px",
                padding: "24px",
                marginBottom: "24px"
              }}>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: marbleDarkGray,
                  marginBottom: "16px",
                  fontFamily: fontHeading
                }}>
                  Quiz Information
                </h3>
                
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px"
                  }}>
                    <span style={{ color: marbleGray }}>Questions:</span>
                    <span style={{ color: marbleDarkGray, fontWeight: "500" }}>{lesson.quiz.questions.length}</span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px"
                  }}>
                    <span style={{ color: marbleGray }}>Attempts:</span>
                    <span style={{ color: marbleDarkGray, fontWeight: "500" }}>Unlimited</span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px"
                  }}>
                    <span style={{ color: marbleGray }}>Best Score:</span>
                    <span style={{ color: marbleGold, fontWeight: "500" }}>
                      {progress?.bestScore ? `${progress.bestScore}%` : "Not taken"}
                    </span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px"
                  }}>
                    <span style={{ color: marbleGray }}>Rewards:</span>
                    <span style={{ color: marbleGold, fontWeight: "500" }}>
                      {completionData?.rewardAlreadyGiven ? "Already claimed" : "One-time"}
                    </span>
                  </div>
                  {progress?.completed && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px"
                    }}>
                      <span style={{ color: marbleGray }}>Status:</span>
                      <span style={{ color: marbleGold, fontWeight: "500" }}>✓ Completed</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quiz Progress */}
              <div style={{
                backgroundColor: marbleLightGray,
                borderRadius: "20px",
                padding: "24px"
              }}>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: marbleDarkGray,
                  marginBottom: "16px",
                  fontFamily: fontHeading
                }}>
                  Quiz Progress
                </h3>
                
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  {lesson.quiz.questions.map((question, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        backgroundColor: marbleWhite,
                        borderRadius: "8px",
                        fontSize: "14px"
                      }}
                    >
                      <div style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: quizAnswers[`q${index}`] !== undefined ? marbleGold : marbleGray,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        color: marbleWhite,
                        fontWeight: "bold"
                      }}>
                        {index + 1}
                      </div>
                      <span style={{
                        color: quizAnswers[`q${index}`] !== undefined ? marbleDarkGray : marbleGray,
                        fontWeight: quizAnswers[`q${index}`] !== undefined ? "500" : "400"
                      }}>
                        Question {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Completion Modal */}
      {showCompletionModal && completionData && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: marbleWhite,
            borderRadius: "24px",
            padding: "40px",
            maxWidth: "500px",
            width: "90%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            animation: "slideIn 0.3s ease-out"
          }}>
            {/* Success Icon */}
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: marbleGold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: "40px"
            }}>
              🎉
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: marbleDarkGray,
              marginBottom: "16px",
              fontFamily: fontHeading
            }}>
              {completionData.lessonCompleted ? "Lesson Completed!" : "Quiz Submitted!"}
            </h2>

            {/* Score */}
            <div style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: marbleGold,
              marginBottom: "24px"
            }}>
              {completionData.score}%
            </div>

            {/* Score Details */}
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "24px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px"
              }}>
                <span style={{ color: marbleGray }}>Correct Answers:</span>
                <span style={{ fontWeight: "600", color: marbleDarkGray }}>
                  {completionData.correctAnswers}/{completionData.totalQuestions}
                </span>
              </div>
              
              {/* Show rewards earned this attempt */}
              {completionData.xpEarned > 0 || completionData.coinsEarned > 0 ? (
                <>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px"
                  }}>
                    <span style={{ color: marbleGray }}>XP Earned This Attempt:</span>
                    <span style={{ fontWeight: "600", color: marbleGold }}>
                      +{completionData.xpEarned} XP
                    </span>
                  </div>
                  
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px"
                  }}>
                    <span style={{ color: marbleGray }}>Coins Earned This Attempt:</span>
                    <span style={{ fontWeight: "600", color: marbleGold }}>
                      +{completionData.coinsEarned} 🪙
                    </span>
                  </div>
                </>
              ) : (
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px"
                }}>
                  <span style={{ color: marbleGray }}>Rewards Earned:</span>
                  <span style={{ fontWeight: "600", color: marbleGray }}>
                    No new rewards (already earned maximum)
                  </span>
                </div>
              )}
              
              {/* Show total rewards earned */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                paddingTop: "12px",
                borderTop: `1px solid ${marbleGray}`
              }}>
                <span style={{ color: marbleGray }}>Total XP Earned:</span>
                <span style={{ fontWeight: "600", color: marbleDarkGray }}>
                  {completionData.totalXpEarned}/{completionData.totalXpPossible} XP
                </span>
              </div>
              
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px"
              }}>
                <span style={{ color: marbleGray }}>Total Coins Earned:</span>
                <span style={{ fontWeight: "600", color: marbleDarkGray }}>
                  {completionData.totalCoinsEarned}/{completionData.totalCoinsPossible} 🪙
                </span>
              </div>
              
              {/* Show remaining rewards if any */}
              {(completionData.xpRemaining > 0 || completionData.coinsRemaining > 0) && (
                <>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                    paddingTop: "12px",
                    borderTop: `1px solid ${marbleGray}`
                  }}>
                    <span style={{ color: marbleGray }}>XP Remaining:</span>
                    <span style={{ fontWeight: "600", color: marbleGold }}>
                      {completionData.xpRemaining} XP
                    </span>
                  </div>
                  
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px"
                  }}>
                    <span style={{ color: marbleGray }}>Coins Remaining:</span>
                    <span style={{ fontWeight: "600", color: marbleGold }}>
                      {completionData.coinsRemaining} 🪙
                    </span>
                  </div>
                  
                  <div style={{
                    backgroundColor: marbleGold,
                    color: marbleDarkGray,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    textAlign: "center",
                    marginTop: "8px"
                  }}>
                    💡 Retake the quiz to earn remaining rewards!
                  </div>
                </>
              )}
              
              {/* Show completion message if 100% achieved */}
              {completionData.rewardAlreadyGiven && (
                <div style={{
                  backgroundColor: marbleGold,
                  color: marbleDarkGray,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  textAlign: "center",
                  marginTop: "8px"
                }}>
                  🎉 Perfect score! All rewards earned!
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center"
            }}>
              <button
                onClick={handleRetakeQuiz}
                style={{
                  backgroundColor: (completionData.xpRemaining > 0 || completionData.coinsRemaining > 0) ? marbleGold : marbleGray,
                  color: (completionData.xpRemaining > 0 || completionData.coinsRemaining > 0) ? marbleDarkGray : marbleWhite,
                  border: "none",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  flex: 1
                }}
              >
                {(completionData.xpRemaining > 0 || completionData.coinsRemaining > 0) ? "Retake for More Rewards" : "Retake Quiz"}
              </button>
              
              {findNextLesson(lesson.id) && (
                <button
                  onClick={handleContinueToNext}
                  style={{
                    backgroundColor: marbleDarkGray,
                    color: marbleWhite,
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    flex: 1
                  }}
                >
                  Next Lesson
                </button>
              )}
              
              {completionData.lessonCompleted && findNextLesson(lesson.id) ? (
                <button
                  onClick={handleContinueToNext}
                  style={{
                    backgroundColor: marbleGold,
                    color: marbleDarkGray,
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    flex: 2
                  }}
                >
                  Continue to Next Lesson
                </button>
              ) : (
                <button
                  onClick={handleBackToLearn}
                  style={{
                    backgroundColor: marbleGold,
                    color: marbleDarkGray,
                    border: "none",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    flex: 2
                  }}
                >
                  Back to Learn
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
} 