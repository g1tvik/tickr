import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { lessonStructure } from '../data/lessonStructure';
import progressManager from '../utils/progressManager';
import { useSEO, SEO_CONFIG } from '../lib/seo';
import tk, { label, mono, panel, inset, heading, btnPrimary, btnGhost, tag } from '../theme/terminal';
import Icon from '../components/Icon';

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
        backgroundColor: tk.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: tk.fontBody,
        ...label,
        color: tk.muted,
      }}>
        loading
      </div>
    );
  }

  const currentActiveUnit = getCurrentActiveUnit();

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: tk.bg,
      fontFamily: tk.fontBody
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: tk.surface,
        borderBottom: `1px solid ${tk.hair}`,
        padding: "28px 24px",
      }}>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              backgroundColor: "transparent",
              border: "none",
              ...label,
              color: tk.muted,
              cursor: "pointer",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0",
            }}
          >
            <Icon name="arrow-left" size={14} /> Dashboard
          </button>

          <h1 style={{
            ...heading,
            fontSize: "26px",
            marginBottom: "6px",
          }}>
            Learning path
          </h1>

          <p style={{
            fontSize: "14px",
            color: tk.muted,
            marginBottom: progress ? "20px" : "0",
            lineHeight: "1.5",
          }}>
            Interactive lessons, quizzes, and real paper trades
          </p>

          {/* Progress pills */}
          {progress && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { value: `${progress.completedLessons} / ${progress.totalLessons}`, suffix: "lessons" },
                { value: `${progress.completedUnitTests} / ${progress.totalUnits}`, suffix: "units" },
                { value: `${progress.xp}`, suffix: "XP", gold: true },
                { value: `${progress.coins}`, suffix: "coins", icon: "coin" },
              ].map((p, i) => (
                <span key={i} style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 11px",
                  borderRadius: `${tk.rSm}px`,
                  background: tk.inset,
                  border: `1px solid ${p.gold ? tk.goldHair : tk.hair}`,
                }}>
                  {p.icon && <Icon name={p.icon} size={12} color={tk.gold} />}
                  <span style={{ ...mono, fontSize: "12px", fontWeight: 600, color: p.gold ? tk.goldBright : tk.text }}>{p.value}</span>
                  <span style={{ ...label, fontSize: "9.5px", color: tk.muted }}>{p.suffix}</span>
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
            <div key={unit.id} style={{ marginBottom: "40px" }}>
              {/* Unit section header */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px" }}>
                <span style={{ ...label, color: unitCompleted ? tk.gold : tk.muted }}>unit {unit.id}</span>
                <span style={{ flex: 1, height: 1, background: tk.hair }} />
                {currentActiveUnit?.id === unit.id && <span style={tag}>current</span>}
                {unitCompleted && <Icon name="check" size={14} color={tk.gold} />}
                {!isUnlocked && <Icon name="lock" size={13} color={tk.faint} />}
              </div>

              {/* Unit banner */}
              <div
                onClick={() => isUnlocked && handleUnitClick(unit)}
                style={{
                  ...panel,
                  borderColor: unitCompleted ? tk.goldHair : tk.hair,
                  padding: "15px 18px",
                  marginBottom: "18px",
                  cursor: isUnlocked ? "pointer" : "not-allowed",
                  opacity: isUnlocked ? 1 : 0.5,
                  transition: "border-color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px"
                }}
              >
                <div style={{
                  width: "38px",
                  height: "38px",
                  flexShrink: 0,
                  borderRadius: `${tk.rSm}px`,
                  background: unitCompleted ? tk.gold : tk.raised,
                  border: `1px solid ${unitCompleted ? tk.gold : tk.hair}`,
                  display: "grid",
                  placeItems: "center",
                  color: unitCompleted ? tk.bg : tk.text,
                }}>
                  {unitCompleted ? <Icon name="check" size={18} /> : <span style={{ ...mono, fontSize: "15px", fontWeight: 600 }}>{unit.id}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...heading, fontSize: "16px" }}>
                    {unit.title}
                  </div>
                  <div style={{
                    ...mono,
                    fontSize: "11px",
                    color: tk.muted,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "3px"
                  }}>
                    {unit.lessons.length} lessons <span style={{ color: tk.faint }}>·</span> {unit.unitTest.xp} XP
                  </div>
                </div>
                {isUnlocked && !unitCompleted && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStartUnit(unit); }}
                    style={{ ...btnPrimary, whiteSpace: "nowrap" }}
                  >
                    {getNextIncompleteLesson(unit.id) && unit.lessons.some(l => (progress?.completedLessons || []).includes(l.id)) ? "Continue" : "Start"}
                  </button>
                )}
              </div>

              {/* Lessons */}
                <div>
                {unit.lessons.map((lesson, lessonIndex) => {
                  const lessonCompleted = completedLessons.includes(lesson.id);
                  const prevLessonIndex = lessonIndex - 1;
                  const isLocked = !isUnlocked || (lessonIndex > 0 && !completedLessons.includes(unit.lessons[prevLessonIndex].id));
                  const isNext = isUnlocked && !lessonCompleted && !isLocked;

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => !isLocked && handleLessonClick(lesson)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "12px 0",
                        borderBottom: `1px solid ${tk.hair}`,
                        cursor: isLocked ? "not-allowed" : "pointer",
                        opacity: isLocked && !isUnlocked ? 0.45 : 1,
                      }}
                    >
                      {/* Status marker */}
                      <div style={{
                        width: "30px",
                        height: "30px",
                        flexShrink: 0,
                        borderRadius: `${tk.rSm}px`,
                        background: lessonCompleted ? tk.gold : tk.raised,
                        border: `1px solid ${isNext ? tk.gold : tk.hair}`,
                        display: "grid",
                        placeItems: "center",
                        color: lessonCompleted ? tk.bg : isLocked ? tk.faint : tk.text,
                      }}>
                        {lessonCompleted ? <Icon name="check" size={15} />
                          : isLocked ? <Icon name="lock" size={13} />
                          : <span style={{ ...mono, fontSize: "13px", fontWeight: 600 }}>{lessonIndex + 1}</span>}
                      </div>

                      {/* Lesson title + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: isLocked ? tk.muted : tk.text, lineHeight: 1.3 }}>
                          {lesson.title}
                        </div>
                        <div style={{ ...mono, fontSize: "11px", color: tk.muted, display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
                          {lesson.xp} XP <span style={{ color: tk.faint }}>·</span>
                          <Icon name="coin" size={11} color={tk.gold} /> {lesson.coins}
                        </div>
                      </div>

                      {lessonCompleted ? (
                        <span style={{ ...tag, color: tk.up, borderColor: "rgba(79,180,119,0.4)" }}>done</span>
                      ) : isNext ? (
                        <span style={tag}>next</span>
                      ) : (
                        <Icon name="lock" size={13} color={tk.faint} />
                      )}
                    </div>
                  );
                })}

                {/* Unit Test */}
                {(() => {
                  const allLessonsCompleted = areAllLessonsCompleted(unit.id);
                  const canTakeUnitTest = progressManager.canTakeUnitTest(unit.id);

                  return (
                    <div
                      onClick={() => allLessonsCompleted && canTakeUnitTest.canTake && handleUnitTest(unit.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "12px 0",
                        cursor: allLessonsCompleted && canTakeUnitTest.canTake ? "pointer" : "not-allowed",
                        opacity: allLessonsCompleted ? 1 : 0.5,
                      }}
                    >
                      <div style={{
                        width: "30px",
                        height: "30px",
                        flexShrink: 0,
                        borderRadius: `${tk.rSm}px`,
                        background: unitCompleted ? tk.gold : tk.raised,
                        border: `1px solid ${unitCompleted || (allLessonsCompleted && canTakeUnitTest.canTake) ? tk.gold : tk.hair}`,
                        display: "grid",
                        placeItems: "center",
                        color: unitCompleted ? tk.bg : allLessonsCompleted ? tk.gold : tk.faint,
                      }}>
                        {unitCompleted ? <Icon name="trophy" size={16} />
                          : allLessonsCompleted ? <Icon name="edit" size={15} />
                          : <Icon name="lock" size={13} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: allLessonsCompleted ? tk.text : tk.muted, lineHeight: 1.3 }}>
                          Unit test
                        </div>
                        <div style={{ ...mono, fontSize: "11px", color: tk.muted, display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
                          {unit.unitTest.xp} XP <span style={{ color: tk.faint }}>·</span>
                          <Icon name="coin" size={11} color={tk.gold} /> {unit.unitTest.coins}
                        </div>
                      </div>
                      {unitCompleted ? (
                        <span style={{ ...tag, color: tk.up, borderColor: "rgba(79,180,119,0.4)" }}>passed</span>
                      ) : allLessonsCompleted ? (
                        <span style={tag}>take</span>
                      ) : (
                        <Icon name="lock" size={13} color={tk.faint} />
                      )}
                    </div>
                  );
                })()}
        </div>
            </div>
          );
        })}

        {/* Final Test Section */}
        {progress?.unitProgress === 100 && (() => {
          const ft = progressManager.canTakeFinalTest();
          return (
          <div style={{
            ...panel,
            borderColor: tk.goldHair,
            padding: "28px 24px",
            textAlign: "center",
            marginTop: "32px",
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: `${tk.rSm}px`,
              border: `1px solid ${tk.goldHair}`,
              margin: "0 auto 16px",
              display: "grid",
              placeItems: "center",
              color: tk.gold,
            }}>
              <Icon name="trophy" size={22} />
            </div>
            <h2 style={{
              ...heading,
              fontSize: "20px",
              marginBottom: "8px",
            }}>
              Final test
            </h2>
            <p style={{
              fontSize: "13px",
              color: tk.muted,
              marginBottom: "20px",
              lineHeight: 1.5,
            }}>
              {progress.finalTestUnlocked
                ? "Prove your mastery. Take it once per day."
                : "Complete all units to unlock."
              }
            </p>
            <button
              onClick={handleFinalTest}
              disabled={!ft.canTake && !ft.needsUnlock}
              style={{
                ...((ft.canTake || ft.needsUnlock) ? btnPrimary : btnGhost),
                padding: "11px 22px",
                fontSize: "14px",
                cursor: (ft.canTake || ft.needsUnlock) ? "pointer" : "not-allowed",
                opacity: (ft.canTake || ft.needsUnlock) ? 1 : 0.5,
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              {ft.canTake
                ? "Take final test"
                : ft.needsUnlock
                ? <>Unlock <Icon name="coin" size={14} /> <span style={mono}>{ft.unlockCost}</span></>
                : ft.message
              }
            </button>
          </div>
          );
        })()}
      </div>

      {/* Lessons Modal */}
      {showLessonsModal && selectedUnit && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            ...panel,
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            padding: "28px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "8px"
            }}>
              <div>
                <div style={{ ...label, marginBottom: "6px" }}>lessons</div>
                <h3 style={{ ...heading, fontSize: "20px" }}>
                  {selectedUnit.title}
                </h3>
              </div>
              <button
                onClick={() => setShowLessonsModal(false)}
                style={{
                  ...btnGhost,
                  padding: "8px",
                  lineHeight: 0,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <div style={{ height: 1, background: tk.hair, margin: "16px 0 20px" }} />

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px"
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
                      ...inset,
                      borderColor: lessonProgress ? tk.goldHair : tk.hair,
                      padding: "14px 16px",
                      cursor: isLocked ? "not-allowed" : "pointer",
                      opacity: isLocked ? 0.6 : 1,
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => !isLocked && handleLessonClick(lesson)}
                    onMouseEnter={(e) => {
                      if (!isLocked) {
                        e.currentTarget.style.borderColor = tk.goldHair;
                        e.currentTarget.style.background = tk.raised;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLocked) {
                        e.currentTarget.style.borderColor = lessonProgress ? tk.goldHair : tk.hair;
                        e.currentTarget.style.background = tk.inset;
                      }
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px"
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: tk.text,
                          marginBottom: "4px"
                        }}>
                          {lesson.title}
                        </div>
                        <div style={{
                          ...mono,
                          fontSize: "11px",
                          color: tk.muted,
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "5px"
                        }}>
                          {lesson.duration} <span style={{ color: tk.faint }}>·</span> {lesson.xp} XP <span style={{ color: tk.faint }}>·</span>
                          <Icon name="coin" size={11} color={tk.gold} /> {lesson.coins}
                          {showPercent && (
                            <>
                              <span style={{ color: tk.faint }}>·</span>
                              <span style={{ color: tk.gold }}>{percent.toFixed(0)}% correct</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span style={{
                        ...tag,
                        ...(lessonProgress
                          ? { color: tk.up, borderColor: "rgba(79,180,119,0.4)" }
                          : isLocked
                          ? { color: tk.faint, borderColor: tk.hair }
                          : {}),
                        whiteSpace: "nowrap",
                      }}>
                        {lessonProgress ? "Completed" :
                         isLocked ? "Locked" : "Start"}
                      </span>
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
                      ...inset,
                      borderColor: allLessonsCompleted ? tk.goldHair : tk.hair,
                      padding: "14px 16px",
                      cursor: allLessonsCompleted && canTakeUnitTest.canTake ? "pointer" : "not-allowed",
                      opacity: allLessonsCompleted ? 1 : 0.6,
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => allLessonsCompleted && canTakeUnitTest.canTake && handleUnitTest(selectedUnit.id)}
                    onMouseEnter={(e) => {
                      if (allLessonsCompleted && canTakeUnitTest.canTake) {
                        e.currentTarget.style.borderColor = tk.goldHair;
                        e.currentTarget.style.background = tk.raised;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (allLessonsCompleted && canTakeUnitTest.canTake) {
                        e.currentTarget.style.borderColor = tk.hair;
                        e.currentTarget.style.background = tk.inset;
                      }
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px"
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: allLessonsCompleted ? tk.text : tk.muted,
                          marginBottom: "4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "7px"
                        }}>
                          <Icon name={allLessonsCompleted ? "edit" : "lock"} size={14} color={allLessonsCompleted ? tk.gold : tk.faint} />
                          Unit test
                        </div>
                        <div style={{
                          ...mono,
                          fontSize: "11px",
                          color: tk.muted,
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "5px"
                        }}>
                          {selectedUnit.unitTest.questions.length} questions <span style={{ color: tk.faint }}>·</span> {selectedUnit.unitTest.xp} XP <span style={{ color: tk.faint }}>·</span>
                          <Icon name="coin" size={11} color={tk.gold} /> {selectedUnit.unitTest.coins}
                        </div>
                      </div>
                      {allLessonsCompleted ? (
                        canTakeUnitTest.canTake ? (
                          <span style={{ ...mono, fontSize: "11px", color: tk.muted, whiteSpace: "nowrap" }}>
                            {canTakeUnitTest.dailyAttemptsLeft} daily · {canTakeUnitTest.totalAttemptsLeft} total
                          </span>
                        ) : (
                          <span style={{ ...tag, whiteSpace: "nowrap" }}>{canTakeUnitTest.message}</span>
                        )
                      ) : (
                        <span style={{ ...tag, color: tk.faint, borderColor: tk.hair }}>Locked</span>
                      )}
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
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            ...panel,
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            padding: "28px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "8px"
            }}>
              <div>
                <div style={{ ...label, marginBottom: "6px" }}>unit test</div>
                <h3 style={{ ...heading, fontSize: "20px" }}>
                  {selectedUnit.title}
                </h3>
              </div>
              <button
                onClick={() => setShowUnitTest(false)}
                style={{
                  ...btnGhost,
                  padding: "8px",
                  lineHeight: 0,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <div style={{ height: 1, background: tk.hair, margin: "16px 0 20px" }} />

            {selectedUnit.unitTest.questions.map((question, index) => (
              <div key={index} style={{ marginBottom: "24px" }}>
                <p style={{
                  fontSize: "15px",
                  color: tk.text,
                  marginBottom: "14px",
                  fontWeight: 600,
                  lineHeight: 1.45
                }}>
                  <span style={{ ...mono, color: tk.gold, marginRight: "8px" }}>{index + 1}.</span>{question.question}
                </p>

                {question.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    style={{
                      ...inset,
                      display: "flex",
                      alignItems: "center",
                      padding: "13px 14px",
                      marginBottom: "10px",
                      cursor: "pointer",
                      borderColor: testAnswers[`q${index}`] === optionIndex ? tk.gold : tk.hair,
                      transition: "border-color 0.2s ease"
                    }}
                  >
                    <input
                      type="radio"
                      name={`q${index}`}
                      value={optionIndex}
                      checked={testAnswers[`q${index}`] === optionIndex}
                      onChange={(e) => setTestAnswers({...testAnswers, [`q${index}`]: parseInt(e.target.value)})}
                      style={{ marginRight: "12px", accentColor: tk.gold }}
                    />
                    <span style={{
                      fontSize: "14px",
                      color: tk.text
                    }}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            ))}

            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "8px"
            }}>
              <button
                onClick={() => setShowUnitTest(false)}
                style={{ ...btnGhost, padding: "11px 20px", fontSize: "14px" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleTestSubmit('unit', selectedUnit.id)}
                style={{ ...btnPrimary, padding: "11px 20px", fontSize: "14px" }}
              >
                Submit test
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
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            ...panel,
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            padding: "28px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "8px"
            }}>
              <div>
                <div style={{ ...label, marginBottom: "6px" }}>assessment</div>
                <h3 style={{ ...heading, fontSize: "20px" }}>
                  Final test
                </h3>
              </div>
              <button
                onClick={() => setShowFinalTest(false)}
                style={{
                  ...btnGhost,
                  padding: "8px",
                  lineHeight: 0,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            <div style={{ height: 1, background: tk.hair, margin: "16px 0 20px" }} />

            {lessonStructure.finalTest.questions.map((question, index) => (
              <div key={index} style={{ marginBottom: "24px" }}>
                <p style={{
                  fontSize: "15px",
                  color: tk.text,
                  marginBottom: "14px",
                  fontWeight: 600,
                  lineHeight: 1.45
                }}>
                  <span style={{ ...mono, color: tk.gold, marginRight: "8px" }}>{index + 1}.</span>{question.question}
                </p>

                {question.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    style={{
                      ...inset,
                      display: "flex",
                      alignItems: "center",
                      padding: "13px 14px",
                      marginBottom: "10px",
                      cursor: "pointer",
                      borderColor: testAnswers[`q${index}`] === optionIndex ? tk.gold : tk.hair,
                      transition: "border-color 0.2s ease"
                    }}
                  >
                    <input
                      type="radio"
                      name={`q${index}`}
                      value={optionIndex}
                      checked={testAnswers[`q${index}`] === optionIndex}
                      onChange={(e) => setTestAnswers({...testAnswers, [`q${index}`]: parseInt(e.target.value)})}
                      style={{ marginRight: "12px", accentColor: tk.gold }}
                    />
                    <span style={{
                      fontSize: "14px",
                      color: tk.text
                    }}>
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            ))}

            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "8px"
            }}>
              <button
                onClick={() => setShowFinalTest(false)}
                style={{ ...btnGhost, padding: "11px 20px", fontSize: "14px" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleTestSubmit('final')}
                style={{ ...btnPrimary, padding: "11px 20px", fontSize: "14px" }}
              >
                Submit final test
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
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            ...panel,
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            padding: "28px",
            maxWidth: "440px",
            width: "90%",
            textAlign: "center"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: `${tk.rSm}px`,
              border: `1px solid ${tk.goldHair}`,
              margin: "0 auto 16px",
              display: "grid",
              placeItems: "center",
              color: tk.gold,
            }}>
              <Icon name="lock" size={20} />
            </div>
            <h3 style={{
              ...heading,
              fontSize: "20px",
              marginBottom: "10px"
            }}>
              Unlock final test
            </h3>

            <p style={{
              fontSize: "13px",
              color: tk.muted,
              marginBottom: "22px",
              lineHeight: 1.55
            }}>
              Spend <span style={{ ...mono, color: tk.text }}>{lessonStructure.finalTest.unlockCost}</span> coins to unlock the final test. This is a one-time purchase.
            </p>

            <div style={{
              ...inset,
              padding: "14px 16px",
              marginBottom: "22px",
              textAlign: "left"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px"
              }}>
                <span style={label}>your coins</span>
                <span style={{ ...mono, fontSize: "13px", fontWeight: 600, color: tk.text, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <Icon name="coin" size={12} color={tk.gold} />{progress?.coins || 0}
                </span>
              </div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span style={label}>unlock cost</span>
                <span style={{ ...mono, fontSize: "13px", fontWeight: 600, color: tk.gold, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <Icon name="coin" size={12} color={tk.gold} />{lessonStructure.finalTest.unlockCost}
                </span>
              </div>
            </div>

            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={() => setShowUnlockModal(false)}
                style={{ ...btnGhost, padding: "11px 20px", fontSize: "14px" }}
              >
                Cancel
              </button>
              <button
                onClick={handleUnlockFinalTest}
                disabled={(progress?.coins || 0) < lessonStructure.finalTest.unlockCost}
                style={{
                  ...((progress?.coins || 0) >= lessonStructure.finalTest.unlockCost ? btnPrimary : btnGhost),
                  padding: "11px 20px",
                  fontSize: "14px",
                  opacity: (progress?.coins || 0) >= lessonStructure.finalTest.unlockCost ? 1 : 0.5,
                  cursor: (progress?.coins || 0) >= lessonStructure.finalTest.unlockCost ? "pointer" : "not-allowed"
                }}
              >
                Unlock final test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 