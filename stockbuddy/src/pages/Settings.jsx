import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getCurrentUser } from '../services/api';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

const Settings = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.getProfile();
      if (response.success) {
        setUserProfile(response.user);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: marbleWhite,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fontBody
      }}>
        <div>Loading settings...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: marbleWhite,
      fontFamily: fontBody
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: marbleLightGray,
        padding: '24px',
        borderBottom: `1px solid ${marbleGray}`
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: marbleDarkGray,
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ← Back to Dashboard
          </button>
          
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: marbleDarkGray,
            fontFamily: fontHeading,
            marginBottom: '8px'
          }}>
            Settings
          </h1>
          
          <p style={{
            fontSize: '18px',
            color: marbleGray,
            marginBottom: '16px'
          }}>
            Manage your account preferences and settings
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        {/* Settings Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '24px'
        }}>
          {/* Account Settings */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: marbleGold,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                👤
              </div>
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: marbleDarkGray,
                  fontFamily: fontHeading,
                  marginBottom: '4px'
                }}>
                  Account Settings
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: marbleGray
                }}>
                  Manage your profile information
                </p>
              </div>
            </div>
            
            <div style={{
              backgroundColor: marbleWhite,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ color: marbleGray }}>Name</span>
                <span style={{ color: marbleDarkGray, fontWeight: '500' }}>
                  {userProfile?.name || 'Not set'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ color: marbleGray }}>Username</span>
                <span style={{ color: marbleDarkGray, fontWeight: '500' }}>
                  @{userProfile?.username || 'Not set'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: marbleGray }}>Email</span>
                <span style={{ color: marbleDarkGray, fontWeight: '500' }}>
                  {userProfile?.email || 'Not set'}
                </span>
              </div>
            </div>
            
            <button style={{
              backgroundColor: marbleDarkGray,
              color: marbleWhite,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              width: '100%'
            }}>
              Edit Profile
            </button>
          </div>

          {/* Learning Preferences */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: marbleGold,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                📚
              </div>
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: marbleDarkGray,
                  fontFamily: fontHeading,
                  marginBottom: '4px'
                }}>
                  Learning Preferences
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: marbleGray
                }}>
                  Customize your learning experience
                </p>
              </div>
            </div>
            
            <div style={{
              backgroundColor: marbleWhite,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ color: marbleGray }}>Daily Goal</span>
                <span style={{ color: marbleDarkGray, fontWeight: '500' }}>3 lessons</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ color: marbleGray }}>Notifications</span>
                <span style={{ color: marbleDarkGray, fontWeight: '500' }}>Enabled</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: marbleGray }}>Difficulty</span>
                <span style={{ color: marbleDarkGray, fontWeight: '500' }}>Auto</span>
              </div>
            </div>
            
            <button style={{
              backgroundColor: marbleDarkGray,
              color: marbleWhite,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              width: '100%'
            }}>
              Customize Preferences
            </button>
          </div>

          {/* Privacy & Security */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: marbleGold,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                🔒
              </div>
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: marbleDarkGray,
                  fontFamily: fontHeading,
                  marginBottom: '4px'
                }}>
                  Privacy & Security
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: marbleGray
                }}>
                  Manage your account security
                </p>
              </div>
            </div>
            
            <div style={{
              backgroundColor: marbleWhite,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ color: marbleGray }}>Two-Factor Auth</span>
                <span style={{ color: marbleGray, fontWeight: '500' }}>Not enabled</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ color: marbleGray }}>Last Login</span>
                <span style={{ color: marbleDarkGray, fontWeight: '500' }}>
                  {userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: marbleGray }}>Account Created</span>
                <span style={{ color: marbleDarkGray, fontWeight: '500' }}>
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
            
            <button style={{
              backgroundColor: marbleDarkGray,
              color: marbleWhite,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              width: '100%'
            }}>
              Security Settings
            </button>
          </div>

          {/* Data Management */}
          <div style={{
            backgroundColor: marbleLightGray,
            borderRadius: '20px',
            padding: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: marbleGold,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                💾
              </div>
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: marbleDarkGray,
                  fontFamily: fontHeading,
                  marginBottom: '4px'
                }}>
                  Data Management
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: marbleGray
                }}>
                  Manage your data and progress
                </p>
              </div>
            </div>
            
            <div style={{
              backgroundColor: marbleWhite,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ color: marbleGray }}>Export Data</span>
                <span style={{ color: marbleDarkGray, fontWeight: '500' }}>Available</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ color: marbleGray }}>Delete Account</span>
                <span style={{ color: '#ef4444', fontWeight: '500' }}>Danger Zone</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: marbleGray }}>Reset Progress</span>
                <span style={{ color: '#f59e0b', fontWeight: '500' }}>Warning</span>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button style={{
                backgroundColor: marbleDarkGray,
                color: marbleWhite,
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                flex: 1
              }}>
                Export Data
              </button>
              <button style={{
                backgroundColor: '#ef4444',
                color: marbleWhite,
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                flex: 1
              }}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 