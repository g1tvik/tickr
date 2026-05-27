import React, { useState, useEffect } from "react";
import "../globals.css";
import { useNavigate } from "react-router-dom";
import { marbleGold } from '../marblePalette';
import { fontHeading, fontBody } from '../fontPalette';
import { api, isAuthenticated, getCurrentUser } from '../services/api';
import { getLevelProgress, lessonStructure } from '../data/lessonStructure';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG        = '#F4F1E9';
const SURFACE   = '#FFFFFF';
const BORDER    = 'rgba(230, 200, 122, 0.18)';
const SHADOW    = '0 1px 2px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.06)';
const GOLD      = '#E6C87A';
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
const XPBar = ({ xp, levelInfo }) => {
  const percent = Math.min((levelInfo.xpIntoLevel / levelInfo.xpNeeded) * 100, 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontFamily: fontBody, fontSize: '12px', color: MUTED }}>
          level {levelInfo.currentLevel}
        </span>
        <span style={{ fontFamily: fontBody, fontSize: '12px', color: MUTED }}>
          {levelInfo.xpIntoLevel} / {levelInfo.xpNeeded} xp
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

    if (userData.transactions) {
      userData.transactions.forEach(t => {
        list.push({ id: `t_${t.id}`, type: 'trade', title: `${t.type.toUpperCase()} ${t.shares} × ${t.symbol}`, timestamp: new Date(t.timestamp), amount: t.total });
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
const Leaderboard = ({ userData }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.getLeaderboard();
        if (response.success) {
          setLeaderboard(response.leaderboard || []);
          setTotalUsers(response.totalUsers || 0);
        } else {
          throw new Error('failed');
        }
      } catch {
        setLeaderboard([
          { username: 'TraderPro', xp: 1250, rank: 1, completedLessons: 15 },
          { username: 'StockMaster', xp: 1100, rank: 2, completedLessons: 12 },
          { username: 'InvestorGuru', xp: 950, rank: 3, completedLessons: 10 },
          { username: 'MarketWiz', xp: 800, rank: 4, completedLessons: 8 },
        ]);
        setTotalUsers(4);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated()) fetchLeaderboard();
    else setLoading(false);
  }, []);

  if (loading) return <p style={{ fontSize: '13px', color: MUTED }}>Loading…</p>;

  const rankColor = (r) => r === 1 ? GOLD : r === 2 ? '#C0C0C0' : r === 3 ? '#CD7F32' : 'rgba(0,0,0,0.15)';

  return (
    <div>
      {totalUsers > 0 && (
        <p style={{ fontSize: '11px', color: MUTED, marginBottom: '14px' }}>{totalUsers} users ranked</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {leaderboard.map((u, i) => (
          <div key={u.userId || i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Rank badge */}
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: rankColor(u.rank || i + 1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700',
              color: (u.rank || i + 1) <= 3 ? DARK : MUTED,
              flexShrink: 0,
            }}>
              {u.rank || i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.name || u.username}
              </div>
              <div style={{ fontSize: '11px', color: MUTED }}>{u.completedLessons || 0} lessons</div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: GOLD, flexShrink: 0 }}>
              {u.xp} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [learningPreferences, setLearningPreferences] = useState({ dailyGoal: 3, notifications: true, difficulty: 'auto' });

  const fetchPortfolio = async () => {
    if (!isAuthenticated()) { setLoading(false); return; }
    try {
      const response = await api.getPortfolio();
      if (response.success && response.portfolio) {
        const p = response.portfolio;
        const totalCost = p.positions.reduce((s, x) => s + x.shares * x.avgPrice, 0);
        const totalCurr = p.positions.reduce((s, x) => s + x.shares * (x.currentPrice || x.avgPrice), 0);
        setPortfolio({
          totalValue: p.totalValue,
          cash: p.balance,
          totalReturn: totalCost > 0 ? (totalCurr - totalCost) / totalCost : 0,
          positions: p.positions.map(x => ({
            symbol: x.symbol,
            shares: x.shares,
            currentValue: x.shares * (x.currentPrice || x.avgPrice),
            changePercent: x.changePercent || 0,
            avgPrice: x.avgPrice,
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

  const fetchUserData     = async () => { if (!isAuthenticated()) return; try { const r = await api.getUserData();   if (r.success) setUserData(r); } catch {} };
  const fetchUserProfile  = async () => { if (!isAuthenticated()) return; try { const r = await api.getProfile();   if (r.success) setUserProfile(r.user); } catch {} };
  const fetchPreferences  = async () => { if (!isAuthenticated()) return; try { const r = await api.getLearningPreferences(); if (r.success) setLearningPreferences(r.preferences); } catch {} };

  useEffect(() => {
    fetchPortfolio();
    fetchUserData();
    fetchUserProfile();
    fetchPreferences();
  }, []);

  const fmt = (n) => n == null ? '$0.00' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const fmtPct = (v) => v == null ? '0.00%' : `${(v * 100).toFixed(2)}%`;
  const changeColor = (v) => !v ? MUTED : v >= 0 ? '#22c55e' : '#ef4444';

  const currentUser   = getCurrentUser();
  const displayName   = userProfile?.name || currentUser?.username || 'there';
  const displayUser   = userProfile?.username || currentUser?.username || '';
  const learningProg  = userData?.learningProgress || { xp: 0, coins: 0 };
  const levelInfo     = getLevelProgress(learningProg.xp);

  const dailyGoalCalc = () => {
    const today = new Date().toDateString();
    const attempts = learningProg.lessonAttempts || {};
    const done = Object.values(attempts).filter(a => a.completed && a.lastAttempt && new Date(a.lastAttempt).toDateString() === today).length;
    const goal = learningPreferences.dailyGoal || 3;
    return { completed: done, total: goal, pct: Math.round(Math.min((done / goal) * 100, 100)) };
  };
  const dg = dailyGoalCalc();

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '32px 24px', fontFamily: fontBody }}>
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
              <div style={{
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
              }}>
                <span style={{ color: GOLD }}>◆</span>
                {learningProg.xp} XP
              </div>
              <div style={{
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
              }}>
                <span style={{ color: GOLD, fontSize: '11px' }}>●</span>
                {learningProg.coins} coins
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
            <XPBar xp={learningProg.xp} levelInfo={levelInfo} />
          </div>
        </div>

        {/* ── Top stat row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'level', value: `${levelInfo.currentLevel}` },
            { label: 'daily goal', value: `${dg.completed} / ${dg.total}`, sub: `${dg.pct}% complete` },
            { label: 'portfolio', value: fmt(portfolio?.totalValue), sub: portfolio ? fmtPct(portfolio.totalReturn) : '—', subColor: portfolio ? changeColor(portfolio.totalReturn) : MUTED },
          ].map((s, i) => (
            <div key={i} style={card}>
              <div style={sectionLabel}>{s.label}</div>
              <div style={{ fontFamily: fontHeading, fontSize: '26px', fontWeight: '400', color: DARK, letterSpacing: '-0.01em' }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: '12px', color: s.subColor || MUTED, marginTop: '4px' }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Portfolio */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={sectionLabel}>portfolio</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button onClick={() => { setLoading(true); fetchPortfolio(); }} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: DARK }}>Refresh</button>
                  <button onClick={() => navigate('/trade')} style={{ background: GOLD, border: 'none', padding: '5px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: DARK }}>Trade →</button>
                </div>
              </div>

              {loading ? (
                <p style={{ color: MUTED, fontSize: '13px' }}>Loading portfolio…</p>
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
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
              <WeeklyProgressChart userData={userData} />
            </div>

            {/* Trading Journey */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={sectionLabel}>trading journey</div>
                <button onClick={() => navigate('/learn')} style={{ background: 'none', border: 'none', fontSize: '12px', color: GOLD, fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}>View all →</button>
              </div>
              <TradingMilestones userData={userData} portfolio={portfolio} />
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
              <Leaderboard userData={userData} />
            </div>

            {/* Recent Activity */}
            <div style={card}>
              <div style={sectionLabel}>recent activity</div>
              <RecentActivity userData={userData} portfolio={portfolio} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
