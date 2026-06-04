import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, Phone,
  Building2, Handshake, TrendingUp, ClipboardList, Users,
} from 'lucide-react';

// ─── Public types ─────────────────────────────────────────────────────────────

export type CalEventType = 'meeting' | 'visit' | 'followup' | 'agreement' | 'negotiation';

export interface CalEvent {
  id: string | number;
  title: string;
  subtitle?: string;
  date: string;     // 'YYYY-MM-DD'
  time?: string;    // display string, e.g. '10:30 AM'
  type: CalEventType;
  status?: string;
  phone?: string;
}

interface Props {
  events: CalEvent[];
  loading?: boolean;
  accentColor?: string;
}

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE: Record<CalEventType, { color: string; bg: string; label: string; Icon: React.ElementType }> = {
  meeting:     { color: '#0071e3', bg: 'rgba(0,113,227,0.09)',  label: 'Meeting',     Icon: Users },
  visit:       { color: '#30d158', bg: 'rgba(48,209,88,0.1)',   label: 'Site Visit',  Icon: Building2 },
  followup:    { color: '#ff9f0a', bg: 'rgba(255,159,10,0.1)',  label: 'Follow-up',   Icon: ClipboardList },
  agreement:   { color: '#bf5af2', bg: 'rgba(191,90,242,0.09)', label: 'Agreement',   Icon: Handshake },
  negotiation: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.09)', label: 'Negotiation', Icon: TrendingUp },
};

const DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function dateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function fmtDayLabel(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppleCalendar({ events, loading = false, accentColor = '#0A7E8C' }: Props) {
  const today    = new Date();
  const todayStr = dateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const [year,     setYear]     = useState(today.getFullYear());
  const [month,    setMonth]    = useState(today.getMonth());
  const [selected, setSelected] = useState(todayStr);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfW = new Date(year, month, 1).getDay();

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0);  } else setMonth(m => m + 1); };
  const goToToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(todayStr); };

  const eventsOn     = (ds: string) => events.filter(e => e.date === ds);
  const typesOn      = (ds: string) => [...new Set(eventsOn(ds).map(e => e.type))];
  const todayEvents  = eventsOn(todayStr);
  const selEvents    = eventsOn(selected);
  const isThisMonth  = year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="space-y-4">

      {/* ── Today's Agenda ── */}
      {todayEvents.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden border"
          style={{ borderColor: 'rgba(255,59,48,0.25)', background: 'rgba(255,59,48,0.04)' }}
        >
          <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'rgba(255,59,48,0.15)' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff3b30] flex-shrink-0" />
            <p className="text-[12.5px] font-semibold text-foreground flex-1">
              Today · {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff3b30] text-white">
              {todayEvents.length}
            </span>
          </div>
          <div className="divide-y divide-border/60">
            {todayEvents.map(ev => {
              const cfg = TYPE[ev.type];
              return (
                <div key={ev.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cfg.bg }}>
                    <cfg.Icon size={14} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-semibold text-foreground truncate leading-tight">{ev.title}</p>
                    {ev.subtitle && <p className="text-[11px] text-muted-foreground truncate">{ev.subtitle}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {ev.time && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock size={10} />
                        {ev.time}
                      </div>
                    )}
                    {ev.phone && (
                      <a href={`tel:${ev.phone}`}
                        className="w-7 h-7 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'rgba(52,199,89,0.1)' }}>
                        <Phone size={12} style={{ color: '#30d158' }} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Calendar + Day Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">

        {/* Month Grid */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth}
              className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors flex-shrink-0">
              <ChevronLeft size={14} className="text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-foreground" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                {MONTHS[month]} {year}
              </p>
              {!isThisMonth && (
                <button onClick={goToToday}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors"
                  style={{ backgroundColor: 'rgba(255,59,48,0.1)', color: '#ff3b30' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,59,48,0.18)') }
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,59,48,0.1)') }
                >
                  Today
                </button>
              )}
            </div>
            <button onClick={nextMonth}
              className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors flex-shrink-0">
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDayOfW }).map((_, i) => <div key={`pad${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const ds         = dateStr(year, month, day);
              const isToday    = ds === todayStr;
              const isSelected = ds === selected;
              const types      = typesOn(ds);
              const hasEvents  = types.length > 0;

              let cellBg    = 'transparent';
              let numColor  = 'var(--foreground)';
              let numWeight = '400';
              if (isSelected) { cellBg = accentColor; numColor = '#fff'; numWeight = '700'; }
              else if (isToday) { cellBg = '#ff3b30'; numColor = '#fff'; numWeight = '700'; }

              return (
                <button key={day} onClick={() => setSelected(ds)}
                  className="relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors hover:bg-muted/50 focus:outline-none"
                  style={{ backgroundColor: cellBg }}
                >
                  <span className="text-[12px] leading-none"
                    style={{ color: numColor, fontWeight: numWeight, fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                    {day}
                  </span>
                  {hasEvents && (
                    <div className="flex gap-[2px] mt-[3px] justify-center">
                      {types.slice(0, 3).map(t => (
                        <span key={t} className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                          style={{ backgroundColor: (isSelected || isToday) ? 'rgba(255,255,255,0.65)' : TYPE[t].color }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 pt-4 border-t border-border grid grid-cols-2 gap-x-4 gap-y-2">
            {(Object.entries(TYPE) as [CalEventType, typeof TYPE[CalEventType]][]).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                <span className="text-[10.5px] text-muted-foreground"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                  {cfg.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day Panel */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-foreground flex-1"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
              {fmtDayLabel(selected)}
            </p>
            {selected === todayStr && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(255,59,48,0.1)', color: '#ff3b30' }}>
                Today
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              {selEvents.length} item{selEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-border bg-card flex items-center justify-center py-16">
              <div className="w-5 h-5 rounded-full border-2 border-muted animate-spin"
                style={{ borderTopColor: accentColor }} />
            </div>
          ) : selEvents.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                <Calendar size={20} className="text-muted-foreground opacity-50" />
              </div>
              <p className="text-[13px] font-semibold text-foreground">Nothing scheduled</p>
              <p className="text-[11px] text-muted-foreground mt-1">Select another day to view items</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {selEvents.map(ev => {
                const cfg = TYPE[ev.type];
                return (
                  <div key={ev.id}
                    className="rounded-2xl border border-border bg-card px-4 py-3.5 flex items-start gap-3 hover:shadow-sm transition-shadow"
                    style={{ borderLeft: `3px solid ${cfg.color}` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: cfg.bg }}>
                      <cfg.Icon size={15} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-[13px] font-semibold text-foreground truncate"
                          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                          {ev.title}
                        </p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {ev.status && (
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{ev.status}</span>
                        )}
                      </div>
                      {ev.subtitle && (
                        <p className="text-[11.5px] text-muted-foreground">{ev.subtitle}</p>
                      )}
                      {ev.time && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                          <Clock size={10} />
                          {ev.time}
                        </div>
                      )}
                    </div>
                    {ev.phone && (
                      <a href={`tel:${ev.phone}`}
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: 'rgba(52,199,89,0.1)' }}>
                        <Phone size={13} style={{ color: '#30d158' }} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
