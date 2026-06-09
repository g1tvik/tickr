import React, { useState, useEffect } from "react";
import "../globals.css";
import { useNavigate } from "react-router-dom";
import { fontHeading, fontBody } from '../fontPalette';
import { api, isAuthenticated, getCurrentUser } from '../services/api';
import { getLevelProgress, lessonStructure } from '../data/lessonStructure';
import useReducedMotion from '../hooks/useReducedMotion';
import { useSEO, SEO_CONFIG } from '../lib/seo';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG        = '#F4F1E9';
const SURFACE   = '#FFFFFF';
const BORDER    = 'rgba(230, 200, 122, 0.18)';
const SHADOW    = '0 1px 2px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.06)';
const GOLD      = '#E6C87A';
const DEMO_GOLD = '#B69C60'; // muted gold for "Demo data" labels
const DARK      = '#222222';
const MUTED     = '#A0998A';
const MUTED2    = '#B0B0B0';
const FAINT_SEP = 'rgba(0,0,0,0.07)';

const card = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: '16px',
  boxShadow: SHADOW,
  padding: '24px',
};

// ─── Numeric safety helpers ────────────────────────────────────────────────────
// Coerce to a finite number or return the fallback (guards null/undefined/NaN/Infinity).
const num = (v, fallback = 0) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

// ─── "Demo data" pill ──────────────────────────────────────────────────────────
const DemoPill = ({ style }) => (
  <span
    title="Showing sample data — live data is unavailable right now."
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontFamily: fontBody,
      fontSize: '10px',
      fontWeight: '600',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: DEMO_GOLD,
      background: 'rgba(182, 156, 96, 0.10)',
      border: `1px solid rgba(182, 156, 96, 0.35)`,
      borderRadius: '20px',
      padding: '2px 9px',
      ...style,
    }}
  >
    <span aria-hidden="true">●</span>
    Demo data
  </span>
);

// ─── Skeleton shimmer ──────────────────────────────────────────────────────────
const Skeleton = ({ width = '100%', height = '14px', radius = '8px', style, reduced }) => (
  <div
    aria-hidden="true"
    style={{
      width,
      height,
      borderRadius: radius,
      background: reduced
        ? 'rgba(0,0,0,0.06)'
        : 'linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.10) 37%, rgba(0,0,0,0.05) 63%)',
      backgroundSize: '400% 100%',
      animation: reduced ? 'none' : 'dashShimmer 1.4s ease-in-out infinite',
      ...style,
    }}
  />
);

const SkeletonCard = ({ reduced, lines = 3 }) => (
  <div role="status" aria-busy="true" aria-label="Loading" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <Skeleton reduced={reduced} width="40%" height="18px" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} reduced={reduced} width={i === lines - 1 ? '70%' : '100%'} />
    ))}
  </div>
);

const sectionLabel = {
  fontFamily: fontBody,
  fontSize: '10px',
  fontWeight: '600',
  color: MUTED,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: `1px solid ${FAINT_SEP}`,
};

// ─── XP Progress Bar ─────────────────────────────────────────────────────────
const XPBar = ({ levelInfo }) => {
  const xpInto = num(levelInfo?.xpIntoLevel, 0);
  const xpNeeded = num(levelInfo?.xpNeeded, 0);
  const percent = xpNeeded > 0 ? Math.min((xpInto / xpNeeded) * 100, 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontFamily: fontBody, fontSize: '12px', color: MUTED }}>
          level {levelInfo?.currentLevel ?? 1}
        </span>
        <span style={{ fontFamily: fontBody, fontSize: '12px', color: MUTED }}>
          {xpInto} / {xpNeeded} xp
        </span>
      </div>
      <div style={{
        height: '4px',
        background: 'rgba(0,0,0,0.08)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: `linear-gradient(90deg, ${GOLD} 0%, #F0D586 100%)`,
          borderRadius: '2px',
          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </div>
    </div>
  );
};

// ─── Weekly Progress Chart ────────────────────────────────────────────────────
const WeeklyProgressChart = ({ userData }) => {
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    if (!userData?.learningProgress?.lessonAttempts) return;

    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();

      const lessonsCompleted = Object.keys(userData.learningProgress.lessonAttempts).filter(lessonId => {
        const attempt = userData.learningProgress.lessonAttempts[lessonId];
        if (attempt.lastAttempt) {
          return new Date(attempt.lastAttempt).toDateString() === dateString && attempt.completed;
        }
        return false;
      }).length;

      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        lessons: lessonsCompleted,
      });
    }
    setWeeklyData(last7Days);
  }, [userData]);

  const maxLessons = Math.max(...weeklyData.map(d => d.lessons), 1);

  return (
    <div style={{ width: '100%', height: '120px', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
      {weeklyData.map((day, i) => {
        const h = Math.max((day.lessons / maxLessons) * 80, 3);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{
              height: `${h}px`,
              width: '100%',
              background: day.lessons > 0
                ? `linear-gradient(180deg, ${GOLD} 0%, #D4A843 100%)`
                : 'rgba(0,0,0,0.07)',
              borderRadius: '4px 4px 2px 2px',
              transition: 'height 0.4s ease',
            }} />
            <span style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.04em' }}>
              {day.date.toLowerCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Trading Milestones ───────────────────────────────────────────────────────
const TradingMilestones = ({ userData, portfolio }) => {
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    if (!userData || !portfolio) return;

    const completedLessons = userData.learningProgress?.completedLessons || [];
    const transactions = userData.transactions || [];
    const hasPositions = portfolio.positions && portfolio.positions.length > 0;
    const totalReturn = portfolio.totalReturn || 0;

    const milestoneData = [
      { id: 'first_lesson',   title: 'First Lesson',          xp: 25,  status: completedLessons.length > 0 ? 'completed' : 'locked',              desc: 'Complete your first lesson' },
      { id: 'first_trade',    title: 'First Trade',           xp: 50,  status: transactions.length > 0 ? 'completed' : 'locked',                  desc: 'Buy your first stock' },
      { id: 'diversified',    title: 'Diversified',           xp: 75,  status: hasPositions && portfolio.positions.length >= 2 ? 'completed' : hasPositions ? 'current' : 'locked', desc: 'Hold 2+ stocks' },
      { id: 'profitable',     title: 'First Profit',          xp: 100, status: totalReturn > 0 ? 'completed' : hasPositions ? 'current' : 'locked', desc: 'Positive returns' },
      { id: 'risk_mgmt',      title: 'Risk Manager',          xp: 150, status: completedLessons.includes(16) || completedLessons.includes(17) ? 'completed' : completedLessons.length >= 10 ? 'current' : 'locked', desc: 'Risk management lessons' },
      { id: 'advanced_trader', title: 'Advanced Trader',      xp: 200, status: completedLessons.length >= 20 ? 'completed' : completedLessons.length >= 15 ? 'current' : 'locked', desc: '20+ lessons complete' },
    ];
    setMilestones(milestoneData);
  }, [userData, portfolio]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
      {milestones.map((m) => {
        const done = m.status === 'completed';
        const active = m.status === 'current';
        return (
          <div key={m.id} style={{
            padding: '14px',
            borderRadius: '12px',
            background: done ? `rgba(230,200,122,0.10)` : 'rgba(0,0,0,0.03)',
            border: `1px solid ${done ? 'rgba(230,200,122,0.3)' : active ? 'rgba(230,200,122,0.2)' : 'rgba(0,0,0,0.06)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <span style={{ fontFamily: fontBody, fontSize: '13px', fontWeight: '600', color: done ? DARK : MUTED }}>{m.title}</span>
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                padding: '2px 7px',
                borderRadius: '20px',
                letterSpacing: '0.06em',
                background: done ? GOLD : active ? DARK : 'rgba(0,0,0,0.08)',
                color: done ? DARK : active ? '#FFF' : MUTED,
              }}>
                {done ? 'done' : active ? 'active' : 'locked'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: MUTED }}>{m.desc}</div>
            <div style={{ fontSize: '11px', color: GOLD, marginTop: '4px', fontWeight: '600' }}>+{m.xp} XP</div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Recent Activity ──────────────────────────────────────────────────────────
const RecentActivity = ({ userData, portfolio }) => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!userData) return;
    const list = [];

    if (userData.learningProgress?.lessonAttempts) {
      Object.entries(userData.learningProgress.lessonAttempts).forEach(([lessonId, attempt]) => {
        if (attempt.completed && attempt.lastAttempt) {
          const lesson = lessonStructure.units.flatMap(u => u.lessons).find(l => l.id === parseInt(lessonId));
          if (lesson) {
            list.push({ id: `l_${lessonId}`, type: 'lesson', title: `Completed "${lesson.title}"`, timestamp: new Date(attempt.lastAttempt), xp: lesson.xp });
          }
        }
      });
    }

    if (Array.isArray(userData.transactions)) {
      userData.transactions.forEach(t => {
        list.push({ id: `t_${t.id}`, type: 'trade', title: `${(t.type || '').toUpperCase()} ${t.shares} × ${t.symbol}`, timestamp: new Date(t.timestamp), amount: num(t.total, null) });
      });
    }

    list.sort((a, b) => b.timestamp - a.timestamp);
    setActivities(list.slice(0, 6));
  }, [userData, portfolio]);

  const ago = (ts) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'just now';
  };

  if (!activities.length) {
    return <p style={{ fontSize: '13px', color: MUTED, padding: '8px 0' }}>No recent activity. Start learning or trading.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {activities.map((a) => (
        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: DARK, marginBottom: '2px' }}>{a.title}</div>
            <div style={{ fontSize: '11px', color: MUTED }}>{ago(a.timestamp)}{a.xp ? ` · +${a.xp} XP` : ''}{a.amount ? ` · $${a.amount.toFixed(2)}` : ''}</div>
          </div>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: a.type === 'trade' ? GOLD : 'rgba(0,0,0,0.15)',
            flexShrink: 0,
          }} />
        </div>
      ))}
    </div>
  );
};

// ─── Leaderboard ──────────────────────────────────────────────────────────────
// Sample rankings shown ONLY when live data can't be reached — always clearly
// labelled as "Demo data" so they never masquerade as real standings.
const DEMO_LEADERBOARD = [
  { username: 'TraderPro',    xp: 1250, rank: 1, completedLessons: 15 },
  { username: 'StockMaster',  xp: 1100, rank: 2, completedLessons: 12 },
  { username: 'InvestorGuru', xp: 950,  rank: 3, completedLessons: 10 },
  { username: 'MarketWiz',    xp: 800,  rank: 4, completedLessons: 8 },
];

const Leaderboard = ({ reduced }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.getLeaderboard();
        if (response.success) {
          setLeaderboard(response.leaderboard || []);
          setTotalUsers(response.totalUsers || 0);
          // Some responses flag synthetic data; surface it honestly.
          setIsDemo(response.source === 'demo' || response.demo === true);
        } else {
          throw new Error('failed');
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Leaderboard fetch failed, showing demo data:', err);
        // Show clearly-labelled demo rankings instead of silently faking real ones.
        setLeaderboard(DEMO_LEADERBOARD);
        setTotalUsers(DEMO_LEADERBOARD.length);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated()) fetchLeaderboard();
    else setLoading(false);
  }, []);

  if (loading) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading leaderboard" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Skeleton reduced={reduced} width="28px" height="28px" radius="50%" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Skeleton reduced={reduced} width="55%" height="12px" />
              <Skeleton reduced={reduced} width="35%" height="10px" />
            </div>
            <Skeleton reduced={reduced} width="40px" height="12px" />
          </div>
        ))}
      </div>
    );
  }

  if (!leaderboard.length) {
    return (
      <p style={{ fontSize: '13px', color: MUTED, padding: '8px 0' }}>
        No rankings yet — earn XP to claim your spot on the leaderboard.
      </p>
    );
  }

  const rankColor = (r) => r === 1 ? GOLD : r === 2 ? '#C0C0C0' : r === 3 ? '#CD7F32' : 'rgba(0,0,0,0.15)';

  return (
    <div>
      {isDemo ? (
        <DemoPill style={{ marginBottom: '14px' }} />
      ) : totalUsers > 0 ? (
        <p style={{ fontSize: '11px', color: MUTED, marginBottom: '14px' }}>{totalUsers} users ranked</p>
      ) : null}
      <ol
        aria-label={isDemo ? 'Sample leaderboard rankings (demo data)' : 'Leaderboard rankings'}
        style={{ display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none', margin: 0, padding: 0 }}
      >
        {leaderboard.map((u, i) => {
          const rank = u.rank || i + 1;
          const name = u.name || u.username || 'Anonymous';
          const lessons = num(u.completedLessons, 0);
          const xp = num(u.xp, 0);
          return (
            <li
              key={u.userId || i}
              aria-label={`Rank ${rank}: ${name}, ${xp} XP, ${lessons} lessons completed`}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              {/* Rank badge */}
              <div aria-hidden="true" style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: rankColor(rank),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '700',
                color: rank <= 3 ? DARK : MUTED,
                flexShrink: 0,
              }}>
                {rank}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name}
                </div>
                <div style={{ fontSize: '11px', color: MUTED }}>{lessons} lessons</div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: GOLD, flexShrink: 0 }}>
                {xp} XP
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  useSEO(SEO_CONFIG.dashboard);
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(isAuthenticated());
  const [userProfile, setUserProfile] = useState(null);
  const [learningPreferences, setLearningPreferences] = useState({ dailyGoal: 3, notifications: true, difficulty: 'auto' });

  const fetchPortfolio = async () => {
    if (!isAuthenticated()) { setLoading(false); return; }
    try {
      const response = await api.getPortfolio();
      if (response.success && response.portfolio) {
        const p = response.portfolio;
        const positions = Array.isArray(p.positions) ? p.positions : [];
        // Use avgPrice as a safe fallback when currentPrice is missing/non-finite.
        const effPrice = (x) => {
          const cur = num(x.currentPrice, NaN);
          return Number.isFinite(cur) ? cur : num(x.avgPrice, 0);
        };
        const totalCost = positions.reduce((s, x) => s + num(x.shares, 0) * num(x.avgPrice, 0), 0);
        const totalCurr = positions.reduce((s, x) => s + num(x.shares, 0) * effPrice(x), 0);
        setPortfolio({
          totalValue: num(p.totalValue, 0),
          cash: num(p.balance, 0),
          totalReturn: totalCost > 0 ? (totalCurr - totalCost) / totalCost : 0,
          isDemo: p.source === 'demo' || p.demo === true || response.source === 'demo',
          positions: positions.map(x => ({
            symbol: x.symbol,
            shares: num(x.shares, 0),
            currentValue: num(x.shares, 0) * effPrice(x),
            changePercent: num(x.changePercent, 0),
            avgPrice: num(x.avgPrice, 0),
          })),
        });
      } else {
        setError('Failed to load portfolio data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData     = async () => { if (!isAuthenticated()) { setUserDataLoading(false); return; } try { const r = await api.getUserData(); if (r.success) setUserData(r); } catch (err) { if (import.meta.env.DEV) console.warn('getUserData failed:', err); } finally { setUserDataLoading(false); } };
  const fetchUserProfile  = async () => { if (!isAuthenticated()) return; try { const r = await api.getProfile();   if (r.success) setUserProfile(r.user); } catch { /* non-critical: profile stays at defaults */ } };
  const fetchPreferences  = async () => { if (!isAuthenticated()) return; try { const r = await api.getLearningPreferences(); if (r.success) setLearningPreferences(r.preferences); } catch { /* non-critical: preferences stay at defaults */ } };

  useEffect(() => {
    fetchPortfolio();
    fetchUserData();
    fetchUserProfile();
    fetchPreferences();
  }, []);

  const fmt = (n) => {
    const v = num(n, NaN);
    return Number.isFinite(v) ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v) : '$0.00';
  };
  const fmtPct = (v) => {
    const n = num(v, NaN);
    return Number.isFinite(n) ? `${(n * 100).toFixed(2)}%` : '0.00%';
  };
  const changeColor = (v) => {
    const n = num(v, NaN);
    if (!Number.isFinite(n) || n === 0) return MUTED;
    return n >= 0 ? '#22c55e' : '#ef4444';
  };

  const currentUser   = getCurrentUser();
  const displayName   = userProfile?.name || currentUser?.username || 'there';
  const displayUser   = userProfile?.username || currentUser?.username || '';
  const learningProg  = userData?.learningProgress || { xp: 0, coins: 0 };
  const levelInfo     = getLevelProgress(learningProg.xp);

  const dailyGoalCalc = () => {
    const today = new Date().toDateString();
    const attempts = learningProg.lessonAttempts || {};
    const done = Object.values(attempts).filter(a => a?.completed && a?.lastAttempt && new Date(a.lastAttempt).toDateString() === today).length;
    // Prefer the user's saved daily goal (preferences → learningProgress), else 3.
    const savedGoal = num(learningPreferences?.dailyGoal ?? learningProg?.dailyGoal, NaN);
    const goal = Number.isFinite(savedGoal) && savedGoal > 0 ? savedGoal : 3;
    const pct = goal > 0 ? Math.round(Math.min((done / goal) * 100, 100)) : 0;
    return { completed: done, total: goal, pct };
  };
  const dg = dailyGoalCalc();

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px', fontFamily: fontBody }}>
      {/* Scoped styles: shimmer keyframes + responsive grid collapse (<=768px). */}
      <style>{`
        @keyframes dashShimmer {
          0%   { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .dash-stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .dash-main-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
        .dash-portfolio-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 768px) {
          .dash-stat-row,
          .dash-main-grid,
          .dash-portfolio-summary { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dash-shimmer { animation: none !important; }
        }
      `}</style>
      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontFamily: fontHeading, fontSize: '28px', fontWeight: '400', color: DARK, marginBottom: '4px', letterSpacing: '-0.01em' }}>
                welcome back, {displayName.toLowerCase()}.
              </h1>
              {displayUser && (
                <div style={{ fontSize: '13px', color: MUTED }}>@{displayUser}</div>
              )}
            </div>
            {/* XP pill */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div
                aria-label={`${num(learningProg.xp, 0)} experience points`}
                style={{
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: DARK,
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                  boxShadow: SHADOW,
                }}
              >
                <span aria-hidden="true" style={{ color: GOLD }}>◆</span>
                {num(learningProg.xp, 0)} XP
              </div>
              <div
                aria-label={`${num(learningProg.coins, 0)} coins`}
                style={{
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: DARK,
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                  boxShadow: SHADOW,
                }}
              >
                <span aria-hidden="true" style={{ color: GOLD, fontSize: '11px' }}>●</span>
                {num(learningProg.coins, 0)} coins
              </div>
              <button
                onClick={() => navigate('/shop')}
                style={{ background: DARK, color: '#FFF', border: 'none', padding: '7px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.01em' }}
              >
                Shop
              </button>
            </div>
          </div>

          {/* Level progress bar */}
          <div style={{ marginTop: '20px', ...card, padding: '20px 24px' }}>
            <XPBar levelInfo={levelInfo} />
          </div>
        </div>

        {/* ── Top stat row ── */}
        <div className="dash-stat-row" style={{ marginBottom: '24px' }}>
          {[
            { label: 'level', value: `${levelInfo?.currentLevel ?? 1}`, loading: false },
            { label: 'daily goal', value: `${dg.completed} / ${dg.total}`, sub: `${dg.pct}% complete`, loading: false },
            { label: 'portfolio', value: fmt(portfolio?.totalValue), sub: portfolio ? fmtPct(portfolio.totalReturn) : '—', subColor: portfolio ? changeColor(portfolio.totalReturn) : MUTED, loading: loading },
          ].map((s, i) => (
            <div key={i} style={card}>
              <div style={sectionLabel}>{s.label}</div>
              {s.loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Skeleton reduced={reduced} width="60%" height="26px" />
                  <Skeleton reduced={reduced} width="40%" height="12px" />
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: fontHeading, fontSize: '26px', fontWeight: '400', color: DARK, letterSpacing: '-0.01em' }}>{s.value}</div>
                  {s.sub && <div style={{ fontSize: '12px', color: s.subColor || MUTED, marginTop: '4px' }}>{s.sub}</div>}
                </>
              )}
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div className="dash-main-grid">

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Portfolio */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${FAINT_SEP}` }}>
                  <span style={{ ...sectionLabel, margin: 0, padding: 0, border: 'none' }}>portfolio</span>
                  {portfolio?.isDemo && <DemoPill />}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button onClick={() => { setLoading(true); fetchPortfolio(); }} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: DARK }}>Refresh</button>
                  <button onClick={() => navigate('/trade')} style={{ background: GOLD, border: 'none', padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: DARK }}>Trade →</button>
                </div>
              </div>

              {loading ? (
                <SkeletonCard reduced={reduced} lines={4} />
              ) : error ? (
                <p style={{ color: '#ef4444', fontSize: '13px' }}>Error: {error}</p>
              ) : !portfolio ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ color: MUTED, fontSize: '14px', marginBottom: '16px' }}>No portfolio yet.</p>
                  <button onClick={() => navigate('/trade')} style={{ background: GOLD, border: 'none', padding: '10px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: DARK }}>Start Trading</button>
                </div>
              ) : (
                <div>
                  {/* Summary row */}
                  <div className="dash-portfolio-summary" style={{ marginBottom: '20px' }}>
                    {[
                      { l: 'total value', v: fmt(portfolio.totalValue) },
                      { l: 'cash', v: fmt(portfolio.cash) },
                      { l: 'total return', v: fmtPct(portfolio.totalReturn), vc: changeColor(portfolio.totalReturn) },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: '14px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: '10px', color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>{s.l}</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: s.vc || DARK }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Holdings */}
                  {portfolio.positions?.length > 0 ? (
                    <div>
                      <div style={{ fontSize: '11px', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>holdings</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {portfolio.positions.map((h, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '14px', color: DARK }}>{h.symbol}</div>
                              <div style={{ fontSize: '11px', color: MUTED }}>{h.shares} shares</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: '600', fontSize: '14px', color: DARK }}>{fmt(h.currentValue)}</div>
                              <div style={{ fontSize: '11px', color: changeColor(h.changePercent) }}>{fmtPct(h.changePercent)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: MUTED, fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>No holdings yet. Make your first trade.</p>
                  )}
                </div>
              )}
            </div>

            {/* Weekly Progress */}
            <div style={card}>
              <div style={sectionLabel}>weekly lessons</div>
              {userDataLoading
                ? <Skeleton reduced={reduced} width="100%" height="120px" radius="10px" />
                : <WeeklyProgressChart userData={userData} />}
            </div>

            {/* Trading Journey */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={sectionLabel}>trading journey</div>
                <button onClick={() => navigate('/learn')} style={{ background: 'none', border: 'none', fontSize: '12px', color: GOLD, fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}>View all →</button>
              </div>
              {userDataLoading
                ? <SkeletonCard reduced={reduced} lines={4} />
                : <TradingMilestones userData={userData} portfolio={portfolio} />}
            </div>

            {/* Continue Learning */}
            <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: fontHeading, fontSize: '18px', fontWeight: '400', color: DARK, marginBottom: '6px' }}>continue learning</div>
                <div style={{ fontSize: '13px', color: MUTED }}>Pick up where you left off.</div>
              </div>
              <button onClick={() => navigate('/learn')} style={{ background: DARK, color: '#FFF', border: 'none', padding: '11px 22px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Go to Learn →
              </button>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Leaderboard */}
            <div style={card}>
              <div style={sectionLabel}>leaderboard</div>
              <Leaderboard reduced={reduced} />
            </div>

            {/* Recent Activity */}
            <div style={card}>
              <div style={sectionLabel}>recent activity</div>
              {userDataLoading
                ? <SkeletonCard reduced={reduced} lines={4} />
                : <RecentActivity userData={userData} portfolio={portfolio} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
