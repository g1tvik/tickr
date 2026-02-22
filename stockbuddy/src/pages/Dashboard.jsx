import React, { useState, useEffect } from "react";
import "../globals.css";
import { useNavigate } from "react-router-dom";
import { white, lightGray, gray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import { api, isAuthenticated, getCurrentUser } from '../services/api';
import { getLevelProgress, lessonStructure } from '../data/lessonStructure';

// Real Weekly Progress Chart Component
const WeeklyProgressChart = ({ userData }) => {
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    if (!userData?.learningProgress?.lessonAttempts) return;

    // Generate last 7 days of data
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      
      // Count lessons completed on this day
      const lessonsCompleted = Object.keys(userData.learningProgress.lessonAttempts).filter(lessonId => {
        const attempt = userData.learningProgress.lessonAttempts[lessonId];
        if (attempt.lastAttempt) {
          const attemptDate = new Date(attempt.lastAttempt).toDateString();
          return attemptDate === dateString && attempt.completed;
        }
        return false;
      }).length;

      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        lessons: lessonsCompleted,
        xp: lessonsCompleted * 25 // Assuming 25 XP per lesson
      });
    }
    
    setWeeklyData(last7Days);
  }, [userData]);

  const maxLessons = Math.max(...weeklyData.map(d => d.lessons), 1);

  return (
    <div style={{ 
      width: '100%', 
      height: '180px', 
      display: 'flex', 
      alignItems: 'flex-end', 
      gap: '8px',
      padding: '20px 0'
    }}>
      {weeklyData.map((day, i) => (
        <div key={i} style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              height: `${(day.lessons / maxLessons) * 100}%`,
              backgroundColor: day.lessons > 0 ? marbleGold : gray,
              borderRadius: '4px 4px 0 0',
              marginBottom: '8px',
              minHeight: '4px',
              transition: 'all 0.3s ease'
            }}
          />
          <div style={{ fontSize: '12px', color: gray, marginBottom: '2px' }}>
            {day.date}
          </div>
          <div style={{ fontSize: '10px', color: marbleDarkGray, fontWeight: '600' }}>
            {day.lessons}
          </div>
        </div>
      ))}
    </div>
  );
};

// Real Trading Milestones Component
const TradingMilestones = ({ userData, portfolio }) => {
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    if (!userData || !portfolio) return;

    const completedLessons = userData.learningProgress?.completedLessons || [];
    const transactions = userData.transactions || [];
    const hasPositions = portfolio.positions && portfolio.positions.length > 0;
    const totalValue = portfolio.totalValue || 0;
    const totalReturn = portfolio.totalReturn || 0;

    const milestoneData = [
      {
        id: 'first_lesson',
        title: "First Lesson Complete",
        xp: 25,
        status: completedLessons.length > 0 ? "completed" : "locked",
        icon: "📚",
        description: "Complete your first lesson"
      },
      {
        id: 'first_trade',
        title: "First Stock Purchase",
        xp: 50,
        status: transactions.length > 0 ? "completed" : "locked",
        icon: "🎯",
        description: "Make your first stock purchase"
      },
      {
        id: 'portfolio_diversification',
        title: "Portfolio Diversification",
        xp: 75,
        status: hasPositions && portfolio.positions.length >= 2 ? "completed" : 
                hasPositions ? "current" : "locked",
        icon: "📊",
        description: "Hold at least 2 different stocks"
      },
      {
        id: 'profitable_trade',
        title: "First Profitable Trade",
        xp: 100,
        status: totalReturn > 0 ? "completed" : 
                hasPositions ? "current" : "locked",
        icon: "💰",
        description: "Achieve positive portfolio returns"
      },
      {
        id: 'risk_management',
        title: "Risk Management Master",
        xp: 150,
        status: completedLessons.includes(16) || completedLessons.includes(17) ? "completed" :
                completedLessons.length >= 10 ? "current" : "locked",
        icon: "🛡️",
        description: "Complete risk management lessons"
      },
      {
        id: 'advanced_trader',
        title: "Advanced Trader",
        xp: 200,
        status: completedLessons.length >= 20 ? "completed" :
                completedLessons.length >= 15 ? "current" : "locked",
        icon: "🚀",
        description: "Complete 20+ lessons"
      }
    ];

    setMilestones(milestoneData);
  }, [userData, portfolio]);

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
            color: white,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }}>In Progress</div>
        );
      default:
        return (
          <div style={{
            backgroundColor: gray,
            color: white,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }}>Locked</div>
        );
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px'
    }}>
      {milestones.map((milestone, index) => (
        <div key={milestone.id} style={{
          backgroundColor: white,
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
              color: gray,
              marginBottom: '12px'
            }}>{milestone.xp} XP</div>
            {renderMilestoneStatus(milestone.status)}
          </div>
        </div>
      ))}
    </div>
  );
};

// Real Recent Activity Component
const RecentActivity = ({ userData, portfolio }) => {
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (!userData) return;

    const activities = [];
    const today = new Date();

    // Add recent lesson completions
    if (userData.learningProgress?.lessonAttempts) {
      Object.entries(userData.learningProgress.lessonAttempts).forEach(([lessonId, attempt]) => {
        if (attempt.completed && attempt.lastAttempt) {
          const lesson = lessonStructure.units
            .flatMap(unit => unit.lessons)
            .find(l => l.id === parseInt(lessonId));
          
          if (lesson) {
            activities.push({
              id: `lesson_${lessonId}`,
              type: 'lesson',
              title: `Completed: ${lesson.title}`,
              timestamp: new Date(attempt.lastAttempt),
              icon: '📚',
              xp: lesson.xp
            });
          }
        }
      });
    }

    // Add recent transactions
    if (userData.transactions) {
      userData.transactions.forEach(transaction => {
        activities.push({
          id: `transaction_${transaction.id}`,
          type: 'trade',
          title: `${transaction.type.toUpperCase()} ${transaction.shares} shares of ${transaction.symbol}`,
          timestamp: new Date(transaction.timestamp),
          icon: transaction.type === 'buy' ? '📈' : '📉',
          amount: transaction.total
        });
      });
    }

    // Sort by timestamp and take last 5
    activities.sort((a, b) => b.timestamp - a.timestamp);
    setRecentActivities(activities.slice(0, 5));
  }, [userData, portfolio]);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div>
      {recentActivities.length > 0 ? (
        recentActivities.map((activity) => (
          <div key={activity.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            color: marbleDarkGray
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: lightGray,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              {activity.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>
                {activity.title}
              </div>
              <div style={{ fontSize: '12px', color: gray }}>
                {formatTimeAgo(activity.timestamp)}
                {activity.xp && ` • +${activity.xp} XP`}
                {activity.amount && ` • $${activity.amount.toFixed(2)}`}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: gray
        }}>
          No recent activity. Start learning or trading!
        </div>
      )}
    </div>
  );
};

// Real Leaderboard Component
const Leaderboard = ({ userData }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.getLeaderboard();
        if (response.success) {
          setLeaderboard(response.leaderboard || []);
          setTotalUsers(response.totalUsers || 0);
        } else {
          setError('Failed to load leaderboard');
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to load leaderboard');
        // Fallback to mock data for development
        setLeaderboard([
          { username: 'TraderPro', xp: 1250, rank: 1, completedLessons: 15 },
          { username: 'StockMaster', xp: 1100, rank: 2, completedLessons: 12 },
          { username: 'InvestorGuru', xp: 950, rank: 3, completedLessons: 10 },
          { username: 'MarketWiz', xp: 800, rank: 4, completedLessons: 8 }
        ]);
        setTotalUsers(4);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated()) {
      fetchLeaderboard();
    } else {
      setLoading(false);
    }
  }, []);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const lastLogin = new Date(timestamp);
    const diff = now - lastLogin;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Recently';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: gray }}>
        Loading leaderboard...
      </div>
    );
  }

  if (error && leaderboard.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
        {error}
      </div>
    );
  }

  return (
    <div>
      {totalUsers > 0 && (
        <div style={{
          fontSize: '12px',
          color: gray,
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          {totalUsers} total users
        </div>
      )}
      
      {leaderboard.length > 0 ? (
        leaderboard.map((user, index) => (
          <div key={user.userId || user.rank || index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            color: marbleDarkGray,
            padding: '8px',
            borderRadius: '8px',
            backgroundColor: user.rank <= 3 ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: user.rank === 1 ? marbleGold : 
                             user.rank === 2 ? gray : 
                             user.rank === 3 ? '#cd7f32' : lightGray,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              color: user.rank <= 3 ? white : marbleDarkGray,
              flexShrink: 0
            }}>
              {user.rank || index + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                marginBottom: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.name || user.username}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: gray,
                display: 'flex',
                gap: '8px'
              }}>
                <span>{user.completedLessons || 0} lessons</span>
                {user.lastLogin && (
                  <span>• {formatTimeAgo(user.lastLogin)}</span>
                )}
              </div>
            </div>
            <div style={{ 
              fontWeight: '600',
              color: marbleGold,
              fontSize: '14px',
              flexShrink: 0
            }}>
              {user.xp}XP
            </div>
          </div>
        ))
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: gray
        }}>
          No leaderboard data available
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [learningPreferences, setLearningPreferences] = useState({
    dailyGoal: 3,
    notifications: true,
    difficulty: 'auto'
  });

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
          positions: response.portfolio.positions.map(position => ({
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

  const fetchLearningPreferences = async () => {
    if (!isAuthenticated()) return;

    try {
      const response = await api.getLearningPreferences();
      if (response.success) {
        setLearningPreferences(response.preferences);
      }
    } catch (err) {
      console.error('Error fetching learning preferences:', err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    fetchUserData();
    fetchUserProfile();
    fetchLearningPreferences();
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
    if (!change) return gray;
    return change >= 0 ? '#22c55e' : '#ef4444';
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
    
    const dailyGoal = learningPreferences.dailyGoal || 3; // Use user's preference or default to 3
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
      backgroundColor: white,
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
              color: gray,
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
                backgroundColor: lightGray,
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
                    color: gray
                  }}>
                    Level {levelInfo.currentLevel}
                  </div>
                </div>
              </div>
              
              <div style={{
                backgroundColor: lightGray,
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
                    color: gray
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
            backgroundColor: lightGray,
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
            backgroundColor: lightGray,
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
                color: gray,
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
            backgroundColor: lightGray,
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
                color: gray,
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
              backgroundColor: lightGray,
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
                      color: white,
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
                  color: gray
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
                  color: gray
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
                      backgroundColor: white,
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: gray,
                        marginBottom: '4px'
                      }}>Total Value</div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: marbleDarkGray
                      }}>{formatCurrency(portfolio.totalValue)}</div>
                    </div>
                    <div style={{
                      backgroundColor: white,
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: gray,
                        marginBottom: '4px'
                      }}>Cash</div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: marbleDarkGray
                      }}>{formatCurrency(portfolio.cash)}</div>
                    </div>
                    <div style={{
                      backgroundColor: white,
                      borderRadius: '12px',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: gray,
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
                  {portfolio.positions && portfolio.positions.length > 0 ? (
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
                        {portfolio.positions.map((holding, index) => (
                          <div key={index} style={{
                            backgroundColor: white,
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
                                color: gray
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
                      color: gray
                    }}>
                      No holdings yet. Start trading to build your portfolio!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Weekly Progress */}
            <div style={{
              backgroundColor: lightGray,
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
              <WeeklyProgressChart userData={userData} />
            </div>

            {/* Learning Path */}
            <div style={{
              backgroundColor: lightGray,
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

              <TradingMilestones userData={userData} portfolio={portfolio} />
            </div>

            {/* Current Lesson */}
            <div style={{
              backgroundColor: lightGray,
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
                color: gray
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
              backgroundColor: lightGray,
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
              <Leaderboard userData={userData} />
            </div>

            {/* Recent Activity */}
            <div style={{
              backgroundColor: lightGray,
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
              <RecentActivity userData={userData} portfolio={portfolio} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}