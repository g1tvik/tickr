import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { lessonStructure } from '../data/lessonStructure';
import progressManager from '../utils/progressManager';
import { marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import { useSEO, SEO_CONFIG } from '../lib/seo';

// ─── Marble dark theme tokens ───────────────────────────────────────────────
const BG        = '#2C2C2C'; // page background
const SURFACE   = '#343434'; // cards / modals / elevated banners
const INSET     = '#2f2f2f'; // nested / inset surface
const BORDER    = 'rgba(182, 156, 96, 0.22)';
const DIVIDER   = 'rgba(244, 241, 233, 0.12)';
const SHADOW    = '0 8px 24px rgba(0,0,0,0.28)';
// Remapped (formerly light) palette tokens → dark theme
const white          = '#F4F1E9'; // cream — light text on dark/gold
const lightGray      = '#2f2f2f'; // inset / nested surface (was light)
const gray           = '#b8b4a8'; // muted text / lines
const marbleDarkGray = '#F4F1E9'; // primary text (cream)

export default function Learn() {
  useSEO(SEO_CONFIG.learn);
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
      if (import.meta.env.DEV) console.error('Error loading progress:', error);
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
      if (import.meta.env.DEV) console.error('Error loading lesson scores:', error);
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

  // Jump straight to the next incomplete lesson in a unit (Start / Continue CTA)
  const handleStartUnit = (unit) => {
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
      if (import.meta.env.DEV) console.error('Error unlocking final test:', error);
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
      if (import.meta.env.DEV) console.error('Test submission error:', error);
      alert('Failed to submit test. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontBody,
        color: gray,
        fontSize: "14px",
        letterSpacing: "0.04em",
      }}>
        loading…
      </div>
    );
  }

  const currentActiveUnit = getCurrentActiveUnit();

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: BG,
      fontFamily: fontBody
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: SURFACE,
        borderBottom: `1px solid ${BORDER}`,
        padding: "28px 24px",
        boxShadow: SHADOW,
      }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: gray,
              fontSize: "12px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0",
              fontWeight: "600",
            }}
          >
            ← Dashboard
          </button>

          <h1 style={{
            fontSize: "26px",
            fontWeight: "400",
            color: marbleDarkGray,
            fontFamily: fontHeading,
            marginBottom: "6px",
            letterSpacing: "-0.01em",
          }}>
            learning path
          </h1>

          <p style={{
            fontSize: "14px",
            color: gray,
            marginBottom: progress ? "20px" : "0",
            lineHeight: "1.5",
          }}>
            interactive lessons, quizzes, and real paper trades
          </p>

          {/* Progress pills */}
          {progress && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { label: `${progress.completedLessons} / ${progress.totalLessons} lessons` },
                { label: `${progress.completedUnitTests} / ${progress.totalUnits} units` },
                { label: `${progress.xp} XP`, gold: true },
                { label: `${progress.coins} coins` },
              ].map((p, i) => (
                <span key={i} style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  background: p.gold ? "rgba(230,200,122,0.15)" : "rgba(244,241,233,0.06)",
                  color: p.gold ? "#E6C87A" : gray,
                  border: p.gold ? "1px solid rgba(230,200,122,0.3)" : "1px solid rgba(244,241,233,0.12)",
                }}>
                  {p.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Roadmap Content */}
      <div style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "40px 24px",
        position: "relative"
      }}>
        {/* Roadmap Path */}
        {lessonStructure.units.map((unit) => {
            const completedLessons = Array.isArray(progress?.completedLessons) ? progress.completedLessons : [];
            const completedUnitTests = Array.isArray(progress?.completedUnitTests) ? progress.completedUnitTests : [];
            const unitCompleted = completedUnitTests.includes(unit.id);
            const isUnlocked = isUnitUnlocked(unit.id);

            return (
            <div key={unit.id} style={{ marginBottom: "32px" }}>
              {/* Unit Header Banner */}
              <div
                onClick={() => isUnlocked && handleUnitClick(unit)}
                style={{
                  backgroundColor: unitCompleted ? marbleGold : isUnlocked ? SURFACE : INSET,
                  borderRadius: "16px",
                  padding: "16px 20px",
                  marginBottom: "24px",
                  cursor: isUnlocked ? "pointer" : "not-allowed",
                  opacity: isUnlocked ? 1 : 0.5,
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: unitCompleted ? "#2C2C2C" : "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: white
                }}>
                  {unitCompleted ? "✓" : unit.id}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: unitCompleted ? marbleDarkGray : white,
                    fontFamily: fontHeading
                  }}>
                    Unit {unit.id}: {unit.title}
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: unitCompleted ? marbleDarkGray : "rgba(255,255,255,0.7)",
                    marginTop: "2px"
                  }}>
                    {unit.lessons.length} lessons • {unit.unitTest.xp} XP
                  </div>
                </div>
                {isUnlocked && !unitCompleted && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStartUnit(unit); }}
                    style={{
                      backgroundColor: marbleGold,
                      color: marbleDarkGray,
                      border: "none",
                      borderRadius: "10px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontWeight: 700,
                      fontFamily: fontHeading,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: currentActiveUnit?.id === unit.id ? "0 0 0 2px rgba(182,156,96,0.4)" : "none"
                    }}
                  >
                    {getNextIncompleteLesson(unit.id) && unit.lessons.some(l => (progress?.completedLessons || []).includes(l.id)) ? "Continue" : "Start"}
                  </button>
                )}
                {isUnlocked && unitCompleted && (
                  <div style={{
                    fontSize: "20px",
                    color: marbleDarkGray,
                    opacity: 0.6
                  }}>
                    ✓
                  </div>
                )}
              </div>

              {/* Lessons Roadmap */}
                <div style={{
                  display: "flex",
                flexDirection: "column",
                  alignItems: "center",
                position: "relative"
              }}>
                {unit.lessons.map((lesson, lessonIndex) => {
                  const lessonCompleted = completedLessons.includes(lesson.id);
                  const prevLessonIndex = lessonIndex - 1;
                  const isLocked = !isUnlocked || (lessonIndex > 0 && !completedLessons.includes(unit.lessons[prevLessonIndex].id));
                  const isNext = isUnlocked && !lessonCompleted && !isLocked;
                  
                  // Zigzag offset: alternate left and right
                  const offset = lessonIndex % 2 === 0 ? -40 : 40;
                  
                  return (
                    <div key={lesson.id} style={{ position: "relative", width: "100%" }}>
                      {/* Connector line to next node */}
                      {lessonIndex < unit.lessons.length - 1 && (
                        <svg
                          style={{
                            position: "absolute",
                            top: "64px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "120px",
                    height: "60px",
                            zIndex: 0,
                            overflow: "visible"
                          }}
                        >
                          <path
                            d={`M ${60 + offset} 0 Q ${60} 30 ${60 + (lessonIndex % 2 === 0 ? 80 : -80)} 60`}
                            stroke={completedLessons.includes(unit.lessons[lessonIndex + 1]?.id) || (lessonCompleted && !completedLessons.includes(unit.lessons[lessonIndex + 1]?.id) && isUnlocked) ? marbleGold : gray}
                            strokeWidth="4"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={isLocked || !lessonCompleted ? "8 8" : "none"}
                            opacity={isUnlocked ? 0.6 : 0.3}
                          />
                        </svg>
                      )}
                      
                      {/* Lesson Node */}
                      <div
                        onClick={() => !isLocked && handleLessonClick(lesson)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          position: "relative",
                          zIndex: 1,
                          transform: `translateX(${offset}px)`,
                          marginBottom: "40px",
                          cursor: isLocked ? "not-allowed" : "pointer"
                        }}
                      >
                        {/* Node circle */}
                        <div style={{
                          width: "64px",
                          height: "64px",
                    borderRadius: "50%",
                          backgroundColor: lessonCompleted ? marbleGold :
                                          isNext ? SURFACE :
                                          isLocked ? lightGray : SURFACE,
                          border: isNext ? `4px solid ${marbleGold}` : lessonCompleted ? "4px solid rgba(0,0,0,0.1)" : `4px solid ${gray}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                          color: lessonCompleted ? marbleDarkGray : 
                                isLocked ? gray : white,
                          fontWeight: "bold",
                          boxShadow: isNext ? `0 0 20px ${marbleGold}60` : "0 4px 12px rgba(0,0,0,0.15)",
                          transition: "all 0.3s ease",
                          opacity: isLocked && !isUnlocked ? 0.4 : 1,
                          animation: isNext ? "pulse 2s infinite" : "none"
                        }}>
                          {lessonCompleted ? "✓" : isLocked ? "🔒" : lessonIndex + 1}
                  </div>
                        
                        {/* Lesson title */}
                    <div style={{
                          marginTop: "8px",
                          textAlign: "center",
                          maxWidth: "140px"
                        }}>
                    <div style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: isLocked ? gray : marbleDarkGray,
                            lineHeight: "1.3"
                          }}>
                            {lesson.title}
                  </div>
                  <div style={{
                            fontSize: "11px",
                            color: gray,
                            marginTop: "2px"
                          }}>
                            {lesson.xp} XP • {lesson.coins} 🪙
                  </div>
                </div>
                      </div>
                    </div>
                  );
                })}

                {/* Unit Test Node */}
                {(() => {
                  const allLessonsCompleted = areAllLessonsCompleted(unit.id);
                  const canTakeUnitTest = progressManager.canTakeUnitTest(unit.id);
                  const lastLessonOffset = (unit.lessons.length - 1) % 2 === 0 ? -40 : 40;
                  const testOffset = unit.lessons.length % 2 === 0 ? -40 : 40;

                  return (
                    <div style={{ position: "relative", width: "100%" }}>
                      {/* Connector to unit test */}
                      <svg
                        style={{
                          position: "absolute",
                          top: "-36px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "120px",
                          height: "60px",
                          zIndex: 0,
                          overflow: "visible"
                        }}
                      >
                        <path
                          d={`M ${60 + lastLessonOffset} 0 Q ${60} 30 ${60 + testOffset} 60`}
                          stroke={unitCompleted ? marbleGold : gray}
                          strokeWidth="4"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={!allLessonsCompleted ? "8 8" : "none"}
                          opacity={isUnlocked ? 0.6 : 0.3}
                        />
                      </svg>

                      <div
                        onClick={() => allLessonsCompleted && canTakeUnitTest.canTake && handleUnitTest(unit.id)}
                    style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          position: "relative",
                          zIndex: 1,
                          transform: `translateX(${testOffset}px)`,
                          marginBottom: "24px",
                          cursor: allLessonsCompleted && canTakeUnitTest.canTake ? "pointer" : "not-allowed"
                        }}
                      >
                        <div style={{
                          width: "72px",
                          height: "72px",
                          borderRadius: "50%",
                          background: unitCompleted ? `linear-gradient(135deg, ${marbleGold} 0%, #f4d03f 100%)` :
                                      allLessonsCompleted ? `linear-gradient(135deg, #343434 0%, #444 100%)` :
                                      lightGray,
                          border: unitCompleted ? "4px solid rgba(0,0,0,0.1)" :
                                  allLessonsCompleted && canTakeUnitTest.canTake ? `4px solid ${marbleGold}` :
                                  `4px solid ${gray}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "28px",
                          color: unitCompleted ? marbleDarkGray : 
                                 allLessonsCompleted ? white : gray,
                          boxShadow: allLessonsCompleted && canTakeUnitTest.canTake && !unitCompleted ? 
                                     `0 0 24px ${marbleGold}50` : "0 4px 16px rgba(0,0,0,0.2)",
                          transition: "all 0.3s ease",
                          opacity: !allLessonsCompleted ? 0.5 : 1
                        }}>
                          {unitCompleted ? "🏆" : allLessonsCompleted ? "📝" : "🔒"}
                        </div>
                        <div style={{
                          marginTop: "8px",
                          textAlign: "center"
                        }}>
                          <div style={{
                            fontSize: "14px",
                            fontWeight: "700",
                            color: allLessonsCompleted ? marbleDarkGray : gray
                          }}>
                            Unit Test
                          </div>
                          <div style={{
                            fontSize: "11px",
                            color: gray,
                            marginTop: "2px"
                          }}>
                            {unit.unitTest.xp} XP • {unit.unitTest.coins} 🪙
                          </div>
                        </div>
                      </div>
              </div>
            );
                })()}
        </div>
            </div>
          );
        })}

        {/* Final Test Section */}
        {progress?.unitProgress === 100 && (
          <div style={{
            backgroundColor: `linear-gradient(135deg, #2C2C2C 0%, #333 100%)`,
            background: `linear-gradient(135deg, #2C2C2C 0%, #333 100%)`,
            borderRadius: "20px",
            padding: "32px",
            textAlign: "center",
            marginTop: "24px",
            border: `3px solid ${marbleGold}`
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${marbleGold} 0%, #f4d03f 100%)`,
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              boxShadow: `0 0 30px ${marbleGold}50`
            }}>
              👑
            </div>
            <h2 style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: white,
              marginBottom: "8px",
              fontFamily: fontHeading
            }}>
              Final Test
            </h2>
            <p style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "20px"
            }}>
              {progress.finalTestUnlocked 
                ? "Prove your mastery! Take it once per day."
                : "Complete all units to unlock."
              }
            </p>
            <button
              onClick={handleFinalTest}
              disabled={!progressManager.canTakeFinalTest().canTake && !progressManager.canTakeFinalTest().needsUnlock}
              style={{
                backgroundColor: (progressManager.canTakeFinalTest().canTake || progressManager.canTakeFinalTest().needsUnlock) ? marbleGold : "rgba(244,241,233,0.10)",
                color: (progressManager.canTakeFinalTest().canTake || progressManager.canTakeFinalTest().needsUnlock) ? marbleDarkGray : white,
                border: "none",
                padding: "14px 28px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: (progressManager.canTakeFinalTest().canTake || progressManager.canTakeFinalTest().needsUnlock) ? "pointer" : "not-allowed"
              }}
            >
              {progressManager.canTakeFinalTest().canTake
                ? "Take Final Test"
                : progressManager.canTakeFinalTest().needsUnlock
                ? `Unlock (${progressManager.canTakeFinalTest().unlockCost} 🪙)`
                : progressManager.canTakeFinalTest().message
              }
            </button>
          </div>
        )}
      </div>

      {/* CSS Keyframes for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 20px ${marbleGold}60; }
          50% { box-shadow: 0 0 30px ${marbleGold}90, 0 0 40px ${marbleGold}40; }
          100% { box-shadow: 0 0 20px ${marbleGold}60; }
        }
      `}</style>

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
            backgroundColor: SURFACE,
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
                  backgroundColor: "rgba(244,241,233,0.10)",
                  color: white,
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
                      backgroundColor: lightGray,
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
                          color: gray
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
                                       isLocked ? "rgba(244,241,233,0.10)" : "#F4F1E9",
                        color: lessonProgress ? "#2C2C2C" : isLocked ? white : "#2C2C2C",
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
                      backgroundColor: allLessonsCompleted ? lightGray : INSET,
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
                          color: gray
                        }}>
                          {selectedUnit.unitTest.questions.length} questions • {selectedUnit.unitTest.xp} XP • {selectedUnit.unitTest.coins} coins
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: allLessonsCompleted && canTakeUnitTest.canTake ? "#ffd700" : "rgba(244,241,233,0.10)",
                        color: allLessonsCompleted && canTakeUnitTest.canTake ? "#2C2C2C" : white,
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
            backgroundColor: SURFACE,
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
                  backgroundColor: "rgba(244,241,233,0.10)",
                  color: white,
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
                      backgroundColor: lightGray,
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
                  backgroundColor: "rgba(244,241,233,0.10)",
                  color: white,
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
            backgroundColor: SURFACE,
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
                  backgroundColor: "rgba(244,241,233,0.10)",
                  color: white,
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
                      backgroundColor: lightGray,
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
                  backgroundColor: "rgba(244,241,233,0.10)",
                  color: white,
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
            backgroundColor: SURFACE,
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
              color: gray,
              marginBottom: "24px"
            }}>
              Spend {lessonStructure.finalTest.unlockCost} coins to unlock the final test. 
              This is a one-time purchase.
            </p>
            
            <div style={{
              backgroundColor: lightGray,
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
                <span style={{ color: gray }}>Your Coins:</span>
                <span style={{ color: marbleDarkGray, fontWeight: "600" }}>{progress?.coins || 0}</span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={{ color: gray }}>Unlock Cost:</span>
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
                  backgroundColor: "rgba(244,241,233,0.10)",
                  color: white,
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
                  backgroundColor: (progress?.coins || 0) >= lessonStructure.finalTest.unlockCost ? marbleGold : "rgba(244,241,233,0.10)",
                  color: (progress?.coins || 0) >= lessonStructure.finalTest.unlockCost ? marbleDarkGray : white,
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