import React, { useState, useEffect } from 'react';
import './Profile.css';
import { api, isAuthenticated, getCurrentUser } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getLevelProgress } from '../data/lessonStructure';
import { fontHeading, fontBody } from '../fontPalette';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = '#F4F1E9';
const SURFACE = '#FFFFFF';
const BORDER  = 'rgba(230,200,122,0.18)';
const SHADOW  = '0 1px 2px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.06)';
const GOLD    = '#E6C87A';
const DARK    = '#222222';
const MUTED   = '#A0998A';

const BADGE_DEFS = [
  { id: 'first_lesson',  label: 'First Lesson',   desc: 'Completed first lesson',      cond: (d) => d.completedLessons?.length > 0,      icon: '◇' },
  { id: 'five_lessons',  label: 'Five Lessons',    desc: 'Completed 5 lessons',          cond: (d) => (d.completedLessons?.length || 0) >= 5, icon: '◆' },
  { id: 'ten_lessons',   label: 'Ten Lessons',     desc: 'Completed 10 lessons',         cond: (d) => (d.completedLessons?.length || 0) >= 10, icon: '◈' },
  { id: 'first_trade',   label: 'First Trade',     desc: 'Made first paper trade',       cond: (_, t) => t?.length > 0,                      icon: '▲' },
  { id: 'five_trades',   label: 'Active Trader',   desc: '5+ trades completed',          cond: (_, t) => (t?.length || 0) >= 5,               icon: '▲▲' },
  { id: 'hundred_xp',   label: '100 XP',          desc: 'Earned 100 XP',               cond: (d) => (d.xp || 0) >= 100,                     icon: '★' },
  { id: 'five_hundred_xp', label: '500 XP',       desc: 'Earned 500 XP',               cond: (d) => (d.xp || 0) >= 500,                     icon: '★★' },
  { id: 'thousand_xp',  label: '1 000 XP',        desc: 'Earned 1 000 XP',             cond: (d) => (d.xp || 0) >= 1000,                    icon: '✦' },
];

function computeBadges(learningProgress, transactions) {
  return BADGE_DEFS.map(b => ({
    ...b,
    earned: b.cond(learningProgress || {}, transactions || []),
  }));
}

// ─── Tier bar (precious-metal visual) ────────────────────────────────────────
function TierBar({ tier }) {
  const isGold = tier === 'gold';
  return (
    <div className={`tier-bar tier-bar-${tier}`}>
      <div className="tier-bar-shine" />
      <div className="tier-bar-content">
        <span className="tier-bar-label">{isGold ? 'gold' : 'silver'}</span>
        <span className="tier-bar-sublabel">{isGold ? 'premium member' : 'standard member'}</span>
      </div>
      <div className="tier-bar-grooves">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="tier-groove" />)}
      </div>
    </div>
  );
}

// ─── XP progress bar ─────────────────────────────────────────────────────────
function ProfileXPBar({ xp }) {
  const levelInfo = getLevelProgress(xp);
  const pct = Math.min((levelInfo.xpIntoLevel / levelInfo.xpNeeded) * 100, 100);
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontFamily: fontBody, fontSize: '12px', color: MUTED }}>level {levelInfo.currentLevel}</span>
        <span style={{ fontFamily: fontBody, fontSize: '12px', color: MUTED }}>{levelInfo.xpIntoLevel} / {levelInfo.xpNeeded} xp</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD} 0%, #F0D586 100%)`, borderRadius: '2px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ─── Badge wall ──────────────────────────────────────────────────────────────
function BadgeWall({ badges }) {
  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);
  return (
    <div>
      {earned.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>earned</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {earned.map(b => (
              <div key={b.id} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '12px 14px', borderRadius: '12px',
                background: 'rgba(230,200,122,0.10)',
                border: `1px solid rgba(230,200,122,0.35)`,
                minWidth: '72px',
              }}>
                <span style={{ fontSize: '18px', color: GOLD, marginBottom: '4px', fontFamily: 'serif' }}>{b.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: '600', color: DARK, textAlign: 'center', lineHeight: '1.3' }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {locked.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>locked</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {locked.map(b => (
              <div key={b.id} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '12px 14px', borderRadius: '12px',
                background: 'rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.06)',
                minWidth: '72px',
                opacity: 0.5,
              }}>
                <span style={{ fontSize: '18px', color: MUTED, marginBottom: '4px', fontFamily: 'serif' }}>{b.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: '600', color: MUTED, textAlign: 'center', lineHeight: '1.3' }}>{b.label}</span>
                <span style={{ fontSize: '9px', color: MUTED, textAlign: 'center', lineHeight: '1.3', marginTop: '2px' }}>{b.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Profile ─────────────────────────────────────────────────────────────
function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/signin'); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, portfolioRes, userRes] = await Promise.all([
        api.getProfile().catch(() => ({ success: false })),
        api.getPortfolio().catch(() => ({ success: false })),
        api.getUserData().catch(() => ({ success: false })),
      ]);
      if (profileRes.success)   setUserProfile(profileRes.user);
      if (portfolioRes.success) setPortfolio(portfolioRes.portfolio);
      if (userRes.success)      setUserData(userRes);
    } catch (e) {
      console.error('Error fetching profile data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => n == null ? '$0.00' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: '14px', fontFamily: fontBody }}>
        loading…
      </div>
    );
  }

  const currentUser   = getCurrentUser();
  const profile       = userProfile || currentUser;
  const username      = profile?.username || currentUser?.username || 'user';
  const name          = profile?.name || currentUser?.username || 'User';
  const email         = profile?.email || currentUser?.email || '';
  const picture       = profile?.picture || null;
  const joinedYear    = profile?.createdAt ? new Date(profile.createdAt).getFullYear() : new Date().getFullYear();

  const totalValue  = portfolio?.totalValue || portfolio?.balance || 0;
  const cash        = portfolio?.balance || 0;
  const holdings    = portfolio?.positions?.reduce((s, p) => s + p.shares * (p.currentPrice || p.avgPrice || 0), 0) || 0;

  const avatarUrl   = picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=333&color=fff&size=128`;
  const xp          = userData?.learningProgress?.xp || 0;
  const coins       = userData?.learningProgress?.coins || 0;
  const transactions = userData?.transactions || [];
  const tier        = xp >= 1000 ? 'gold' : 'silver';
  const badges      = computeBadges(userData?.learningProgress, transactions);

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px', fontFamily: fontBody }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Back */}
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: MUTED, fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', padding: '0' }}>
          ← Dashboard
        </button>

        {/* Tier bar */}
        <TierBar tier={tier} />

        {/* Identity card */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '16px', boxShadow: SHADOW, padding: '28px', marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <img src={avatarUrl} alt="avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GOLD}`, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: fontHeading, fontSize: '22px', fontWeight: '400', color: DARK, marginBottom: '2px', letterSpacing: '-0.01em' }}>{name}</h2>
            <div style={{ fontSize: '13px', color: MUTED }}>@{username} · joined {joinedYear}</div>
            {email && <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px' }}>{email}</div>}
          </div>
          <button onClick={() => navigate('/settings')} style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', color: DARK, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Edit profile
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '16px' }}>
          {[
            { label: 'total in tickr', value: fmt(totalValue) },
            { label: 'holdings',       value: fmt(holdings) },
            { label: 'cash',           value: fmt(cash) },
          ].map((s, i) => (
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px', boxShadow: SHADOW }}>
              <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>{s.label}</div>
              <div style={{ fontFamily: fontHeading, fontSize: '18px', fontWeight: '400', color: DARK, letterSpacing: '-0.01em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* XP / level */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '16px', boxShadow: SHADOW, padding: '24px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: '600' }}>progress</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: GOLD, fontWeight: '700' }}>{xp} XP</span>
              <span style={{ fontSize: '12px', color: MUTED }}>·</span>
              <span style={{ fontSize: '12px', color: MUTED }}>{coins} coins</span>
            </div>
          </div>
          <ProfileXPBar xp={xp} />
        </div>

        {/* Badge wall */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '16px', boxShadow: SHADOW, padding: '24px', marginTop: '16px' }}>
          <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: '600', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>badges</div>
          <BadgeWall badges={badges} />
        </div>

        {/* Portfolio allocation */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '16px', boxShadow: SHADOW, padding: '24px', marginTop: '16px', marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: '600', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>allocation</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Stocks', pct: totalValue > 0 ? Math.round((holdings / totalValue) * 100) : 0, active: true },
              { label: 'ETFs',   pct: 0 },
              { label: 'Options', pct: 0 },
              { label: 'Crypto', pct: 0 },
            ].map((a, i) => (
              <div key={i} style={{
                padding: '14px 18px',
                borderRadius: '12px',
                background: a.active && a.pct > 0 ? 'rgba(230,200,122,0.10)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${a.active && a.pct > 0 ? 'rgba(230,200,122,0.3)' : 'rgba(0,0,0,0.06)'}`,
                textAlign: 'center',
                minWidth: '80px',
              }}>
                <div style={{ fontFamily: fontHeading, fontSize: '18px', fontWeight: '400', color: a.active && a.pct > 0 ? GOLD : MUTED }}>{a.pct}%</div>
                <div style={{ fontSize: '11px', color: MUTED, marginTop: '2px' }}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Profile;
