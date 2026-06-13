/**
 * Unit tests for marketHours — the session calendar the order engine trusts to
 * decide when orders may fill, and how cash settles (T+1). Pure & synchronous;
 * we feed fixed Dates so results don't depend on when the suite runs.
 *
 * Reference dates (2026): Jun 15 = Monday, Jun 13 = Saturday, Jul 3 = Friday
 * full holiday, Nov 27 = half day.
 */
const mh = require('../services/marketHours');

describe('marketHours — getClock sessions', () => {
  it('reports the regular session during market hours on a weekday', () => {
    // 14:00 UTC = 10:00 ET on a summer (EDT) Monday
    const clock = mh.getClock(new Date('2026-06-15T14:00:00Z'));
    expect(clock.session).toBe('regular');
    expect(clock.isOpen).toBe(true);
    expect(clock.isExtended).toBe(false);
  });

  it('reports pre-market in the early extended window', () => {
    // 12:00 UTC = 08:00 ET
    const clock = mh.getClock(new Date('2026-06-15T12:00:00Z'));
    expect(clock.session).toBe('pre');
    expect(clock.isOpen).toBe(false);
    expect(clock.isExtended).toBe(true);
  });

  it('reports post-market in the late extended window', () => {
    // 22:00 UTC = 18:00 ET
    const clock = mh.getClock(new Date('2026-06-15T22:00:00Z'));
    expect(clock.session).toBe('post');
    expect(clock.isExtended).toBe(true);
  });

  it('is closed on weekends', () => {
    const clock = mh.getClock(new Date('2026-06-13T16:00:00Z')); // Saturday noon ET
    expect(clock.session).toBe('closed');
    expect(clock.isOpen).toBe(false);
  });

  it('is closed and flagged as a holiday on a full market holiday', () => {
    const clock = mh.getClock(new Date('2026-07-03T15:00:00Z')); // Jul 3 2026 holiday
    expect(clock.session).toBe('closed');
    expect(clock.isHoliday).toBe(true);
  });
});

describe('marketHours — canFillNow', () => {
  it('allows any order during the regular session', () => {
    expect(mh.canFillNow({ isOpen: true, isExtended: false }, false)).toBe(true);
    expect(mh.canFillNow({ isOpen: true, isExtended: false }, true)).toBe(true);
  });

  it('allows only extended-hours orders in pre/post sessions', () => {
    const ext = { isOpen: false, isExtended: true };
    expect(mh.canFillNow(ext, true)).toBe(true);
    expect(mh.canFillNow(ext, false)).toBe(false);
  });

  it('blocks all fills when closed', () => {
    const closed = { isOpen: false, isExtended: false };
    expect(mh.canFillNow(closed, true)).toBe(false);
    expect(mh.canFillNow(closed, false)).toBe(false);
  });
});

describe('marketHours — settlement (T+1)', () => {
  it('settles to the next business day and skips weekends', () => {
    // Friday Jun 12 2026 -> T+1 should land on Monday Jun 15 (skips the weekend)
    const iso = mh.settlementDate(new Date('2026-06-12T15:00:00Z'), 1);
    const d = new Date(iso);
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(d);
    expect(['Sat', 'Sun']).not.toContain(weekday);
    expect(d.getTime()).toBeGreaterThan(new Date('2026-06-12T15:00:00Z').getTime());
    expect(iso.startsWith('2026-06-15')).toBe(true);
  });

  it('skips full holidays when computing settlement', () => {
    // Thu Jul 2 2026 -> T+1 skips the Jul 3 holiday and the weekend to Mon Jul 6
    const iso = mh.settlementDate(new Date('2026-07-02T15:00:00Z'), 1);
    expect(iso.startsWith('2026-07-06')).toBe(true);
  });
});

describe('marketHours — DAY order lifecycle', () => {
  it('marks a DAY order expired once its session window has passed', () => {
    const clock = { ymd: '2026-06-16', minutes: 600 };
    expect(mh.isDayExpired('2026-06-15', 960, clock)).toBe(true);   // next day
    expect(mh.isDayExpired('2026-06-16', 480, clock)).toBe(true);   // same day, past close minute
    expect(mh.isDayExpired('2026-06-16', 960, clock)).toBe(false);  // same day, before close
  });

  it('rolls a DAY order to the next trading day when placed after hours', () => {
    const afterHours = mh.getClock(new Date('2026-06-15T23:30:00Z')); // ~19:30 ET, past regular close
    const good = mh.dayOrderGoodFor(afterHours, false);
    expect(mh.isTradingDay(good.ymd, 'Tue')).toBe(true);
    expect(good.ymd >= afterHours.ymd).toBe(true);
  });
});
