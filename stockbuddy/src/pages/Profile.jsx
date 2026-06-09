import React, { useState, useEffect } from 'react';
import './Profile.css';
import { api, isAuthenticated, getCurrentUser } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getLevelProgress } from '../data/lessonStructure';
import { fontHeading, fontBody } from '../fontPalette';
import AppImage from '../components/AppImage';
import { useSEO } from '../lib/seo';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG      = '#2C2C2C';
const SURFACE = '#343434';
const BORDER  = 'rgba(182,156,96,0.22)';
const SHADOW  = '0 8px 24px rgba(0,0,0,0.28)';
const GOLD    = '#E6C87A';
const DARK    = '#F4F1E9';
const MUTED   = '#b8b4a8';

// A muted-gold palette of allocation slice colours, used in order of weight.
const ALLOC_COLORS = ['#B69C60', '#C8AE76', '#D8C397', '#A0998A'];

// ─── Badge definitions ─────────────────────────────────────────────────────────
// Every condition reflects a GENUINE achievement the user has actually completed —
// lessons finished, real buy/sell trades made, XP earned, or a real login streak.
// We never award badges for mere attempts.
const BADGE_DEFS = [
  { id: 'first_lesson',    label: 'First Lesson',  desc: 'Complete your first lesson',  icon: '◇', earned: (s) => s.lessonsCompleted >= 1 },
  { id: 'five_lessons',    label: 'Five Lessons',  desc: 'Complete 5 lessons',          icon: '◆', earned: (s) => s.lessonsCompleted >= 5 },
  { id: 'ten_lessons',     label: 'Ten Lessons',   desc: 'Complete 10 lessons',         icon: '◈', earned: (s) => s.lessonsCompleted >= 10 },
  { id: 'first_trade',     label: 'First Trade',   desc: 'Make your first paper trade', icon: '▲', earned: (s) => s.tradesMade >= 1 },
  { id: 'five_trades',     label: 'Active Trader', desc: 'Make 5 paper trades',         icon: '▲▲', earned: (s) => s.tradesMade >= 5 },
  { id: 'week_streak',     label: 'On a Roll',     desc: 'Reach a 7-day streak',        icon: '✶', earned: (s) => s.streak >= 7 },
  { id: 'hundred_xp',      label: '100 XP',        desc: 'Earn 100 XP',                 icon: '★', earned: (s) => s.xp >= 100 },
  { id: 'five_hundred_xp', label: '500 XP',        desc: 'Earn 500 XP',                 icon: '★★', earned: (s) => s.xp >= 500 },
  { id: 'thousand_xp',     label: '1 000 XP',      desc: 'Earn 1 000 XP',               icon: '✦', earned: (s) => s.xp >= 1000 },
];

// Build the real achievement snapshot the badges are evaluated against.
function buildAchievementStats(learningProgress, transactions) {
  const lp = learningProgress || {};
  const completed = Array.isArray(lp.completedLessons) ? lp.completedLessons : [];
  // Only genuine buy/sell trades count — not every transaction record.
  const trades = (Array.isArray(transactions) ? transactions : []).filter(
    (t) => t && (t.type === 'buy' || t.type === 'sell')
  );
  const streak = Number(lp.currentStreak ?? lp.streak ?? 0) || 0;
  return {
    lessonsCompleted: completed.length,
    tradesMade: trades.length,
    streak,
    xp: Number(lp.xp || 0),
  };
}

function computeBadges(learningProgress, transactions) {
  const stats = buildAchievementStats(learningProgress, transactions);
  // A streak badge is only meaningful when we actually track a streak; if the
  // backend never sends one, hide it rather than show it permanently locked.
  return BADGE_DEFS
    .filter((b) => !(b.id === 'week_streak' && !(stats.streak > 0)))
    .map((b) => ({ ...b, earned: b.earned(stats) }));
}

// Compute real portfolio allocation from actual positions + cash.
function computeAllocation(portfolio) {
  const positions = Array.isArray(portfolio?.positions) ? portfolio.positions : [];
  const cash = Number(portfolio?.balance || 0);

  const positionSlices = positions
    .map((p) => {
      const price = Number(p.currentPrice ?? p.avgPrice ?? 0);
      const value = Number(p.shares || 0) * price;
      return { label: p.symbol || '—', value };
    })
    .filter((s) => s.value > 0);

  const holdingsValue = positionSlices.reduce((sum, s) => sum + s.value, 0);
  const total = holdingsValue + cash;

  if (total <= 0) return { slices: [], total: 0, hasPositions: false };

  const slices = [...positionSlices].sort((a, b) => b.value - a.value);
  if (cash > 0) slices.push({ label: 'Cash', value: cash, isCash: true });

  const withPct = slices.map((s, i) => ({
    ...s,
    pct: Math.round((s.value / total) * 100),
    color: s.isCash ? MUTED : ALLOC_COLORS[Math.min(i, ALLOC_COLORS.length - 1)],
  }));

  return { slices: withPct, total, hasPositions: positionSlices.length > 0 };
}

// ─── Reusable: section card ────────────────────────────────────────────────────
function SectionCard({ children, style }) {
  return (
    <div
      className="profile-card"
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: '16px',
        boxShadow: SHADOW,
        padding: '24px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Demo-data pill ─────────────────────────────────────────────────────────────
function DemoPill() {
  return (
    <span
      title="Showing sample market data because live market keys aren't configured."
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 9px',
        borderRadius: '999px',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: '#E6C87A',
        background: 'rgba(182,156,96,0.12)',
        border: '1px solid rgba(182,156,96,0.35)',
      }}
    >
      <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: '#B69C60' }} />
      Demo data
    </span>
  );
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
      <div
        role="progressbar"
        aria-label={`Level ${levelInfo.currentLevel} progress`}
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ height: '4px', background: 'rgba(244,241,233,0.08)', borderRadius: '2px', overflow: 'hidden' }}
      >
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
      {earned.length === 0 && (
        <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5 }}>
          No badges yet — complete a lesson or make your first trade to start earning them.
        </div>
      )}
      {earned.length > 0 && (
        <div style={{ marginBottom: locked.length > 0 ? '16px' : 0 }}>
          <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>earned</div>
          <div className="badge-grid">
            {earned.map(b => (
              <div key={b.id} className="badge-chip badge-chip-earned" title={b.desc}>
                <span aria-hidden="true" style={{ fontSize: '18px', color: GOLD, marginBottom: '4px', fontFamily: 'serif' }}>{b.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: '600', color: DARK, textAlign: 'center', lineHeight: '1.3' }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {locked.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>locked</div>
          <div className="badge-grid">
            {locked.map(b => (
              <div key={b.id} className="badge-chip badge-chip-locked" title={`Locked — ${b.desc}`}>
                <span aria-hidden="true" style={{ fontSize: '18px', color: MUTED, marginBottom: '4px', fontFamily: 'serif' }}>{b.icon}</span>
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

// ─── Allocation section ────────────────────────────────────────────────────────
function AllocationSection({ allocation }) {
  if (!allocation.hasPositions) {
    return (
      <div style={{ fontSize: '13px', color: MUTED, lineHeight: 1.5 }}>
        You don't hold any positions yet. Buy a stock in the simulator to see how your
        portfolio is allocated.
      </div>
    );
  }

  return (
    <div>
      {/* Stacked allocation bar */}
      <div
        role="img"
        aria-label={
          'Portfolio allocation: ' +
          allocation.slices.map((s) => `${s.label} ${s.pct} percent`).join(', ')
        }
        style={{ display: 'flex', height: '10px', borderRadius: '999px', overflow: 'hidden', marginBottom: '16px', background: 'rgba(244,241,233,0.08)' }}
      >
        {allocation.slices.map((s, i) => (
          <div key={i} style={{ width: `${s.pct}%`, background: s.color }} />
        ))}
      </div>

      <div className="alloc-grid">
        {allocation.slices.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#2f2f2f',
              border: '1px solid rgba(182,156,96,0.22)',
            }}
          >
            <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '3px', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: DARK, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
            <span style={{ fontFamily: fontHeading, fontSize: '15px', color: s.isCash ? MUTED : DARK }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Profile ─────────────────────────────────────────────────────────────
function Profile() {
  const navigate = useNavigate();
  useSEO({ title: 'Profile' });

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
      if (import.meta.env.DEV) console.error('Error fetching profile data:', e);
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
  const isDemo      = portfolio?.demo === true || portfolio?.source === 'demo';

  // Avatar: prefer the user's own picture, then a dropped-in /images/avatar.png,
  // and finally a graceful initials placeholder rendered by AppImage.
  const initials = (name || username || 'U')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const avatarSrc = picture || '/images/avatar.png';

  const xp           = userData?.learningProgress?.xp || 0;
  const coins        = userData?.learningProgress?.coins || 0;
  const transactions = userData?.transactions || [];
  const tier         = xp >= 1000 ? 'gold' : 'silver';
  const badges       = computeBadges(userData?.learningProgress, transactions);
  const allocation   = computeAllocation(portfolio);

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px', fontFamily: fontBody }}>
      <div className="profile-shell" style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Back */}
        <button onClick={() => navigate('/dashboard')} aria-label="Back to dashboard" style={{ background: 'none', border: 'none', color: MUTED, fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', padding: '0' }}>
          ← Dashboard
        </button>

        {/* Tier bar */}
        <TierBar tier={tier} />

        {/* Identity card */}
        <div className="profile-identity" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '16px', boxShadow: SHADOW, padding: '28px', marginTop: '20px' }}>
          <div className="profile-avatar" aria-hidden={false}>
            <AppImage
              src={avatarSrc}
              alt={`${name}'s avatar`}
              ratio="1"
              rounded="50%"
              label={initials}
              style={{ width: '64px', height: '64px', border: `2px solid ${GOLD}` }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: fontHeading, fontSize: '22px', fontWeight: '400', color: DARK, marginBottom: '2px', letterSpacing: '-0.01em' }}>{name}</h1>
            <div style={{ fontSize: '13px', color: MUTED }}>@{username} · joined {joinedYear}</div>
            {email && <div style={{ fontSize: '12px', color: MUTED, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>}
          </div>
          <button onClick={() => navigate('/settings')} className="profile-edit-btn" style={{ background: 'rgba(244,241,233,0.06)', border: '1px solid rgba(182,156,96,0.22)', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', color: DARK, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Edit profile
          </button>
        </div>

        {/* Stats row */}
        <div className="profile-stats" style={{ marginTop: '16px' }}>
          {[
            { label: 'total in tickr', value: fmt(totalValue) },
            { label: 'holdings',       value: fmt(holdings) },
            { label: 'cash',           value: fmt(cash) },
          ].map((s, i) => (
            <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '14px', padding: '18px', boxShadow: SHADOW }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</span>
                {isDemo && i === 0 && <DemoPill />}
              </div>
              <div style={{ fontFamily: fontHeading, fontSize: '18px', fontWeight: '400', color: DARK, letterSpacing: '-0.01em' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* XP / level */}
        <SectionCard style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: '600' }}>progress</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: GOLD, fontWeight: '700' }}>{xp} XP</span>
              <span style={{ fontSize: '12px', color: MUTED }}>·</span>
              <span style={{ fontSize: '12px', color: MUTED }}>{coins} coins</span>
            </div>
          </div>
          <ProfileXPBar xp={xp} />
        </SectionCard>

        {/* Badge wall */}
        <SectionCard style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: '600', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(244,241,233,0.12)' }}>badges</div>
          <BadgeWall badges={badges} />
        </SectionCard>

        {/* Portfolio allocation */}
        <SectionCard style={{ marginTop: '16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(244,241,233,0.12)' }}>
            <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: '600' }}>allocation</div>
            {isDemo && allocation.hasPositions && <DemoPill />}
          </div>
          <AllocationSection allocation={allocation} />
        </SectionCard>

      </div>
    </div>
  );
}

export default Profile;
