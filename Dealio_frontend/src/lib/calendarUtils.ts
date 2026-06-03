export function downloadCalendarInvite(opts: {
  id: number | string;
  projectName: string;
  date: string;          // YYYY-MM-DD
  time: string;          // "10:30 AM" | "14:30"
  summary?: string;
  description?: string;
}) {
  let h = 0, min = 0;
  const ampm = opts.time.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (ampm) {
    h   = parseInt(ampm[1]!, 10);
    min = parseInt(ampm[2]!, 10);
    const p = (ampm[3]!).toUpperCase();
    if (p === 'PM' && h !== 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
  } else {
    const parts = opts.time.split(':');
    h   = parseInt(parts[0] ?? '0', 10);
    min = parseInt(parts[1] ?? '0', 10);
  }

  const pad  = (n: number) => String(n).padStart(2, '0');
  const start = new Date(`${opts.date}T${pad(h)}:${pad(min)}:00`);
  const end   = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dealio//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
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
  a.href     = url;
  a.download = `site-visit-${opts.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
