import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, logout } from '../services/api';
import { gray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import { useSEO } from '../lib/seo';

const Settings = () => {
  // Marble dark theme palette (local — imported palette constants are light).
  const pageBg = '#2C2C2C';
  const cardBg = '#343434';
  const cardBg2 = '#2f2f2f';
  const cardText = '#F4F1E9';
  const cardMuted = '#b8b4a8';
  const cardBorder = 'rgba(182,156,96,0.22)';
  const divider = 'rgba(244,241,233,0.12)';

  useSEO({ title: 'Settings' });
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [learningPreferences, setLearningPreferences] = useState({
    dailyGoal: 3,
    notifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  // Track viewport width so the fixed-width settings grid collapses to a
  // single column on small screens (<= 768px).
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: ''
  });
  const [preferencesForm, setPreferencesForm] = useState({
    dailyGoal: 3,
    notifications: true
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      const [profileResponse, preferencesResponse] = await Promise.all([
        api.getProfile().catch(err => {
          if (import.meta.env.DEV) console.error('Profile API error:', err);
          return { success: false, error: err.message };
        }),
        api.getLearningPreferences().catch(err => {
          if (import.meta.env.DEV) console.error('Preferences API error:', err);
          return { success: false, error: err.message };
        })
      ]);

      if (profileResponse.success) {
        setUserProfile(profileResponse.user);
        setEditForm({
          name: profileResponse.user.name || '',
          username: profileResponse.user.username || '',
          email: profileResponse.user.email || ''
        });
      } else if (import.meta.env.DEV) {
        console.error('Profile API failed:', profileResponse.error);
      }

      if (preferencesResponse.success && preferencesResponse.preferences) {
        setLearningPreferences(preferencesResponse.preferences);
        setPreferencesForm(preferencesResponse.preferences);
      } else if (import.meta.env.DEV) {
        console.error('Preferences API failed:', preferencesResponse.error);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    try {
      setSaving(true);
      const response = await api.updateProfile(editForm);
      if (response.success) {
        setUserProfile(response.user);
        setShowEditProfile(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      setSaving(true);
      // Persist to the real API. updateLearningPreferences saves the
      // preferences server-side so they survive a reload.
      const response = await api.updateLearningPreferences(preferencesForm);
      if (response.success) {
        // Prefer the server's canonical values, but fall back to what the
        // user just submitted so the UI always reflects the saved state.
        const saved = response.preferences || preferencesForm;
        setLearningPreferences(saved);
        setPreferencesForm(saved);
        setShowPreferences(false);
        alert('Learning preferences updated successfully!');
      } else {
        alert('Failed to update preferences. Please try again.');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating preferences:', error);
      alert('Failed to update preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.exportData();
      // Create and download file
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${userProfile?.username}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert('Data exported successfully!');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleResetProgress = async () => {
    try {
      setSaving(true);
      const response = await api.resetProgress();
      if (response.success) {
        setShowResetConfirm(false);
        alert('Learning progress reset successfully!');
        // Refresh user data
        fetchUserData();
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error resetting progress:', error);
      alert('Failed to reset progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      const response = await api.deleteAccount();
      if (response.success) {
        setShowDeleteConfirm(false);
        alert('Account deleted successfully!');
        logout();
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReminder = async () => {
    try {
      setSaving(true);
      const response = await api.sendGoalReminder();
      if (response.success) {
        alert('Goal reminder email sent successfully! Check your inbox.');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error sending reminder:', error);
      alert('Failed to send reminder. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-dark" style={{
        minHeight: '100vh',
        backgroundColor: pageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fontBody
      }}>
        <div>Loading settings...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="page-dark" style={{
        minHeight: '100vh',
        backgroundColor: pageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fontBody
      }}>
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: cardBg2,
          borderRadius: '20px',
          maxWidth: '500px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: cardText,
            marginBottom: '16px',
            fontFamily: fontHeading
          }}>
            Authentication Required
          </h2>
          <p style={{
            fontSize: '16px',
            color: cardMuted,
            marginBottom: '24px'
          }}>
            You need to be logged in to access your settings.
          </p>
          <button
            onClick={() => navigate('/signin')}
            style={{
              backgroundColor: marbleGold,
              color: marbleDarkGray,
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-dark" style={{
      minHeight: '100vh',
      backgroundColor: pageBg,
      fontFamily: fontBody
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: cardBg2,
        padding: isMobile ? '20px 16px' : '24px',
        borderBottom: `1px solid ${divider}`
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
              color: cardText,
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
            fontSize: isMobile ? '26px' : '32px',
            fontWeight: 'bold',
            color: cardText,
            fontFamily: fontHeading,
            marginBottom: '8px'
          }}>
            Settings
          </h1>

          <p style={{
            fontSize: isMobile ? '16px' : '18px',
            color: cardMuted,
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
        padding: isMobile ? '32px 16px' : '48px 24px'
      }}>
        {/* Settings Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? '1fr'
            : 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}>
          {/* Account Settings */}
          <div style={{
            backgroundColor: cardBg2,
            borderRadius: '20px',
            padding: isMobile ? '24px 20px' : '32px'
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
                  color: cardText,
                  fontFamily: fontHeading,
                  marginBottom: '4px'
                }}>
                  Account Settings
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: cardMuted
                }}>
                  Manage your profile information
                </p>
              </div>
            </div>
            
            <div style={{
              backgroundColor: cardBg,
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
                <span style={{ color: cardMuted }}>Name</span>
                <span style={{ color: cardText, fontWeight: '500' }}>
                  {userProfile?.name || 'Not set'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ color: cardMuted }}>Username</span>
                <span style={{ color: cardText, fontWeight: '500' }}>
                  @{userProfile?.username || 'Not set'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: cardMuted }}>Email</span>
                <span style={{ color: cardText, fontWeight: '500' }}>
                  {userProfile?.email || 'Not set'}
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => setShowEditProfile(true)}
              style={{
                backgroundColor: marbleDarkGray,
                color: cardText,
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Edit Profile
            </button>
          </div>

          {/* Learning Preferences */}
          <div style={{
            backgroundColor: cardBg2,
            borderRadius: '20px',
            padding: isMobile ? '24px 20px' : '32px'
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
                  color: cardText,
                  fontFamily: fontHeading,
                  marginBottom: '4px'
                }}>
                  Learning Preferences
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: cardMuted
                }}>
                  Customize your learning experience
                </p>
              </div>
            </div>
            
            <div style={{
              backgroundColor: cardBg,
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
                <span style={{ color: cardMuted }}>Daily Goal</span>
                <span style={{ color: cardText, fontWeight: '500' }}>
                  {learningPreferences.dailyGoal} lessons
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: cardMuted }}>Notifications</span>
                <span style={{ color: cardText, fontWeight: '500' }}>
                  {learningPreferences.notifications ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '16px'
            }}>
              <button
                onClick={() => setShowPreferences(true)}
                style={{
                  backgroundColor: marbleDarkGray,
                  color: cardText,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Customize Preferences
              </button>
              <button 
                onClick={handleSendReminder}
                disabled={saving}
                style={{
                  backgroundColor: marbleGold,
                  color: marbleDarkGray,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Sending...' : 'Send Reminder'}
              </button>
            </div>
          </div>

          {/* Privacy & Security */}
          <div style={{
            backgroundColor: cardBg2,
            borderRadius: '20px',
            padding: isMobile ? '24px 20px' : '32px'
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
                  color: cardText,
                  fontFamily: fontHeading,
                  marginBottom: '4px'
                }}>
                  Privacy & Security
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: cardMuted
                }}>
                  Manage your account security
                </p>
              </div>
            </div>
            
            <div style={{
              backgroundColor: cardBg,
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
                <span style={{ color: cardMuted }}>Two-Factor Auth</span>
                <span style={{
                  color: marbleGold,
                  fontWeight: '500',
                  fontSize: '13px',
                  border: `1px solid ${marbleGold}`,
                  borderRadius: '999px',
                  padding: '2px 10px'
                }}>
                  Coming soon
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ color: cardMuted }}>Last Login</span>
                <span style={{ color: cardText, fontWeight: '500' }}>
                  {userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: cardMuted }}>Account Created</span>
                <span style={{ color: cardText, fontWeight: '500' }}>
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div style={{
            backgroundColor: cardBg2,
            borderRadius: '20px',
            padding: isMobile ? '24px 20px' : '32px'
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
                  color: cardText,
                  fontFamily: fontHeading,
                  marginBottom: '4px'
                }}>
                  Data Management
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: cardMuted
                }}>
                  Manage your data and progress
                </p>
              </div>
            </div>
            
            <div style={{
              backgroundColor: cardBg,
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
                <span style={{ color: cardMuted }}>Export Data</span>
                <span style={{ color: cardText, fontWeight: '500' }}>Available</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ color: cardMuted }}>Delete Account</span>
                <span style={{ color: '#ef4444', fontWeight: '500' }}>Danger Zone</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: cardMuted }}>Reset Progress</span>
                <span style={{ color: '#f59e0b', fontWeight: '500' }}>Warning</span>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <button
                onClick={handleExportData}
                style={{
                  backgroundColor: marbleDarkGray,
                  color: cardText,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Export Data
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  backgroundColor: '#ef4444',
                  color: cardText,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Delete Account
              </button>
            </div>
            <button 
              onClick={() => setShowResetConfirm(true)}
              style={{
                backgroundColor: '#f59e0b',
                color: cardText,
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Reset Progress
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: cardBg,
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: cardText,
              marginBottom: '24px',
              fontFamily: fontHeading
            }}>
              Edit Profile
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: cardText,
                fontWeight: '500'
              }}>
                Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${cardBorder}`,
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: cardText,
                fontWeight: '500'
              }}>
                Username
              </label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${cardBorder}`,
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: cardText,
                fontWeight: '500'
              }}>
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${cardBorder}`,
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowEditProfile(false)}
                style={{
                  backgroundColor: gray,
                  color: cardText,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditProfile}
                disabled={saving}
                style={{
                  backgroundColor: marbleGold,
                  color: marbleDarkGray,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Learning Preferences Modal */}
      {showPreferences && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: cardBg,
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: cardText,
              marginBottom: '24px',
              fontFamily: fontHeading
            }}>
              Learning Preferences
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: cardText,
                fontWeight: '500'
              }}>
                Daily Goal (lessons)
              </label>
              <select
                aria-label="Daily goal in lessons"
                value={preferencesForm.dailyGoal}
                onChange={(e) => setPreferencesForm({...preferencesForm, dailyGoal: parseInt(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${cardBorder}`,
                  fontSize: '16px'
                }}
              >
                <option value={1}>1 lesson</option>
                <option value={2}>2 lessons</option>
                <option value={3}>3 lessons</option>
                <option value={5}>5 lessons</option>
                <option value={10}>10 lessons</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: cardText,
                fontWeight: '500'
              }}>
                Notifications
              </label>
              <select
                aria-label="Notifications enabled or disabled"
                value={preferencesForm.notifications.toString()}
                onChange={(e) => setPreferencesForm({...preferencesForm, notifications: e.target.value === 'true'})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${cardBorder}`,
                  fontSize: '16px'
                }}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowPreferences(false)}
                style={{
                  backgroundColor: gray,
                  color: cardText,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePreferences}
                disabled={saving}
                style={{
                  backgroundColor: marbleGold,
                  color: marbleDarkGray,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: cardBg,
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px'
            }}>
              ⚠️
            </div>
            
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: cardText,
              marginBottom: '16px',
              fontFamily: fontHeading
            }}>
              Delete Account
            </h3>
            
            <p style={{
              color: cardMuted,
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              This action cannot be undone. All your data, including learning progress, portfolio, and account information will be permanently deleted.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  backgroundColor: gray,
                  color: cardText,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={saving}
                style={{
                  backgroundColor: '#ef4444',
                  color: cardText,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Progress Confirmation Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: cardBg,
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#f59e0b',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '32px'
            }}>
              ⚠️
            </div>
            
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: cardText,
              marginBottom: '16px',
              fontFamily: fontHeading
            }}>
              Reset Learning Progress
            </h3>
            
            <p style={{
              color: cardMuted,
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              This will reset all your learning progress including XP, coins, completed lessons, and quiz scores. This action cannot be undone.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  backgroundColor: gray,
                  color: cardText,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetProgress}
                disabled={saving}
                style={{
                  backgroundColor: '#f59e0b',
                  color: cardText,
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Resetting...' : 'Reset Progress'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 