import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getCurrentUser, logout } from '../services/api';
import { marbleWhite, marbleLightGray, marbleGray, marbleDarkGray, marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';

const Settings = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [learningPreferences, setLearningPreferences] = useState({
    dailyGoal: 3,
    notifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
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
      console.log('❌ No authentication token found');
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    
    console.log('✅ User is authenticated, fetching data...');
    setIsAuthenticated(true);
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching user data...');
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      console.log('🔍 Token exists:', !!token);
      console.log('🔍 Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
      
      // Test the API endpoint directly
      console.log('🔍 API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:5001/api');
      
      const [profileResponse, preferencesResponse] = await Promise.all([
        api.getProfile().catch(err => {
          console.error('❌ Profile API error:', err);
          return { success: false, error: err.message };
        }),
        api.getLearningPreferences().catch(err => {
          console.error('❌ Preferences API error:', err);
          return { success: false, error: err.message };
        })
      ]);
      
      console.log('🔍 Profile response:', profileResponse);
      console.log('🔍 Preferences response:', preferencesResponse);
      
      if (profileResponse.success) {
        setUserProfile(profileResponse.user);
        setEditForm({
          name: profileResponse.user.name || '',
          username: profileResponse.user.username || '',
          email: profileResponse.user.email || ''
        });
      } else {
        console.error('❌ Profile API failed:', profileResponse.error);
      }
      
      if (preferencesResponse.success) {
        setLearningPreferences(preferencesResponse.preferences);
        setPreferencesForm(preferencesResponse.preferences);
      } else {
        console.error('❌ Preferences API failed:', preferencesResponse.error);
      }
    } catch (err) {
      console.error('❌ Error fetching user data:', err);
      console.error('❌ Error details:', err.message);
      console.error('❌ Error stack:', err.stack);
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
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      setSaving(true);
      const response = await api.updateLearningPreferences(preferencesForm);
      if (response.success) {
        setLearningPreferences(response.preferences);
        // Update the form with the new values
        setPreferencesForm(response.preferences);
        setShowPreferences(false);
        alert('Learning preferences updated successfully!');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
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
      console.error('Error exporting data:', error);
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
      console.error('Error resetting progress:', error);
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
      console.error('Error deleting account:', error);
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
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder. Please try again.');
    } finally {
      setSaving(false);
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

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: marbleWhite,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fontBody
      }}>
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: marbleLightGray,
          borderRadius: '20px',
          maxWidth: '500px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: marbleDarkGray,
            marginBottom: '16px',
            fontFamily: fontHeading
          }}>
            Authentication Required
          </h2>
          <p style={{
            fontSize: '16px',
            color: marbleGray,
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
            
            <button 
              onClick={() => setShowEditProfile(true)}
              style={{
                backgroundColor: marbleDarkGray,
                color: marbleWhite,
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
                <span style={{ color: marbleDarkGray, fontWeight: '500' }}>
                  {learningPreferences.dailyGoal} lessons
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ color: marbleGray }}>Notifications</span>
                <span style={{ color: marbleDarkGray, fontWeight: '500' }}>
                  {learningPreferences.notifications ? 'Enabled' : 'Disabled'}
                </span>
              </div>

            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '16px'
            }}>
              <button 
                onClick={() => setShowPreferences(true)}
                style={{
                  backgroundColor: marbleDarkGray,
                  color: marbleWhite,
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
            
            <button 
              onClick={() => setShowSecurity(true)}
              style={{
                backgroundColor: marbleDarkGray,
                color: marbleWhite,
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%'
              }}
            >
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
              gap: '12px',
              marginBottom: '12px'
            }}>
              <button 
                onClick={handleExportData}
                style={{
                  backgroundColor: marbleDarkGray,
                  color: marbleWhite,
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
                  color: marbleWhite,
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
                color: marbleWhite,
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
            backgroundColor: marbleWhite,
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '24px',
              fontFamily: fontHeading
            }}>
              Edit Profile
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: marbleDarkGray,
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
                  border: `1px solid ${marbleGray}`,
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: marbleDarkGray,
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
                  border: `1px solid ${marbleGray}`,
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: marbleDarkGray,
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
                  border: `1px solid ${marbleGray}`,
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
                  backgroundColor: marbleGray,
                  color: marbleWhite,
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
            backgroundColor: marbleWhite,
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '24px',
              fontFamily: fontHeading
            }}>
              Learning Preferences
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: marbleDarkGray,
                fontWeight: '500'
              }}>
                Daily Goal (lessons)
              </label>
              <select
                value={preferencesForm.dailyGoal}
                onChange={(e) => setPreferencesForm({...preferencesForm, dailyGoal: parseInt(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${marbleGray}`,
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
                color: marbleDarkGray,
                fontWeight: '500'
              }}>
                Notifications
              </label>
              <select
                value={preferencesForm.notifications.toString()}
                onChange={(e) => setPreferencesForm({...preferencesForm, notifications: e.target.value === 'true'})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${marbleGray}`,
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
                  backgroundColor: marbleGray,
                  color: marbleWhite,
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

      {/* Security Settings Modal */}
      {showSecurity && (
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
            backgroundColor: marbleWhite,
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: marbleDarkGray,
              marginBottom: '24px',
              fontFamily: fontHeading
            }}>
              Security Settings
            </h3>
            
            <div style={{
              backgroundColor: marbleLightGray,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <p style={{
                color: marbleGray,
                fontSize: '16px',
                lineHeight: '1.5'
              }}>
                Two-factor authentication is not yet implemented. This feature will be available in a future update.
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowSecurity(false)}
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
                Close
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
            backgroundColor: marbleWhite,
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
              color: marbleDarkGray,
              marginBottom: '16px',
              fontFamily: fontHeading
            }}>
              Delete Account
            </h3>
            
            <p style={{
              color: marbleGray,
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
                  backgroundColor: marbleGray,
                  color: marbleWhite,
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
                  color: marbleWhite,
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
            backgroundColor: marbleWhite,
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
              color: marbleDarkGray,
              marginBottom: '16px',
              fontFamily: fontHeading
            }}>
              Reset Learning Progress
            </h3>
            
            <p style={{
              color: marbleGray,
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
                  backgroundColor: marbleGray,
                  color: marbleWhite,
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
                  color: marbleWhite,
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