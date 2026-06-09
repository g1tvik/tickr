import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, logout } from '../services/api';
import { useSEO } from '../lib/seo';
import tk, { label, mono, panel, inset, heading, btnPrimary, btnGhost, tag } from '../theme/terminal';
import Icon from '../components/Icon';

const Settings = () => {
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

  // ── Shared inline style fragments (Terminal Editorial) ────────────────────
  const dataRow = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '11px 0',
    borderBottom: `1px solid ${tk.hair}`,
    gap: 16
  };
  const valueText = { fontSize: 13, color: tk.text, fontWeight: 500, textAlign: 'right' };
  const fieldInput = {
    ...inset,
    width: '100%',
    padding: '11px 14px',
    color: tk.text,
    fontFamily: tk.fontBody,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box'
  };
  const fieldLabel = { ...label, display: 'block', marginBottom: 8 };
  const overlay = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16
  };
  const modalCard = {
    ...panel,
    padding: isMobile ? '24px 20px' : '28px',
    maxWidth: 480,
    width: '100%',
    boxShadow: '0 24px 60px rgba(0,0,0,0.45)'
  };

  if (loading) {
    return (
      <div className="page-dark" style={{
        minHeight: '100vh',
        backgroundColor: tk.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: tk.fontBody
      }}>
        <div style={{ ...mono, fontSize: 13, color: tk.muted }}>Loading settings...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="page-dark" style={{
        minHeight: '100vh',
        backgroundColor: tk.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: tk.fontBody,
        padding: 16
      }}>
        <div style={{
          ...panel,
          textAlign: 'center',
          padding: '40px 32px',
          maxWidth: 460,
          width: '100%'
        }}>
          <div style={{
            width: 44,
            height: 44,
            margin: '0 auto 16px',
            border: `1px solid ${tk.goldHair}`,
            borderRadius: tk.rSm,
            display: 'grid',
            placeItems: 'center',
            color: tk.gold
          }}>
            <Icon name="lock" size={18} />
          </div>
          <h2 style={{
            ...heading,
            fontSize: 22,
            marginBottom: 10
          }}>
            Authentication Required
          </h2>
          <p style={{
            fontSize: 14,
            color: tk.muted,
            marginBottom: 22,
            lineHeight: 1.5
          }}>
            You need to be logged in to access your settings.
          </p>
          <button
            onClick={() => navigate('/signin')}
            style={{ ...btnPrimary, padding: '11px 22px', fontSize: 14 }}
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
      backgroundColor: tk.bg,
      fontFamily: tk.fontBody,
      color: tk.text
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: tk.surface,
        padding: isMobile ? '20px 16px' : '24px',
        borderBottom: `1px solid ${tk.hair}`
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto'
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: tk.muted,
              fontFamily: tk.fontBody,
              fontSize: 13,
              cursor: 'pointer',
              marginBottom: 18,
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Icon name="arrow-left" size={14} /> Back to Dashboard
          </button>

          <h1 style={{
            ...heading,
            fontSize: isMobile ? 26 : 30,
            marginBottom: 6
          }}>
            Settings
          </h1>

          <p style={{
            fontSize: 14,
            color: tk.muted,
            margin: 0
          }}>
            Manage your account preferences and settings
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: isMobile ? '28px 16px' : '40px 24px'
      }}>
        {/* Settings — editorial sections in one flat statement panel */}
        <div style={{ ...panel, maxWidth: 720, padding: isMobile ? '24px 20px' : '30px 32px' }}>
          {/* Account */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Icon name="user" size={15} color={tk.gold} />
            <span style={label}>account</span>
            <span style={{ flex: 1, height: 1, background: tk.hair }} />
          </div>

          <div style={{ marginBottom: 18 }}>
              <div style={dataRow}>
                <span style={label}>Name</span>
                <span style={valueText}>
                  {userProfile?.name || 'Not set'}
                </span>
              </div>
              <div style={dataRow}>
                <span style={label}>Username</span>
                <span style={{ ...valueText, ...mono }}>
                  @{userProfile?.username || 'Not set'}
                </span>
              </div>
              <div style={dataRow}>
                <span style={label}>Email</span>
                <span style={valueText}>
                  {userProfile?.email || 'Not set'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowEditProfile(true)}
              style={{
                ...btnGhost,
                width: '100%',
                padding: '10px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Icon name="edit" size={14} /> Edit Profile
            </button>
          {/* Learning Preferences */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: isMobile ? 28 : 34, marginBottom: 14 }}>
            <Icon name="book" size={15} color={tk.gold} />
            <span style={label}>learning preferences</span>
            <span style={{ flex: 1, height: 1, background: tk.hair }} />
          </div>

          <div style={{ marginBottom: 18 }}>
              <div style={dataRow}>
                <span style={label}>Daily Goal</span>
                <span style={valueText}>
                  <span style={mono}>{learningPreferences.dailyGoal}</span> lessons
                </span>
              </div>
              <div style={dataRow}>
                <span style={label}>Notifications</span>
                {learningPreferences.notifications ? (
                  <span style={{ ...tag, color: tk.up, borderColor: 'rgba(79,180,119,0.4)' }}>Enabled</span>
                ) : (
                  <span style={{ ...tag, color: tk.muted, borderColor: tk.hairStrong }}>Disabled</span>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <button
                onClick={() => setShowPreferences(true)}
                style={{
                  ...btnGhost,
                  flex: 1,
                  padding: '10px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Icon name="settings" size={14} /> Customize Preferences
              </button>
              <button
                onClick={handleSendReminder}
                disabled={saving}
                style={{
                  ...btnPrimary,
                  padding: '11px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Sending...' : (<><Icon name="mail" size={14} /> Send Reminder</>)}
              </button>
            </div>
          {/* Privacy & Security */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: isMobile ? 28 : 34, marginBottom: 14 }}>
            <Icon name="lock" size={15} color={tk.gold} />
            <span style={label}>privacy & security</span>
            <span style={{ flex: 1, height: 1, background: tk.hair }} />
          </div>

          <div>
              <div style={dataRow}>
                <span style={label}>Two-Factor Auth</span>
                <span style={{ ...tag, color: tk.muted, borderColor: tk.hairStrong }}>Coming soon</span>
              </div>
              <div style={dataRow}>
                <span style={label}>Last Login</span>
                <span style={{ ...valueText, ...mono }}>
                  {userProfile?.lastLogin ? new Date(userProfile.lastLogin).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div style={{ ...dataRow, borderBottom: 'none' }}>
                <span style={label}>Account Created</span>
                <span style={{ ...valueText, ...mono }}>
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          {/* Data Management */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: isMobile ? 28 : 34, marginBottom: 14 }}>
            <Icon name="download" size={15} color={tk.gold} />
            <span style={label}>data management</span>
            <span style={{ flex: 1, height: 1, background: tk.hair }} />
          </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 12
            }}>
              <button
                onClick={handleExportData}
                style={{
                  ...btnGhost,
                  flex: 1,
                  padding: '10px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Icon name="download" size={14} /> Export Data
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  ...btnGhost,
                  flex: 1,
                  padding: '10px 16px',
                  color: tk.down,
                  borderColor: 'rgba(224,96,90,0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Icon name="trash" size={14} /> Delete Account
              </button>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{
                ...btnGhost,
                width: '100%',
                padding: '10px 16px',
                color: tk.warn,
                borderColor: 'rgba(217,164,65,0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Icon name="refresh" size={14} /> Reset Progress
            </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div style={overlay}>
          <div style={modalCard}>
            <h3 style={{
              ...heading,
              fontSize: 20,
              marginBottom: 4
            }}>
              Edit Profile
            </h3>
            <div style={{ height: 1, background: tk.hair, margin: '14px 0 20px' }} />

            <div style={{ marginBottom: 16 }}>
              <label style={fieldLabel}>
                Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                style={fieldInput}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={fieldLabel}>
                Username
              </label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                style={fieldInput}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={fieldLabel}>
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                style={fieldInput}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowEditProfile(false)}
                style={{ ...btnGhost, padding: '10px 18px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditProfile}
                disabled={saving}
                style={{
                  ...btnPrimary,
                  padding: '10px 18px',
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
        <div style={overlay}>
          <div style={modalCard}>
            <h3 style={{
              ...heading,
              fontSize: 20,
              marginBottom: 4
            }}>
              Learning Preferences
            </h3>
            <div style={{ height: 1, background: tk.hair, margin: '14px 0 20px' }} />

            <div style={{ marginBottom: 16 }}>
              <label style={fieldLabel}>
                Daily Goal (lessons)
              </label>
              <select
                aria-label="Daily goal in lessons"
                value={preferencesForm.dailyGoal}
                onChange={(e) => setPreferencesForm({...preferencesForm, dailyGoal: parseInt(e.target.value)})}
                style={fieldInput}
              >
                <option value={1}>1 lesson</option>
                <option value={2}>2 lessons</option>
                <option value={3}>3 lessons</option>
                <option value={5}>5 lessons</option>
                <option value={10}>10 lessons</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={fieldLabel}>
                Notifications
              </label>
              <select
                aria-label="Notifications enabled or disabled"
                value={preferencesForm.notifications.toString()}
                onChange={(e) => setPreferencesForm({...preferencesForm, notifications: e.target.value === 'true'})}
                style={fieldInput}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowPreferences(false)}
                style={{ ...btnGhost, padding: '10px 18px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePreferences}
                disabled={saving}
                style={{
                  ...btnPrimary,
                  padding: '10px 18px',
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
        <div style={overlay}>
          <div style={{ ...modalCard, textAlign: 'center' }}>
            <div style={{
              width: 48,
              height: 48,
              border: '1px solid rgba(224,96,90,0.4)',
              borderRadius: tk.rSm,
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 18px',
              color: tk.down
            }}>
              <Icon name="alert" size={20} />
            </div>

            <h3 style={{
              ...heading,
              fontSize: 20,
              marginBottom: 12
            }}>
              Delete Account
            </h3>

            <p style={{
              color: tk.muted,
              fontSize: 14,
              lineHeight: 1.5,
              marginBottom: 24
            }}>
              This action cannot be undone. All your data, including learning progress, portfolio, and account information will be permanently deleted.
            </p>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ ...btnGhost, padding: '10px 18px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={saving}
                style={{
                  ...btnPrimary,
                  background: tk.down,
                  color: tk.text,
                  padding: '10px 18px',
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
        <div style={overlay}>
          <div style={{ ...modalCard, textAlign: 'center' }}>
            <div style={{
              width: 48,
              height: 48,
              border: '1px solid rgba(217,164,65,0.4)',
              borderRadius: tk.rSm,
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 18px',
              color: tk.warn
            }}>
              <Icon name="alert" size={20} />
            </div>

            <h3 style={{
              ...heading,
              fontSize: 20,
              marginBottom: 12
            }}>
              Reset Learning Progress
            </h3>

            <p style={{
              color: tk.muted,
              fontSize: 14,
              lineHeight: 1.5,
              marginBottom: 24
            }}>
              This will reset all your learning progress including XP, coins, completed lessons, and quiz scores. This action cannot be undone.
            </p>

            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{ ...btnGhost, padding: '10px 18px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetProgress}
                disabled={saving}
                style={{
                  ...btnPrimary,
                  background: tk.warn,
                  color: '#1F1F1F',
                  padding: '10px 18px',
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
