const TZ = 'Europe/Istanbul';

export function todayLocal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

export function currentMonthLocal(): string {
  return todayLocal().slice(0, 7);
}
