/**
 * Market hours & session calendar for US equities (NYSE/Nasdaq).
 *
 * Everything is evaluated in US Eastern time (Intl handles EST/EDT) and is
 * holiday-aware via a maintained table of full/half closures. This is the single
 * source of truth the order engine uses to decide when orders may fill, so it is
 * a pure, synchronous, no-network calc (the engine runs it every few seconds).
 *
 * Sessions returned by getClock():
 *   'pre'      — 04:00–09:30 ET   (extended hours)
 *   'regular'  — 09:30–16:00 ET   (13:00 on half days)
 *   'post'     — 16:00–20:00 ET   (17:00 on half days; extended hours)
 *   'closed'   — overnight / weekend / holiday
 *
 * The Alpaca /v2/clock endpoint is used by the route layer only as an
 * authoritative cross-check for unexpected full-day closures; sessions
 * themselves (pre/post) are always computed here.
 */

const PRE_OPEN_MIN = 4 * 60; // 04:00
const REGULAR_OPEN_MIN = 9 * 60 + 30; // 09:30
const REGULAR_CLOSE_MIN = 16 * 60; // 16:00
const HALF_DAY_CLOSE_MIN = 13 * 60; // 13:00
const POST_CLOSE_MIN = 20 * 60; // 20:00
const HALF_DAY_POST_CLOSE_MIN = 17 * 60; // 17:00

// Full-day market holidays (YYYY-MM-DD, ET). Maintained through 2027.
const FULL_HOLIDAYS = new Set([
  // 2024
  '2024-01-01', '2024-01-15', '2024-02-19', '2024-03-29', '2024-05-27',
  '2024-06-19', '2024-07-04', '2024-09-02', '2024-11-28', '2024-12-25',
  // 2025
  '2025-01-01', '2025-01-09', '2025-01-20', '2025-02-17', '2025-04-18',
  '2025-05-26', '2025-06-19', '2025-07-04', '2025-09-01', '2025-11-27',
  '2025-12-25',
  // 2026
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25',
  '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
  // 2027
  '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31',
  '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24',
]);

// Half-days: early close at 13:00 ET (day after Thanksgiving, Christmas Eve, July 3 eves, etc.).
const HALF_DAYS = new Set([
  '2024-07-03', '2024-11-29', '2024-12-24',
  '2025-07-03', '2025-11-28', '2025-12-24',
  '2026-11-27', '2026-12-24',
  '2027-11-26',
]);

/** Extract ET calendar parts for a Date (or now). */
function etParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0; // some engines emit 24 for midnight
  return {
    ymd: `${get('year')}-${get('month')}-${get('day')}`,
    weekday: get('weekday'),
    minutes: hour * 60 + parseInt(get('minute'), 10),
  };
}

function isWeekend(weekday) {
  return weekday === 'Sat' || weekday === 'Sun';
}

/** Is this ET calendar day a trading day at all (weekday, not a full holiday)? */
function isTradingDay(ymd, weekday) {
  if (isWeekend(weekday)) return false;
  if (FULL_HOLIDAYS.has(ymd)) return false;
  return true;
}

/** Regular-session close (in ET minutes) for a trading day, accounting for half days. */
function regularCloseFor(ymd) {
  return HALF_DAYS.has(ymd) ? HALF_DAY_CLOSE_MIN : REGULAR_CLOSE_MIN;
}

function postCloseFor(ymd) {
  return HALF_DAYS.has(ymd) ? HALF_DAY_POST_CLOSE_MIN : POST_CLOSE_MIN;
}

/**
 * Current market clock. Returns the live session plus convenience booleans.
 * @returns {{ ymd, minutes, session, isOpen, isExtended, isHalfDay, isHoliday }}
 *   isOpen     — regular session only (orders without extendedHours fill here)
 *   isExtended — pre or post session
 */
function getClock(date = new Date()) {
  const { ymd, weekday, minutes } = etParts(date);
  const tradingDay = isTradingDay(ymd, weekday);
  const isHalfDay = HALF_DAYS.has(ymd);

  let session = 'closed';
  if (tradingDay) {
    const regClose = regularCloseFor(ymd);
    const postClose = postCloseFor(ymd);
    if (minutes >= PRE_OPEN_MIN && minutes < REGULAR_OPEN_MIN) session = 'pre';
    else if (minutes >= REGULAR_OPEN_MIN && minutes < regClose) session = 'regular';
    else if (minutes >= regClose && minutes < postClose) session = 'post';
  }

  return {
    ymd,
    minutes,
    session,
    isOpen: session === 'regular',
    isExtended: session === 'pre' || session === 'post',
    isHalfDay,
    isHoliday: !isWeekend(weekday) && FULL_HOLIDAYS.has(ymd),
  };
}

/**
 * Whether an order is permitted to fill right now.
 * Regular session: always. Extended sessions: only orders flagged extendedHours.
 */
function canFillNow(clock, extendedHours = false) {
  if (clock.isOpen) return true;
  if (clock.isExtended && extendedHours) return true;
  return false;
}

/** A short human label for the current session. */
function sessionLabel(clock) {
  switch (clock.session) {
    case 'pre': return 'Pre-market';
    case 'regular': return 'Market open';
    case 'post': return 'After hours';
    default: return 'Market closed';
  }
}

/** Parse 'YYYY-MM-DD' into a noon-UTC Date (avoids TZ day-boundary drift). */
function ymdToDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function dateToYmd(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Settlement date for a trade executed now: trade date + N business days,
 * skipping weekends and full holidays. US equities settle T+1 since May 2024;
 * we default to T+1 to mirror current rules. Returns an ISO string at ET close.
 */
function settlementDate(fromDate = new Date(), businessDays = 1) {
  const { ymd } = etParts(fromDate);
  let cursor = ymdToDate(ymd);
  let added = 0;
  while (added < businessDays) {
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(cursor);
    const cymd = dateToYmd(cursor);
    if (wd !== 'Sat' && wd !== 'Sun' && !FULL_HOLIDAYS.has(cymd)) added++;
  }
  return ymdToDate(dateToYmd(cursor)).toISOString();
}

/** Next ET trading day after `ymd` (skips weekends + full holidays). */
function nextTradingDayYmd(ymd) {
  let cursor = ymdToDate(ymd);
  for (let i = 0; i < 10; i++) {
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(cursor);
    const cymd = dateToYmd(cursor);
    if (wd !== 'Sat' && wd !== 'Sun' && !FULL_HOLIDAYS.has(cymd)) return cymd;
  }
  return dateToYmd(cursor);
}

/**
 * The ET date + close-minute a DAY order is "good for". If there is still an
 * eligible session left today (now is before the relevant close), it's today;
 * otherwise it rolls to the next trading day. `extendedHours` orders live until
 * the post-market close (20:00 / 17:00 half-day) rather than the regular close.
 */
function dayOrderGoodFor(clock = getClock(), extendedHours = false) {
  const closeMinuteFor = (ymd) => (extendedHours ? postCloseFor(ymd) : regularCloseFor(ymd));
  const todayTradingDay = !clock.isHoliday && clock.session !== 'closed'
    ? clock.ymd
    : (isTradingDayYmd(clock.ymd) ? clock.ymd : nextTradingDayYmd(clock.ymd));

  // If it's a trading day and we're still before the close boundary, good for today.
  if (isTradingDayYmd(clock.ymd) && clock.minutes < closeMinuteFor(clock.ymd)) {
    return { ymd: clock.ymd, closeMinute: closeMinuteFor(clock.ymd) };
  }
  const ymd = nextTradingDayYmd(clock.ymd);
  return { ymd, closeMinute: closeMinuteFor(ymd) };
}

function isTradingDayYmd(ymd) {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(ymdToDate(ymd));
  return wd !== 'Sat' && wd !== 'Sun' && !FULL_HOLIDAYS.has(ymd);
}

/** Has a DAY order good for {ymd, closeMinute} now expired? */
function isDayExpired(goodForYmd, closeMinute, clock = getClock()) {
  if (clock.ymd > goodForYmd) return true;
  if (clock.ymd === goodForYmd && clock.minutes >= closeMinute) return true;
  return false;
}

module.exports = {
  getClock,
  canFillNow,
  sessionLabel,
  settlementDate,
  isTradingDay,
  nextTradingDayYmd,
  dayOrderGoodFor,
  isDayExpired,
  etParts,
  // exported for tests
  FULL_HOLIDAYS,
  HALF_DAYS,
};
