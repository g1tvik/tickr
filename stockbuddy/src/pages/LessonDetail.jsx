import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonStructure } from '../data/lessonStructure';
import progressManager from '../utils/progressManager';
import { api } from '../services/api';
import { fontBody } from '../fontPalette';
import { useSEO } from '../lib/seo';
import tk, { label, mono, panel, inset, heading, btnPrimary, btnGhost, tag } from '../theme/terminal';
import Icon from '../components/Icon';
import { useToast } from '../context/ToastContext';

export default function LessonDetail() {
  const { toast } = useToast();
  // Terminal Editorial palette (charcoal ramp + brand gold).
  const pageBg = tk.bg;
  const cardBg = tk.raised;
  const cardBg2 = tk.surface;
  const cardText = tk.text;
  const cardMuted = tk.muted;
  const divider = tk.hair;
  const track = tk.inset;
  const ink = '#1F1F1F'; // dark ink on gold fills

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
  const [skipTokens, setSkipTokens] = useState(0);
  const [skipping, setSkipping] = useState(false);

  // Set the page title/meta to the current lesson once it loads
  useSEO({
    title: lesson?.title ? `${lesson.title} — Learn` : 'Lesson — Learn',
    description: lesson?.description ||
      'Interactive lessons to master stock trading and investing fundamentals.',
  });

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

        // Skip tokens (shop utility): offered for incomplete lessons below.
        try {
          const userData = await api.getUserData();
          setSkipTokens(userData?.skipTokens || 0);
        } catch {
          setSkipTokens(0);
        }
      } else {
        navigate('/learn');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading lesson:', error);
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
      // Complete the lesson — rewards are computed/persisted server-side, with
      // any active boosters applied there (boostsApplied reports them).
      const result = await progressManager.completeLesson(lesson.id, score);

      if (Array.isArray(result.boostsApplied) && result.boostsApplied.length > 0) {
        const labels = result.boostsApplied.map((b) =>
          `${b.multiplier}x ${b.type === 'xp_multiplier' ? 'XP' : 'coin'} booster applied`
        );
        toast(labels.join('\n'), { title: 'Booster active' });
      }

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
      if (import.meta.env.DEV) console.error('Error submitting quiz:', error);
      toast('Failed to submit quiz. Please try again.', { variant: 'error' });
    }
  };

  // Spend a shop skip token: the server consumes the token and marks the
  // lesson complete with zero rewards (progression only, no currency).
  const handleSkipLesson = async () => {
    try {
      setSkipping(true);
      const result = await progressManager.skipLesson(lesson.id);
      if (result.success) {
        setSkipTokens(result.skipTokens);
        toast(`Lesson skipped — ${result.skipTokens} skip ${result.skipTokens === 1 ? 'token' : 'tokens'} left`);
        navigate('/learn', { state: { refresh: true } });
      } else {
        toast(result.message || 'Could not skip this lesson.', { variant: 'error' });
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error skipping lesson:', error);
      toast('Could not skip this lesson. Please try again.', { variant: 'error' });
    } finally {
      setSkipping(false);
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

  const handleBackToLesson = () => {
    setShowCompletionModal(false);
    // Force refresh progress when returning to learn page
    navigate('/learn', { state: { refresh: true } });
  };

  if (loading) {
    return (
      <div className="page-dark" style={{
        minHeight: "100vh",
        backgroundColor: pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontBody
      }}>
        <div style={{ ...label, color: cardMuted }}>Loading lesson…</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="page-dark" style={{
        minHeight: "100vh",
        backgroundColor: pageBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontBody
      }}>
        <div style={{ ...heading, fontSize: 18, color: cardText }}>Lesson not found</div>
      </div>
    );
  }

  const currentContent = lesson.content[currentSection];
  // Derived quiz stats for sidebar display
  const totalQuestions = lesson?.quiz?.questions?.length || 0;
  const xpBasedPercent = progress && progress.totalXpPossible > 0
    ? Math.round((progress.xpEarned / progress.totalXpPossible) * 100)
    : 0;
  const bestScorePercent = progress?.bestScore && progress.bestScore > 0
    ? Math.round(progress.bestScore)
    : xpBasedPercent;
  const hasQuizData = (bestScorePercent > 0) || (progress?.attempts ?? 0) > 0 || !!progress?.completed;
  const bestCorrectCount = Math.round((bestScorePercent / 100) * totalQuestions);
  const bestIncorrectCount = Math.max(0, totalQuestions - bestCorrectCount);

  return (
    <div className="page-dark" style={{
      minHeight: "100vh",
      backgroundColor: pageBg,
      fontFamily: fontBody
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: cardBg2,
        padding: "24px",
        borderBottom: `1px solid ${divider}`
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "18px",
            flexWrap: "wrap"
          }}>
            <button
              onClick={() => navigate('/learn')}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: cardMuted,
                fontFamily: fontBody,
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "7px"
              }}
            >
              <Icon name="arrow-left" size={14} /> Back to Learn
            </button>

            {/* Skip with a shop token — only offered while the lesson is incomplete. */}
            {skipTokens > 0 && progress && !progress.completed && (
              <button
                onClick={handleSkipLesson}
                disabled={skipping}
                style={{
                  ...btnGhost,
                  padding: "8px 14px",
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  cursor: skipping ? "not-allowed" : "pointer",
                  opacity: skipping ? 0.6 : 1
                }}
              >
                <Icon name="skip-forward" size={13} />
                {skipping ? 'Skipping...' : `Skip with token (${skipTokens})`}
              </button>
            )}
          </div>

          <h1 style={{
            ...heading,
            fontSize: "30px",
            color: cardText,
            marginBottom: "8px"
          }}>
            {lesson.title}
          </h1>

          <p style={{
            fontSize: "16px",
            lineHeight: 1.55,
            color: cardMuted,
            marginBottom: "20px",
            maxWidth: "720px"
          }}>
            {lesson.description}
          </p>

          {/* Progress Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "18px"
          }}>
            <div style={{
              flex: 1,
              height: "6px",
              backgroundColor: track,
              borderRadius: `${tk.rXs}px`,
              border: `1px solid ${divider}`,
              overflow: "hidden"
            }}>
              <div style={{
                width: `${((currentSection + 1) / lesson.content.length) * 100}%`,
                height: "100%",
                backgroundColor: tk.gold,
                transition: "width 0.3s ease"
              }} />
            </div>
            <span style={{
              ...mono,
              fontSize: "12px",
              color: cardMuted
            }}>
              {currentSection + 1} / {lesson.content.length}
            </span>
          </div>

          {/* Lesson Info */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
            flexWrap: "wrap"
          }}>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: "8px" }}>
              <span style={label}>duration</span>
              <span style={{ ...mono, fontSize: "13px", color: cardText }}>{lesson.duration}</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: "8px" }}>
              <span style={label}>xp</span>
              <span style={{ ...mono, fontSize: "13px", color: tk.gold }}>{lesson.xp}</span>
            </span>
            {progress?.completed && (
              <span style={{ ...tag, color: tk.up, borderColor: 'rgba(79,180,119,.4)', display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <Icon name="check" size={11} /> completed
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
          <div className="lesson-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "32px",
            alignItems: "start"
          }}>
            {/* Main Content */}
            <div>
              {/* Section Content */}
              <div style={{
                ...panel,
                padding: "28px",
                marginBottom: "24px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <span style={label}>section</span>
                  <span style={{ flex: 1, height: 1, background: divider }} />
                  <span style={{ ...mono, fontSize: 11, color: cardMuted }}>
                    {currentSection + 1} / {lesson.content.length}
                  </span>
                </div>

                <h2 style={{
                  ...heading,
                  fontSize: "22px",
                  color: cardText,
                  marginBottom: "16px"
                }}>
                  {currentContent.title}
                </h2>

                <div style={{
                  fontSize: "16px",
                  lineHeight: "1.7",
                  color: cardText
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
                    ...btnGhost,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: currentSection === 0 ? "not-allowed" : "pointer",
                    opacity: currentSection === 0 ? 0.45 : 1
                  }}
                >
                  <Icon name="arrow-left" size={14} /> Previous
                </button>

                <div style={{
                  ...mono,
                  fontSize: "12px",
                  color: cardMuted
                }}>
                  {currentSection + 1} / {lesson.content.length}
                </div>

                <button
                  onClick={handleNextSection}
                  style={{
                    ...btnPrimary,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  {currentSection === lesson.content.length - 1 ? "Take Quiz" : "Next"}
                  <Icon name="arrow-right" size={14} />
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lesson-sidebar" style={{
              position: "sticky",
              top: "24px"
            }}>
              {/* Progress Card */}
              <div style={{
                ...panel,
                padding: "22px",
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <span style={label}>progress</span>
                  <span style={{ flex: 1, height: 1, background: divider }} />
                </div>

                <div style={{
                  marginBottom: "18px"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px"
                  }}>
                    <span style={{
                      fontSize: "13px",
                      color: cardMuted
                    }}>
                      Sections
                    </span>
                    <span style={{
                      ...mono,
                      fontSize: "13px",
                      color: cardText
                    }}>
                      {currentSection + 1} / {lesson.content.length}
                    </span>
                  </div>

                  <div style={{
                    height: "6px",
                    backgroundColor: track,
                    borderRadius: `${tk.rXs}px`,
                    border: `1px solid ${divider}`,
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${((currentSection + 1) / lesson.content.length) * 100}%`,
                      height: "100%",
                      backgroundColor: tk.gold,
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                </div>

                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    padding: "9px 0",
                    borderTop: `1px solid ${divider}`
                  }}>
                    <span style={{ color: cardMuted }}>Duration</span>
                    <span style={{ ...mono, color: cardText }}>{lesson.duration}</span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    padding: "9px 0",
                    borderTop: `1px solid ${divider}`
                  }}>
                    <span style={{ color: cardMuted }}>XP reward</span>
                    <span style={{ ...mono, color: tk.gold }}>{lesson.xp} XP</span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    padding: "9px 0",
                    borderTop: `1px solid ${divider}`
                  }}>
                    <span style={{ color: cardMuted }}>Coin reward</span>
                    <span style={{ ...mono, color: tk.gold, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      {lesson.coins} <Icon name="coin" size={14} color={tk.gold} />
                    </span>
                  </div>
                  {progress?.completed && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "13px",
                      padding: "9px 0",
                      borderTop: `1px solid ${divider}`
                    }}>
                      <span style={{ color: cardMuted }}>Status</span>
                      <span style={{ color: tk.up, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Icon name="check" size={13} /> Completed
                      </span>
                    </div>
                  )}
                  {hasQuizData && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "13px",
                      padding: "9px 0",
                      borderTop: `1px solid ${divider}`
                    }}>
                      <span style={{ color: cardMuted }}>Quiz score</span>
                      <span style={{ ...mono, color: tk.gold }}>{bestScorePercent}%</span>
                    </div>
                  )}
                  {hasQuizData && totalQuestions > 0 && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "13px",
                      padding: "9px 0",
                      borderTop: `1px solid ${divider}`
                    }}>
                      <span style={{ color: cardMuted }}>Best result</span>
                      <span style={{ ...mono, color: cardText }}>
                        {bestCorrectCount}/{totalQuestions}
                        <span style={{ color: cardMuted }}> ({bestIncorrectCount} wrong)</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Navigation */}
              <div style={{
                ...panel,
                padding: "22px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <span style={label}>sections</span>
                  <span style={{ flex: 1, height: 1, background: divider }} />
                  <span style={{ ...mono, fontSize: 11, color: cardMuted }}>{lesson.content.length}</span>
                </div>

                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}>
                  {lesson.content.map((section, index) => {
                    const active = index === currentSection;
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentSection(index)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          backgroundColor: active ? tk.gold : "transparent",
                          color: active ? ink : cardText,
                          border: `1px solid ${active ? "transparent" : divider}`,
                          padding: "10px 12px",
                          borderRadius: `${tk.rSm}px`,
                          fontFamily: fontBody,
                          fontSize: "13px",
                          fontWeight: active ? "600" : "500",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <span style={{ ...mono, fontSize: "11px", color: active ? ink : cardMuted, minWidth: "18px" }}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>{section.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lesson-grid" style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "32px",
            alignItems: "start"
          }}>
            {/* Main Quiz Content */}
            <div>
              {/* Quiz */}
              <div style={{
                ...panel,
                padding: "28px",
                marginBottom: "24px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <span style={label}>quiz</span>
                  <span style={{ flex: 1, height: 1, background: divider }} />
                </div>

                <h2 style={{
                  ...heading,
                  fontSize: "22px",
                  color: cardText,
                  marginBottom: "10px"
                }}>
                  Lesson quiz
                </h2>

                <p style={{
                  fontSize: "14px",
                  color: cardMuted,
                  marginBottom: "28px"
                }}>
                  Test your knowledge with this quiz. You have unlimited attempts.
                </p>

                {lesson.quiz.questions.map((question, index) => (
                  <div key={index} style={{ marginBottom: "28px" }}>
                    <p style={{
                      fontSize: "16px",
                      color: cardText,
                      marginBottom: "14px",
                      fontWeight: "500",
                      display: "flex",
                      gap: "10px"
                    }}>
                      <span style={{ ...mono, color: tk.gold }}>{String(index + 1).padStart(2, "0")}</span>
                      <span>{question.question}</span>
                    </p>

                    {question.options.map((option, optionIndex) => {
                      const selected = quizAnswers[`q${index}`] === optionIndex;
                      return (
                        <label
                          key={optionIndex}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "13px 14px",
                            marginBottom: "8px",
                            background: selected ? tk.upBg : tk.inset,
                            borderRadius: `${tk.rSm}px`,
                            cursor: "pointer",
                            border: selected ? `1px solid ${tk.goldHair}` : `1px solid ${divider}`,
                            transition: "border-color 0.2s ease, background 0.2s ease"
                          }}
                        >
                          <input
                            type="radio"
                            name={`q${index}`}
                            value={optionIndex}
                            checked={quizAnswers[`q${index}`] === optionIndex}
                            onChange={(e) => setQuizAnswers({...quizAnswers, [`q${index}`]: parseInt(e.target.value)})}
                            style={{ marginRight: "12px", accentColor: tk.gold }}
                          />
                          <span style={{
                            fontSize: "14px",
                            color: cardText
                          }}>
                            {option}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ))}

                <div style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center"
                }}>
                  <button
                    onClick={() => setShowQuiz(false)}
                    style={{
                      ...btnGhost,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Icon name="arrow-left" size={14} /> Back to Lesson
                  </button>

                  <button
                    onClick={handleQuizSubmit}
                    style={{
                      ...btnPrimary,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Icon name="check" size={14} /> Submit Quiz
                  </button>
                </div>
              </div>
              
              {/* Completed Lesson Actions */}
              {progress?.completed && (
                <div style={{
                  ...panel,
                  padding: "22px",
                  textAlign: "center"
                }}>
                  <h3 style={{
                    ...heading,
                    fontSize: "18px",
                    color: cardText,
                    marginBottom: "16px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <Icon name="trophy" size={18} color={tk.gold} /> Lesson completed
                  </h3>

                  <div style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "center"
                  }}>
                    <button
                      onClick={handleRetakeQuiz}
                      style={{
                        ...btnGhost,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <Icon name="refresh" size={14} /> Retake Quiz
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quiz Sidebar */}
            <div className="lesson-sidebar" style={{
              position: "sticky",
              top: "24px"
            }}>
              {/* Quiz Info Card */}
              <div style={{
                ...panel,
                padding: "22px",
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <span style={label}>quiz info</span>
                  <span style={{ flex: 1, height: 1, background: divider }} />
                </div>

                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    padding: "9px 0",
                    borderTop: `1px solid ${divider}`
                  }}>
                    <span style={{ color: cardMuted }}>Questions</span>
                    <span style={{ ...mono, color: cardText }}>{lesson.quiz.questions.length}</span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    padding: "9px 0",
                    borderTop: `1px solid ${divider}`
                  }}>
                    <span style={{ color: cardMuted }}>Attempts</span>
                    <span style={{ color: cardText, fontWeight: "500" }}>Unlimited</span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    padding: "9px 0",
                    borderTop: `1px solid ${divider}`
                  }}>
                    <span style={{ color: cardMuted }}>Best score</span>
                    <span style={{ ...mono, color: progress?.bestScore ? tk.gold : cardMuted }}>
                      {progress?.bestScore ? `${Math.round(progress.bestScore)}%` : "Not taken"}
                    </span>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    padding: "9px 0",
                    borderTop: `1px solid ${divider}`
                  }}>
                    <span style={{ color: cardMuted }}>Rewards</span>
                    <span style={{ color: tk.gold, fontWeight: "500" }}>
                      {completionData?.rewardAlreadyGiven ? "Already claimed" : "One-time"}
                    </span>
                  </div>
                  {progress?.completed && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "13px",
                      padding: "9px 0",
                      borderTop: `1px solid ${divider}`
                    }}>
                      <span style={{ color: cardMuted }}>Status</span>
                      <span style={{ color: tk.up, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Icon name="check" size={13} /> Completed
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quiz Progress */}
              <div style={{
                ...panel,
                padding: "22px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <span style={label}>quiz progress</span>
                  <span style={{ flex: 1, height: 1, background: divider }} />
                  <span style={{ ...mono, fontSize: 11, color: cardMuted }}>
                    {Object.keys(quizAnswers).length} / {lesson.quiz.questions.length}
                  </span>
                </div>

                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}>
                  {lesson.quiz.questions.map((question, index) => {
                    const answered = quizAnswers[`q${index}`] !== undefined;
                    return (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          background: answered ? tk.upBg : tk.inset,
                          borderRadius: `${tk.rSm}px`,
                          border: `1px solid ${answered ? "rgba(79,180,119,.32)" : divider}`,
                          fontSize: "13px"
                        }}
                      >
                        <div style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: `${tk.rXs}px`,
                          background: answered ? tk.up : "transparent",
                          border: answered ? "none" : `1px solid ${divider}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: answered ? ink : cardMuted
                        }}>
                          {answered
                            ? <Icon name="check" size={13} />
                            : <span style={{ ...mono, fontSize: "11px" }}>{index + 1}</span>}
                        </div>
                        <span style={{
                          color: answered ? cardText : cardMuted,
                          fontWeight: answered ? "500" : "400"
                        }}>
                          Question <span style={{ ...mono }}>{index + 1}</span>
                        </span>
                      </div>
                    );
                  })}
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
          zIndex: 1000
        }}>
          <div style={{
            ...panel,
            background: cardBg,
            padding: "32px",
            maxWidth: "480px",
            width: "90%",
            textAlign: "center",
            boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
            animation: "slideIn 0.3s ease-out"
          }}>
            {/* Success Icon */}
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: `${tk.rSm}px`,
              border: `1px solid ${tk.goldHair}`,
              color: tk.gold,
              display: "grid",
              placeItems: "center",
              margin: "0 auto 18px"
            }}>
              <Icon name="trophy" size={24} />
            </div>

            {/* Title */}
            <h2 style={{
              ...heading,
              fontSize: "24px",
              color: cardText,
              marginBottom: "14px"
            }}>
              {completionData.lessonCompleted ? "Lesson completed" : "Quiz submitted"}
            </h2>

            {/* Score */}
            <div style={{
              ...mono,
              fontSize: "44px",
              fontWeight: 600,
              color: tk.gold,
              lineHeight: 1,
              marginBottom: "24px"
            }}>
              {completionData.score}%
            </div>

            {/* Score Details */}
            <div style={{
              ...inset,
              padding: "6px 18px 12px",
              marginBottom: "24px",
              textAlign: "left"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13px",
                padding: "9px 0",
                borderTop: `1px solid ${divider}`
              }}>
                <span style={{ color: cardMuted }}>Correct answers</span>
                <span style={{ ...mono, fontWeight: "600", color: cardText }}>
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
                    fontSize: "13px",
                    padding: "9px 0",
                    borderTop: `1px solid ${divider}`
                  }}>
                    <span style={{ color: cardMuted }}>XP earned this attempt</span>
                    <span style={{ ...mono, fontWeight: "600", color: tk.gold }}>
                      +{completionData.xpEarned} XP
                    </span>
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    padding: "9px 0",
                    borderTop: `1px solid ${divider}`
                  }}>
                    <span style={{ color: cardMuted }}>Coins earned this attempt</span>
                    <span style={{ ...mono, fontWeight: "600", color: tk.gold, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      +{completionData.coinsEarned} <Icon name="coin" size={13} color={tk.gold} />
                    </span>
                  </div>
                </>
              ) : (
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                  padding: "9px 0",
                  borderTop: `1px solid ${divider}`
                }}>
                  <span style={{ color: cardMuted }}>Rewards earned</span>
                  <span style={{ color: cardMuted }}>
                    None (max already earned)
                  </span>
                </div>
              )}
              
              {/* Show total rewards earned */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13px",
                padding: "9px 0",
                borderTop: `1px solid ${tk.hairStrong}`
              }}>
                <span style={{ color: cardMuted }}>Total XP earned</span>
                <span style={{ ...mono, fontWeight: "600", color: cardText }}>
                  {completionData.totalXpEarned}/{completionData.totalXpPossible} XP
                </span>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13px",
                padding: "9px 0",
                borderTop: `1px solid ${divider}`
              }}>
                <span style={{ color: cardMuted }}>Total coins earned</span>
                <span style={{ ...mono, fontWeight: "600", color: cardText, display: "inline-flex", alignItems: "center", gap: 5 }}>
                  {completionData.totalCoinsEarned}/{completionData.totalCoinsPossible} <Icon name="coin" size={13} color={cardText} />
                </span>
              </div>

              {/* Show remaining rewards if any */}
              {(completionData.xpRemaining > 0 || completionData.coinsRemaining > 0) && (
                <>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    padding: "9px 0",
                    borderTop: `1px solid ${tk.hairStrong}`
                  }}>
                    <span style={{ color: cardMuted }}>XP remaining</span>
                    <span style={{ ...mono, fontWeight: "600", color: tk.gold }}>
                      {completionData.xpRemaining} XP
                    </span>
                  </div>

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    padding: "9px 0",
                    borderTop: `1px solid ${divider}`
                  }}>
                    <span style={{ color: cardMuted }}>Coins remaining</span>
                    <span style={{ ...mono, fontWeight: "600", color: tk.gold, display: "inline-flex", alignItems: "center", gap: 5 }}>
                      {completionData.coinsRemaining} <Icon name="coin" size={13} color={tk.gold} />
                    </span>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "transparent",
                    border: `1px solid ${tk.goldHair}`,
                    color: tk.gold,
                    padding: "9px 12px",
                    borderRadius: `${tk.rSm}px`,
                    fontSize: "12px",
                    textAlign: "left",
                    marginTop: "12px"
                  }}>
                    <Icon name="sparkle" size={14} /> Retake the quiz to earn remaining rewards.
                  </div>
                </>
              )}

              {/* Show completion message if 100% achieved */}
              {completionData.rewardAlreadyGiven && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "transparent",
                  border: `1px solid ${tk.goldHair}`,
                  color: tk.gold,
                  padding: "9px 12px",
                  borderRadius: `${tk.rSm}px`,
                  fontSize: "12px",
                  textAlign: "left",
                  marginTop: "12px"
                }}>
                  <Icon name="trophy" size={14} /> Perfect score. All rewards earned.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap"
            }}>
              <button
                onClick={handleBackToLesson}
                style={{
                  ...btnGhost,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "11px 16px",
                  flex: 1,
                  minWidth: "140px"
                }}
              >
                <Icon name="arrow-left" size={14} /> Back to Lesson
              </button>

              <button
                onClick={handleRetakeQuiz}
                style={{
                  ...((completionData.xpRemaining > 0 || completionData.coinsRemaining > 0) ? btnPrimary : btnGhost),
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "11px 16px",
                  flex: 1,
                  minWidth: "140px"
                }}
              >
                <Icon name="refresh" size={14} /> {(completionData.xpRemaining > 0 || completionData.coinsRemaining > 0) ? "Retake for More Rewards" : "Retake Quiz"}
              </button>

              {findNextLesson(lesson.id) ? (
                <button
                  onClick={handleContinueToNext}
                  style={{
                    ...(completionData.lessonCompleted ? btnPrimary : btnGhost),
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "11px 16px",
                    flex: 1,
                    minWidth: "140px"
                  }}
                >
                  {completionData.lessonCompleted ? "Continue to Next Lesson" : "Next Lesson"}
                  <Icon name="arrow-right" size={14} />
                </button>
              ) : (
                <button
                  onClick={handleBackToLearn}
                  style={{
                    ...btnPrimary,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "11px 16px",
                    flex: 1,
                    minWidth: "140px"
                  }}
                >
                  <Icon name="arrow-left" size={14} /> Back to Learn
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
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

        /* Collapse the lesson/quiz two-column layout to a single column on small screens */
        @media (max-width: 768px) {
          .lesson-grid {
            grid-template-columns: 1fr !important;
          }
          .lesson-sidebar {
            position: static !important;
            top: auto !important;
          }
        }
      `}</style>
    </div>
  );
} 