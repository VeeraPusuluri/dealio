// Builder availability stored in localStorage (shared across same device/browser).
// Key: dealio_avail_{builderId}

export interface BuilderAvailability {
  builderId: string;
  // day 0=Sun … 6=Sat → list of available time slots
  weeklySlots: Record<string, string[]>;
  // ISO date strings (YYYY-MM-DD) that are fully blocked
  blockedDates: string[];
}

const DEFAULT_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
const DEFAULT_DAYS  = ['1', '2', '3', '4', '5']; // Mon–Fri

const key = (bid: string) => `dealio_avail_${bid}`;

export function getAvailability(builderId: string): BuilderAvailability {
  try {
    const raw = localStorage.getItem(key(builderId));
    if (raw) return JSON.parse(raw) as BuilderAvailability;
  } catch { /* ignore */ }
  // Default: Mon–Fri, standard slots
  const weekly: Record<string, string[]> = {};
  DEFAULT_DAYS.forEach(d => { weekly[d] = [...DEFAULT_SLOTS]; });
  return { builderId, weeklySlots: weekly, blockedDates: [] };
}

export function saveAvailability(avail: BuilderAvailability) {
  try { localStorage.setItem(key(avail.builderId), JSON.stringify(avail)); } catch { /* ignore */ }
}

export function getAvailableSlotsForDate(builderId: string, isoDate: string): string[] {
  const avail = getAvailability(builderId);
  if (avail.blockedDates.includes(isoDate)) return [];
  const dow = String(new Date(isoDate + 'T12:00:00').getDay()); // avoid TZ issues
  return avail.weeklySlots[dow] ?? [];
}

export const ALL_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
];

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
