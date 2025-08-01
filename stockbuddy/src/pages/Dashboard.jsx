import React, { useState, useEffect } from "react";
import "../globals.css";
import { useNavigate } from "react-router-dom";
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import { api, isAuthenticated, getCurrentUser } from '../services/api';
import { getLevelProgress } from '../data/lessonStructure';

const DummyChart = () => (
  <div style={{ 
    width: '100%', 
    height: '180px', 
    display: 'flex', 
    alignItems: 'flex-end', 
    gap: '8px',
    padding: '20px 0'
  }}>
    {[40, 60, 30, 80, 45, 70, 50, 90, 35, 65, 55, 75].map((height, i) => (
      <div
        key={i}
        style={{
          height: `${height}%`,
          backgroundColor: marbleGold,
          flex: 1,
          borderRadius: '4px 4px 0 0'
        }}
      />
    ))}
  </div>
);

// Sample trading milestones data
const tradingMilestones = [
  { title: "First Stock Purchase", xp: 50, status: "completed", icon: "🎯" },
  { title: "Portfolio Diversification", xp: 75, status: "completed", icon: "📊" },
  { title: "First Profitable Trade", xp: 100, status: "current", icon: "💰" },
  { title: "Risk Management Master", xp: 150, status: "locked", icon: "🛡️" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const fetchPortfolio = async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.getPortfolio();
      if (response.success && response.portfolio) {
        // Transform the data to match the expected format
        const transformedPortfolio = {
          totalValue: response.portfolio.totalValue,
          cash: response.portfolio.balance,
          totalReturn: 0, // Will calculate below
          holdings: response.portfolio.positions.map(position => ({
            symbol: position.symbol,
            shares: position.shares,
            currentValue: position.shares * (position.currentPrice || position.avgPrice),
            changePercent: position.changePercent || 0,
            avgPrice: position.avgPrice
          }))
        };

        // Calculate total return
        if (response.portfolio.positions.length > 0) {
          const totalCostBasis = response.portfolio.positions.reduce((total, position) => {
            return total + (position.shares * position.avgPrice);
          }, 0);
          
          const totalCurrentValue = response.portfolio.positions.reduce((total, position) => {
            return total + (position.shares * (position.currentPrice || position.avgPrice));
          }, 0);
          
          if (totalCostBasis > 0) {
            transformedPortfolio.totalReturn = (totalCurrentValue - totalCostBasis) / totalCostBasis;
          }
        }
        setPortfolio(transformedPortfolio);
      } else {
        setError('Failed to load portfolio data');
      }
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    if (!isAuthenticated()) return;

    try {
      const response = await api.getUserData();
      if (response.success) {
        setUserData(response);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const fetchUserProfile = async () => {
    if (!isAuthenticated()) return;

    try {
      const response = await api.getProfile();
      if (response.success) {
        setUserProfile(response.user);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    fetchUserData();
    fetchUserProfile();
  }, []);

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Helper function to format percentage
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0.00%';
    return `${(value * 100).toFixed(2)}%`;
  };

  // Helper function to get color for change
  const getChangeColor = (change) => {
    if (!change) return marbleGray;
    return change >= 0 ? '#22c55e' : '#ef4444';
  };

  const renderMilestoneStatus = (status) => {
    switch(status) {
      case 'completed':
        return (
          <div style={{
            backgroundColor: marbleGold,
            color: marbleDarkGray,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }}>Completed</div>
        );
      case 'current':
        return (
          <div style={{
            backgroundColor: marbleDarkGray,
            color: marbleWhite,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }}>In Progress</div>
        );
      default:
        return (
          <div style={{
            backgroundColor: marbleGray,
            color: marbleWhite,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }}>Locked</div>
        );
    }
  };

  // Get current user info
  const currentUser = getCurrentUser();
  const userDisplayName = userProfile?.name || currentUser?.username || 'User';
  const userDisplayUsername = userProfile?.username || currentUser?.username || `@${userDisplayName.toLowerCase().replace(/\s+/g, '_')}`;

  // Get learning progress
  const learningProgress = userData?.learningProgress || { xp: 0, coins: 0 };
  const levelInfo = getLevelProgress(learningProgress.xp);

  // Calculate daily goal progress
  const calculateDailyGoal = () => {
    const today = new Date().toDateString();
    const completedLessons = learningProgress.completedLessons || [];
    const lessonAttempts = learningProgress.lessonAttempts || {};
    
    // Count lessons completed today
    const lessonsCompletedToday = Object.keys(lessonAttempts).filter(lessonId => {
      const attempt = lessonAttempts[lessonId];
      if (attempt.lastAttempt) {
        const attemptDate = new Date(attempt.lastAttempt).toDateString();
        return attemptDate === today && attempt.completed;
      }
      return false;
    }).length;
    
    const dailyGoal = 3; // Target: 3 lessons per day
    const progress = Math.min((lessonsCompletedToday / dailyGoal) * 100, 100);
    const remaining = Math.max(dailyGoal - lessonsCompletedToday, 0);
    
    return {
      completed: lessonsCompletedToday,
      total: dailyGoal,
      progress: Math.round(progress),
      remaining
    };
  };

  const dailyGoal = calculateDailyGoal();

  return (
    <div className="dashboard-container" style={{
      minHeight: '100vh',
      backgroundColor: marbleWhite,
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: fontBody
    }}>
      {/* Main Content */}
      <div style={{
        display: 'grid',
        gap: '24px',
        gridTemplateRows: 'auto auto auto'
      }}>
        {/* Welcome Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              fontFamily: fontHeading,
              color: marbleDarkGray,
              marginBottom: '4px'
            }}>Welcome back, {userDisplayName}!</h1>
            <div style={{ 
              color: marbleGray,
              fontSize: '16px' 
            }}>{userDisplayUsername}</div>
          </div>
          
          {/* XP and Coins Display */}
          {learningProgress && (
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div style={{
                backgroundColor: marbleLightGray,
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>⭐</span>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: marbleDarkGray
                  }}>
                    {learningProgress.xp} XP
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: marbleGray
                  }}>
                    Level {levelInfo.currentLevel}
                  </div>
                </div>
              </div>
              
              <div style={{
                backgroundColor: marbleLightGray,
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>🪙</span>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: marbleDarkGray
                  }}>
                    {learningProgress.coins}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: marbleGray
                  }}>
                    Coins
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/shop')}
                style={{
                  backgroundColor: marbleGold,
                  color: marbleDarkGray,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Shop
              </button>
            </div>
          )}
          <div style={{ 
            color: marbleDarkGray,
            backgroundColor: marbleLightGray,
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}>{dailyGoal.progress}% of daily goal</div>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Current Progress Card */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: marbleGold,
              borderRadius: '16px',
              marginBottom: '8px'
            }}></div>
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '24px',
                color: marbleDarkGray,
                marginBottom: '8px',
                fontFamily: fontHeading
              }}>Current Progress</div>
              <div style={{ 
                fontSize: '16px',
                color: marbleGray,
                marginBottom: '12px'
              }}>Level {levelInfo.currentLevel} - {levelInfo.currentLevel < 5 ? 'Beginner' : levelInfo.currentLevel < 10 ? 'Intermediate' : 'Advanced'}</div>
              <div style={{
                fontSize: '14px',
                color: marbleDarkGray
              }}>
                <strong>{learningProgress?.xp || 0} XP</strong> earned total
              </div>
            </div>
          </div>

          {/* Daily Goal Card */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: marbleDarkGray,
              borderRadius: '16px',
              marginBottom: '8px'
            }}></div>
            <div>
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '24px',
                color: marbleDarkGray,
                marginBottom: '8px',
                fontFamily: fontHeading
              }}>Daily Goal</div>
              <div style={{ 
                fontSize: '16px',
                color: marbleGray,
                marginBottom: '12px'
              }}>{dailyGoal.completed}/{dailyGoal.total} Lessons Complete</div>
              <div style={{
                fontSize: '14px',
                color: marbleDarkGray
              }}>
                <strong>{dailyGoal.remaining} lessons</strong> remaining today
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '24px'
        }}>
          {/* Left Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Portfolio Section */}
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: '20px',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ 
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: marbleDarkGray,
                  fontFamily: fontHeading
                }}>Portfolio</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => {
                      setLoading(true);
                      fetchPortfolio();
                    }}
                    style={{
                      backgroundColor: marbleDarkGray,
                      color: marbleWhite,
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Refresh
                  </button>
                  <button 
                    onClick={() => navigate('/trade')}
                    style={{
                      backgroundColor: marbleGold,
                      color: marbleDarkGray,
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Trade
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: marbleGray
                }}>
                  Loading portfolio...
                </div>
              ) : error ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#ef4444'
                }}>
                  Error loading portfolio: {error}
                </div>
              ) : !portfolio ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: marbleGray
                }}>
                  <div style={{ marginBottom: '16px' }}>No portfolio data available</div>
                  <button 
                    onClick={() => navigate('/trade')}
                    style={{
                      backgroundColor: marbleGold,
                      color: marbleDarkGray,
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Start Trading
                  </button>
                </div>
              ) : (
                <div>
                  {/* Portfolio Summary */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      backgroundColor: marbleWhite,
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: marbleGray,
                        marginBottom: '4px'
                      }}>Total Value</div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: marbleDarkGray
                      }}>{formatCurrency(portfolio.totalValue)}</div>
                    </div>
                    <div style={{
                      backgroundColor: marbleWhite,
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: marbleGray,
                        marginBottom: '4px'
                      }}>Cash</div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: marbleDarkGray
                      }}>{formatCurrency(portfolio.cash)}</div>
                    </div>
                    <div style={{
                      backgroundColor: marbleWhite,
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: marbleGray,
                        marginBottom: '4px'
                      }}>Total Return</div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: getChangeColor(portfolio.totalReturn)
                      }}>{formatPercentage(portfolio.totalReturn)}</div>
                    </div>
                  </div>

                  {/* Holdings */}
                  {portfolio.holdings && portfolio.holdings.length > 0 ? (
                    <div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: marbleDarkGray,
                        marginBottom: '16px'
                      }}>Holdings</h3>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        {portfolio.holdings.map((holding, index) => (
                          <div key={index} style={{
                            backgroundColor: marbleWhite,
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: marbleDarkGray,
                                marginBottom: '4px'
                              }}>{holding.symbol}</div>
                              <div style={{
                                fontSize: '14px',
                                color: marbleGray
                              }}>{holding.shares} shares</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: marbleDarkGray,
                                marginBottom: '4px'
                              }}>{formatCurrency(holding.currentValue)}</div>
                              <div style={{
                                fontSize: '14px',
                                color: getChangeColor(holding.changePercent)
                              }}>
                                {formatPercentage(holding.changePercent)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: marbleGray
                    }}>
                      No holdings yet. Start trading to build your portfolio!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Weekly Progress */}
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: '20px',
              padding: '24px'
            }}>
              <h2 style={{ 
                marginBottom: '16px',
                fontSize: '20px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                fontFamily: fontHeading
              }}>Weekly Progress</h2>
              <DummyChart />
            </div>

            {/* Learning Path */}
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: '20px',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{ 
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: marbleDarkGray,
                  fontFamily: fontHeading
                }}>Trading Journey</h2>
                <button style={{
                  backgroundColor: marbleGold,
                  color: marbleDarkGray,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>View All</button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '20px'
              }}>
                {tradingMilestones.map((milestone, index) => (
                  <div key={index} style={{
                    backgroundColor: marbleWhite,
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      marginBottom: '4px'
                    }}>{milestone.icon}</div>
                    <div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: marbleDarkGray,
                        marginBottom: '8px'
                      }}>{milestone.title}</div>
                      <div style={{
                        fontSize: '14px',
                        color: marbleGray,
                        marginBottom: '12px'
                      }}>{milestone.xp} XP</div>
                      {renderMilestoneStatus(milestone.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Lesson */}
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: '20px',
              padding: '24px'
            }}>
              <h2 style={{ 
                marginBottom: '20px',
                fontSize: '20px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                fontFamily: fontHeading
              }}>Continue Learning</h2>
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: marbleGray
              }}>
                <div style={{ marginBottom: '16px' }}>Ready to learn?</div>
                <button 
                  onClick={() => navigate('/learn')}
                  style={{
                    backgroundColor: marbleGold,
                    color: marbleDarkGray,
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Start Learning
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Split into Leaderboard and Recent Activity */}
          <div style={{
            display: 'grid',
            gridTemplateRows: '1fr 1fr',
            gap: '24px'
          }}>
            {/* Leaderboard */}
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: '20px',
              padding: '24px'
            }}>
              <h2 style={{ 
                marginBottom: '20px',
                fontSize: '20px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                fontFamily: fontHeading
              }}>Leaderboard</h2>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  color: marbleDarkGray
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: marbleGray,
                    borderRadius: '50%'
                  }}></div>
                  <div style={{ flex: 1 }}>User {i}</div>
                  <div style={{ 
                    fontWeight: '500',
                    color: marbleGold 
                  }}>{1000 - i * 100}XP</div>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: '20px',
              padding: '24px'
            }}>
              <h2 style={{ 
                marginBottom: '20px',
                fontSize: '20px',
                fontWeight: 'bold',
                color: marbleDarkGray,
                fontFamily: fontHeading
              }}>Recent Activity</h2>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  color: marbleDarkGray
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: marbleGray,
                    borderRadius: '50%'
                  }}></div>
                  <div>Completed Lesson {i}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 