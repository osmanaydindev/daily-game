// All daily logic uses UTC date strings (YYYY-MM-DD).
// This ensures consistent "today" regardless of server timezone.

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isValidDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

// Returns YYYY-Www (ISO week)
export function toISOWeek(date: string): string {
  const d = new Date(date);
  const dayOfWeek = d.getUTCDay() || 7; // Monday = 1
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// Returns YYYY-MM
export function toYearMonth(date: string): string {
  return date.slice(0, 7);
}

// Generates list of YYYY-MM-DD dates in [start, end] (inclusive)
export function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}
