import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { lessonStructure } from '../data/lessonStructure';
import progressManager from '../utils/progressManager';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

export default function Learn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLessonsModal, setShowLessonsModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showUnitTest, setShowUnitTest] = useState(false);
  const [showFinalTest, setShowFinalTest] = useState(false);
  const [testAnswers, setTestAnswers] = useState({});
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [lessonScores, setLessonScores] = useState({});

  useEffect(() => {
    loadProgress();
  }, []);

  // Refresh progress when returning from lesson completion
  useEffect(() => {
    if (location.state?.refresh) {
      loadProgress();
      // Reload lesson scores if modal is open
      if (showLessonsModal && selectedUnit) {
        setTimeout(() => loadLessonScores(), 100);
      }
      // Clear the refresh state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Refresh progress when modal opens
  useEffect(() => {
    if (showLessonsModal) {
      loadProgress();
      loadLessonScores();
    }
  }, [showLessonsModal]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const overallProgress = await progressManager.getOverallProgress();
      setProgress(overallProgress);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLessonScores = async () => {
    if (!selectedUnit) return;
    
    try {
      const scores = {};
      for (const lesson of selectedUnit.lessons) {
        const lp = await progressManager.getLessonProgress(lesson.id);
        const percentFromRewards = Math.round(lp.rewardProgress || 0);
        const percent = lp.bestScore || percentFromRewards;
        scores[lesson.id] = {
          percent,
          show: lp.completed || (lp.attempts && lp.attempts > 0)
        };
      }
      setLessonScores(scores);
    } catch (error) {
      console.error('Error loading lesson scores:', error);
    }
  };

  // Helper function to determine if a unit is unlocked
  const isUnitUnlocked = (unitId) => {
    if (unitId === 1) return true; // First unit is always unlocked
    
    // Check if previous unit is completed
    const previousUnit = lessonStructure.units.find(u => u.id === unitId - 1);
    if (!previousUnit) return false;
    
    const completedUnitTests = Array.isArray(progress?.completedUnitTests) ? progress.completedUnitTests : [];
    return completedUnitTests.includes(previousUnit.id);
  };

  // Helper function to find the current active unit
  const getCurrentActiveUnit = () => {
    const completedUnitTests = Array.isArray(progress?.completedUnitTests) ? progress.completedUnitTests : [];
    
    for (const unit of lessonStructure.units) {
      if (isUnitUnlocked(unit.id) && !completedUnitTests.includes(unit.id)) {
        return unit;
      }
    }
    return null;
  };

  // Helper function to find the next incomplete lesson in a unit
  const getNextIncompleteLesson = (unitId) => {
    const unit = lessonStructure.units.find(u => u.id === unitId);
    if (!unit) return null;
    
    const completedLessons = Array.isArray(progress?.completedLessons) ? progress.completedLessons : [];
    
    for (const lesson of unit.lessons) {
      if (!completedLessons.includes(lesson.id)) {
        return lesson;
      }
    }
    return null;
  };

  // Helper function to check if all lessons in a unit are completed
  const areAllLessonsCompleted = (unitId) => {
    const unit = lessonStructure.units.find(u => u.id === unitId);
    if (!unit) return false;
    
    const completedLessons = Array.isArray(progress?.completedLessons) ? progress.completedLessons : [];
    
    return unit.lessons.every(lesson => completedLessons.includes(lesson.id));
  };

  const handleUnitClick = (unit) => {
    // Only allow clicking on unlocked units
    if (isUnitUnlocked(unit.id)) {
      setSelectedUnit(unit);
      setShowLessonsModal(true);
      // Refresh progress when opening modal
      loadProgress();
      // Load lesson scores for this unit
      setTimeout(() => loadLessonScores(), 100); // Small delay to ensure selectedUnit is set
    }
  };

  const handleStartUnit = (unit) => {
    const nextLesson = getNextIncompleteLesson(unit.id);
    if (nextLesson) {
      navigate(`/learn/lesson/${nextLesson.id}`);
    }
  };

  const handleContinueLesson = (unit) => {
    const nextLesson = getNextIncompleteLesson(unit.id);
    if (nextLesson) {
      navigate(`/learn/lesson/${nextLesson.id}`);
    }
  };

  const handleLessonClick = (lesson) => {
    navigate(`/learn/lesson/${lesson.id}`);
  };

  const handleUnitTest = (unitId) => {
    setSelectedUnit(lessonStructure.units.find(u => u.id === unitId));
    setShowUnitTest(true);
    setTestAnswers({});
  };

  const handleFinalTest = () => {
    const canTakeResult = progressManager.canTakeFinalTest();
    if (canTakeResult.needsUnlock) {
      setShowUnlockModal(true);
    } else {
      setShowFinalTest(true);
    }
  };

  const handleUnlockFinalTest = async () => {
    try {
      const result = await progressManager.unlockFinalTest();
      if (result.success) {
        alert(result.message);
        await loadProgress();
        setShowUnlockModal(false);
        setShowFinalTest(true);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error unlocking final test:', error);
      alert('Failed to unlock final test. Please try again.');
    }
  };

  const handleTestSubmit = async (testType, unitId = null) => {
    const questions = testType === 'unit' 
      ? selectedUnit.unitTest.questions 
      : lessonStructure.finalTest.questions;
    
    const correctAnswers = questions.filter((q, index) => 
      testAnswers[`q${index}`] === q.correct
    ).length;
    
    const score = (correctAnswers / questions.length) * 100;
    
    try {
      let result;
      if (testType === 'unit') {
        result = await progressManager.takeUnitTest(unitId, score);
      } else {
        result = await progressManager.takeFinalTest(score);
      }
      
      if (result.success) {
        alert(`${testType === 'unit' ? 'Unit' : 'Final'} test completed! Score: ${score.toFixed(1)}%\nXP Earned: ${result.xpEarned}\nCoins Earned: ${result.coinsEarned}`);
        
        // Reload progress
        await loadProgress();
        
        // Close modals
        setShowUnitTest(false);
        setShowFinalTest(false);
        setSelectedUnit(null);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Test submission error:', error);
      alert('Failed to submit test. Please try again.');
    }
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
        <div>Loading learning content...</div>
      </div>
    );
  }

  const currentActiveUnit = getCurrentActiveUnit();

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
            onClick={() => navigate('/dashboard')}
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
            ← Back to Dashboard
          </button>
          
          <h1 style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: marbleDarkGray,
            fontFamily: fontHeading,
            marginBottom: "8px"
          }}>
            Learning Path
          </h1>
          
          <p style={{
            fontSize: "18px",
            color: marbleGray,
            marginBottom: "16px"
          }}>
            Master the fundamentals of trading through interactive lessons and quizzes
          </p>
          
          {/* Progress Overview */}
          {progress && (
            <div style={{
              display: "flex",
              gap: "24px",
              fontSize: "14px",
              color: marbleGray
            }}>
              <span>Lessons: {progress.completedLessons}/{progress.totalLessons}</span>
              <span>Units: {progress.completedUnitTests}/{progress.totalUnits}</span>
              <span>XP: {progress.xp}</span>
              <span>Coins: {progress.coins}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "48px 24px"
      }}>
        {/* Units Grid */}
        <div style={{
          display: "grid",
          gap: "24px",
          marginBottom: "48px"
        }}>
          {lessonStructure.units.map((unit) => {
            const completedLessons = Array.isArray(progress?.completedLessons) ? progress.completedLessons : [];
            const completedUnitTests = Array.isArray(progress?.completedUnitTests) ? progress.completedUnitTests : [];
            
            const unitProgress = completedLessons.filter(lessonId => 
              unit.lessons.some(lesson => lesson.id === lessonId)
            ).length || 0;
            const unitCompleted = completedUnitTests.includes(unit.id);
            const isUnlocked = isUnitUnlocked(unit.id);
            const isActive = currentActiveUnit?.id === unit.id;
            const hasStartedUnit = unit.lessons.some(lesson =>
              completedLessons.includes(lesson.id) ||
              (progress?.lessonAttempts && progress.lessonAttempts[lesson.id]?.attempts > 0)
            );

            return (
              <div
                key={unit.id}
                style={{
                  backgroundColor: marbleLightGray,
                  borderRadius: "20px",
                  padding: "24px",
                  cursor: isUnlocked ? "pointer" : "not-allowed",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  opacity: isUnlocked ? 1 : 0.5,
                  filter: isUnlocked ? "none" : "grayscale(100%)",
                  position: "relative"
                }}
                onClick={() => isUnlocked && handleUnitClick(unit)}
                onMouseEnter={(e) => {
                  if (isUnlocked) {
                    e.target.style.transform = "translateY(-4px)";
                    e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isUnlocked) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }
                }}
              >
                {/* View Lessons Button */}
                {isUnlocked && (
                  <div style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    backgroundColor: marbleDarkGray,
                    color: marbleWhite,
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontSize: "10px",
                    fontWeight: "500",
                    opacity: 0.8
                  }}>
                    Click to view lessons
                  </div>
                )}

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "16px"
                }}>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: unitCompleted ? marbleGold :
                                   isActive ? marbleDarkGray : marbleGray,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    marginRight: "16px"
                  }}>
                    {unitCompleted ? "✓" : unit.id}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: marbleDarkGray,
                      marginBottom: "4px"
                    }}>
                      {unit.title}
                    </div>
                    <div style={{
                      fontSize: "14px",
                      color: marbleGray
                    }}>
                      {unit.lessons.length} lessons • {unit.unitTest.xp} XP test
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: unitCompleted ? marbleGold :
                                   isActive ? marbleDarkGray : marbleGray,
                    color: unitCompleted ? marbleDarkGray : marbleWhite,
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "500"
                  }}>
                    {unitCompleted ? "Completed" :
                     isActive ? "Active" :
                     isUnlocked ? "Unlocked" : "Locked"}
                  </div>
                </div>

                <p style={{
                  fontSize: "16px",
                  color: marbleGray,
                  marginBottom: "16px",
                  lineHeight: "1.5"
                }}>
                  {unit.description}
                </p>

                {/* Action Button */}
                {isUnlocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasStartedUnit) {
                        handleContinueLesson(unit);
                      } else {
                        handleStartUnit(unit);
                      }
                    }}
                    style={{
                      backgroundColor: marbleGold,
                      color: marbleDarkGray,
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      width: "100%"
                    }}
                  >
                    {hasStartedUnit ? "Continue Lesson" : "Start Unit"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Final Test Section */}
        {progress?.unitProgress === 100 && (
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: "20px",
            padding: "32px",
            textAlign: "center",
            marginBottom: "48px"
          }}>
            <h2 style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: marbleDarkGray,
              marginBottom: "16px"
            }}>
              Final Test
            </h2>
            <p style={{
              fontSize: "16px",
              color: marbleGray,
              marginBottom: "24px"
            }}>
              {progress.finalTestUnlocked 
                ? "Complete all units to unlock the final test. You can take it once per day."
                : "Complete all units to unlock the final test. You can spend coins to unlock it."
              }
            </p>
            <button
              onClick={handleFinalTest}
              disabled={!progressManager.canTakeFinalTest().canTake && !progressManager.canTakeFinalTest().needsUnlock}
              style={{
                backgroundColor: (progressManager.canTakeFinalTest().canTake || progressManager.canTakeFinalTest().needsUnlock) ? marbleGold : marbleGray,
                color: (progressManager.canTakeFinalTest().canTake || progressManager.canTakeFinalTest().needsUnlock) ? marbleDarkGray : marbleWhite,
                border: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: (progressManager.canTakeFinalTest().canTake || progressManager.canTakeFinalTest().needsUnlock) ? "pointer" : "not-allowed"
              }}
            >
              {progressManager.canTakeFinalTest().canTake
                ? "Take Final Test"
                : progressManager.canTakeFinalTest().needsUnlock
                ? `Unlock Final Test (${progressManager.canTakeFinalTest().unlockCost} coins)`
                : progressManager.canTakeFinalTest().message
              }
            </button>
          </div>
        )}
      </div>

      {/* Lessons Modal */}
      {showLessonsModal && selectedUnit && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: marbleWhite,
            borderRadius: "20px",
            padding: "32px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px"
            }}>
              <h3 style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: marbleDarkGray
              }}>
                {selectedUnit.title} - Lessons
              </h3>
              <button
                onClick={() => setShowLessonsModal(false)}
                style={{
                  backgroundColor: marbleGray,
                  color: marbleWhite,
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {selectedUnit.lessons.map((lesson) => {
                const completedLessons = Array.isArray(progress?.completedLessons) ? progress.completedLessons : [];
                const lessonProgress = completedLessons.includes(lesson.id);
                // Check if previous lesson in the same unit is completed
                const lessonIndex = selectedUnit.lessons.findIndex(l => l.id === lesson.id);
                const isLocked = lessonIndex > 0 && !completedLessons.includes(selectedUnit.lessons[lessonIndex - 1].id);

                // Get score/percentage from stored lesson scores
                const lessonScore = lessonScores[lesson.id];
                const showPercent = lessonScore?.show && (lessonScore?.percent ?? 0) >= 0;
                const percent = lessonScore?.percent || 0;

                return (
                  <div
                    key={lesson.id}
                    style={{
                      backgroundColor: marbleLightGray,
                      borderRadius: "12px",
                      padding: "16px",
                      cursor: isLocked ? "not-allowed" : "pointer",
                      opacity: isLocked ? 0.6 : 1,
                      border: lessonProgress ? `2px solid ${marbleGold}` : "none",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => !isLocked && handleLessonClick(lesson)}
                    onMouseEnter={(e) => {
                      if (!isLocked) {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLocked) {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}>
                      <div>
                        <div style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: marbleDarkGray,
                          marginBottom: "4px"
                        }}>
                          {lesson.title}
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: marbleGray
                        }}>
                          {lesson.duration} • {lesson.xp} XP • {lesson.coins} 🪙
                          {showPercent && (
                            <span style={{ color: marbleGold, fontWeight: "500" }}>
                              {" "}• {percent.toFixed(0)}% correct
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: lessonProgress ? marbleGold :
                                       isLocked ? marbleGray : marbleDarkGray,
                        color: lessonProgress ? marbleDarkGray : marbleWhite,
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "500"
                      }}>
                        {lessonProgress ? "Completed" :
                         isLocked ? "Locked" : "Start"}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Unit Test - Locked until all lessons completed */}
              {(() => {
                const allLessonsCompleted = areAllLessonsCompleted(selectedUnit.id);
                const canTakeUnitTest = progressManager.canTakeUnitTest(selectedUnit.id);

                return (
                  <div
                    style={{
                      backgroundColor: allLessonsCompleted ? marbleLightGray : marbleGray,
                      borderRadius: "12px",
                      padding: "16px",
                      cursor: allLessonsCompleted && canTakeUnitTest.canTake ? "pointer" : "not-allowed",
                      opacity: allLessonsCompleted ? 1 : 0.6,
                      border: allLessonsCompleted ? "2px solid #ffd700" : "none",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => allLessonsCompleted && canTakeUnitTest.canTake && handleUnitTest(selectedUnit.id)}
                    onMouseEnter={(e) => {
                      if (allLessonsCompleted && canTakeUnitTest.canTake) {
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (allLessonsCompleted && canTakeUnitTest.canTake) {
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "none";
                      }
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}>
                      <div>
                        <div style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: marbleDarkGray,
                          marginBottom: "4px"
                        }}>
                          Unit Test
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: marbleGray
                        }}>
                          {selectedUnit.unitTest.questions.length} questions • {selectedUnit.unitTest.xp} XP • {selectedUnit.unitTest.coins} coins
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: allLessonsCompleted && canTakeUnitTest.canTake ? "#ffd700" : marbleGray,
                        color: allLessonsCompleted && canTakeUnitTest.canTake ? marbleDarkGray : marbleWhite,
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "500"
                      }}>
                        {allLessonsCompleted ?
                         (canTakeUnitTest.canTake ?
                           `${canTakeUnitTest.dailyAttemptsLeft} daily, ${canTakeUnitTest.totalAttemptsLeft} total` :
                           canTakeUnitTest.message) :
                         "Locked"}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Unit Test Modal */}
      {showUnitTest && selectedUnit && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: marbleWhite,
            borderRadius: "20px",
            padding: "32px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px"
            }}>
              <h3 style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: marbleDarkGray
              }}>
                {selectedUnit.title} - Unit Test
              </h3>
              <button
                onClick={() => setShowUnitTest(false)}
                style={{
                  backgroundColor: marbleGray,
                  color: marbleWhite,
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            {selectedUnit.unitTest.questions.map((question, index) => (
              <div key={index} style={{ marginBottom: "24px" }}>
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
                      backgroundColor: marbleLightGray,
                      borderRadius: "12px",
                      cursor: "pointer",
                      border: testAnswers[`q${index}`] === optionIndex ? `2px solid ${marbleGold}` : "2px solid transparent",
                      transition: "border-color 0.2s ease"
                    }}
                  >
                    <input
                      type="radio"
                      name={`q${index}`}
                      value={optionIndex}
                      checked={testAnswers[`q${index}`] === optionIndex}
                      onChange={(e) => setTestAnswers({...testAnswers, [`q${index}`]: parseInt(e.target.value)})}
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
                onClick={() => setShowUnitTest(false)}
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
                Cancel
              </button>
              <button
                onClick={() => handleTestSubmit('unit', selectedUnit.id)}
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
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Test Modal */}
      {showFinalTest && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: marbleWhite,
            borderRadius: "20px",
            padding: "32px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px"
            }}>
              <h3 style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: marbleDarkGray
              }}>
                Final Test
              </h3>
              <button
                onClick={() => setShowFinalTest(false)}
                style={{
                  backgroundColor: marbleGray,
                  color: marbleWhite,
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            {lessonStructure.finalTest.questions.map((question, index) => (
              <div key={index} style={{ marginBottom: "24px" }}>
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
                      backgroundColor: marbleLightGray,
                      borderRadius: "12px",
                      cursor: "pointer",
                      border: testAnswers[`q${index}`] === optionIndex ? `2px solid ${marbleGold}` : "2px solid transparent",
                      transition: "border-color 0.2s ease"
                    }}
                  >
                    <input
                      type="radio"
                      name={`q${index}`}
                      value={optionIndex}
                      checked={testAnswers[`q${index}`] === optionIndex}
                      onChange={(e) => setTestAnswers({...testAnswers, [`q${index}`]: parseInt(e.target.value)})}
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
                onClick={() => setShowFinalTest(false)}
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
                Cancel
              </button>
              <button
                onClick={() => handleTestSubmit('final')}
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
                Submit Final Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Test Unlock Modal */}
      {showUnlockModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: marbleWhite,
            borderRadius: "20px",
            padding: "32px",
            maxWidth: "500px",
            width: "90%",
            textAlign: "center"
          }}>
            <h3 style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: marbleDarkGray,
              marginBottom: "16px"
            }}>
              Unlock Final Test
            </h3>
            
            <p style={{
              fontSize: "16px",
              color: marbleGray,
              marginBottom: "24px"
            }}>
              Spend {lessonStructure.finalTest.unlockCost} coins to unlock the final test. 
              This is a one-time purchase.
            </p>
            
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "24px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px"
              }}>
                <span style={{ color: marbleGray }}>Your Coins:</span>
                <span style={{ color: marbleDarkGray, fontWeight: "600" }}>{progress?.coins || 0}</span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ color: marbleGray }}>Unlock Cost:</span>
                <span style={{ color: marbleGold, fontWeight: "600" }}>{lessonStructure.finalTest.unlockCost} coins</span>
              </div>
            </div>
            
            <div style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center"
            }}>
              <button
                onClick={() => setShowUnlockModal(false)}
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
                Cancel
              </button>
              <button
                onClick={handleUnlockFinalTest}
                disabled={(progress?.coins || 0) < lessonStructure.finalTest.unlockCost}
                style={{
                  backgroundColor: (progress?.coins || 0) >= lessonStructure.finalTest.unlockCost ? marbleGold : marbleGray,
                  color: (progress?.coins || 0) >= lessonStructure.finalTest.unlockCost ? marbleDarkGray : marbleWhite,
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: (progress?.coins || 0) >= lessonStructure.finalTest.unlockCost ? "pointer" : "not-allowed"
                }}
              >
                Unlock Final Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 