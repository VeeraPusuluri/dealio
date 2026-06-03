export interface CalendarOpts {
  id: number | string;
  projectName: string;
  date: string;        // YYYY-MM-DD
  time: string;        // "10:30 AM" | "14:30"
  summary?: string;
  description?: string;
}

function parseTime(time: string): { h: number; min: number } {
  const ampm = time.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1]!, 10);
    const min = parseInt(ampm[2]!, 10);
    const p = ampm[3]!.toUpperCase();
    if (p === 'PM' && h !== 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
    return { h, min };
  }
  const parts = time.split(':');
  return { h: parseInt(parts[0] ?? '0', 10), min: parseInt(parts[1] ?? '0', 10) };
}

// YYYYMMDDTHHMMSS  (no Z → local time, so calendar app uses user's timezone)
function toLocalStamp(date: string, h: number, min: number) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.replace(/-/g, '')}T${pad(h)}${pad(min)}00`;
}

// Google Calendar deep-link
export function googleCalendarUrl(opts: CalendarOpts): string {
  const { h, min } = parseTime(opts.time);
  const pad = (n: number) => String(n).padStart(2, '0');
  const start = toLocalStamp(opts.date, h, min);
  const endH  = (h + 1) % 24;
  const end   = toLocalStamp(opts.date, endH, min);
  const p = new URLSearchParams({
    action:   'TEMPLATE',
    text:     opts.summary ?? `Site Visit — ${opts.projectName}`,
    dates:    `${start}/${end}`,
    details:  opts.description ?? `Site visit at ${opts.projectName}`,
    location: opts.projectName,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

// Outlook.com deep-link
export function outlookCalendarUrl(opts: CalendarOpts): string {
  const { h, min } = parseTime(opts.time);
  const pad  = (n: number) => String(n).padStart(2, '0');
  const startdt = `${opts.date}T${pad(h)}:${pad(min)}:00`;
  const endH    = (h + 1) % 24;
  const enddt   = `${opts.date}T${pad(endH)}:${pad(min)}:00`;
  const p = new URLSearchParams({
    rru:      'addevent',
    startdt,
    enddt,
    subject:  opts.summary ?? `Site Visit — ${opts.projectName}`,
    body:     opts.description ?? `Site visit at ${opts.projectName}`,
    location: opts.projectName,
    path:     '/calendar/action/compose',
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${p.toString()}`;
}

// Apple Calendar / iCal — downloads .ics; on iOS/macOS it auto-opens in Calendar
export function downloadICS(opts: CalendarOpts) {
  const { h, min } = parseTime(opts.time);
  const pad   = (n: number) => String(n).padStart(2, '0');
  const start = new Date(`${opts.date}T${pad(h)}:${pad(min)}:00`);
  const end   = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dealio//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:${opts.summary ?? `Site Visit — ${opts.projectName}`}`,
    `DESCRIPTION:${opts.description ?? `Site visit at ${opts.projectName}`}`,
    `LOCATION:${opts.projectName}`,
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: site visit in 1 hour', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `site-visit-${opts.id}.ics`; a.click();
  URL.revokeObjectURL(url);
}

// Keep old name as alias so BuilderMeetings still compiles without change
export { downloadICS as downloadCalendarInvite };
