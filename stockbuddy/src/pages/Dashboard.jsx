import React from "react";
import "../globals.css";
import { useNavigate } from "react-router-dom";
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import { lessons } from '../lessonRoadmap';

const mockUserData = {
  name: "Akash K",
  username: "@AkashK84925",
};

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
            }}>Welcome back, {mockUserData.name}!</h1>
            <div style={{ 
              color: marbleGray,
              fontSize: '16px' 
            }}>{mockUserData.username}</div>
          </div>
          <div style={{ 
            color: marbleDarkGray,
            backgroundColor: marbleLightGray,
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}>70% of daily goal</div>
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
              }}>Level 5 - Advanced</div>
              <div style={{
                fontSize: '14px',
                color: marbleDarkGray
              }}>
                <strong>25,000 XP</strong> earned this month
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
              }}>7/10 Lessons Complete</div>
              <div style={{
                fontSize: '14px',
                color: marbleDarkGray
              }}>
                <strong>3 lessons</strong> remaining today
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
              {lessons.slice(0, 3).map((lesson, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '16px',
                  backgroundColor: lesson.status === 'current' ? marbleWhite : 'transparent',
                  padding: '16px',
                  borderRadius: '12px',
                  cursor: 'pointer'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: lesson.status === 'completed' ? marbleGold : 
                                   lesson.status === 'current' ? marbleDarkGray : marbleGray,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: marbleWhite,
                    fontSize: '18px'
                  }}>{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '500',
                      color: marbleDarkGray,
                      marginBottom: '4px'
                    }}>{lesson.title}</div>
                    <div style={{
                      fontSize: '14px',
                      color: marbleGray
                    }}>{lesson.status === 'completed' ? 'Completed' : 
                        lesson.status === 'current' ? 'In Progress' : 'Locked'}</div>
                  </div>
                  {lesson.status === 'current' && (
                    <button style={{
                      backgroundColor: marbleGold,
                      color: marbleDarkGray,
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}>Continue</button>
                  )}
                </div>
              ))}
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