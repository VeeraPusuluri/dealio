import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEK   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

interface DatePickerFieldProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  fromYear?: number;
  toYear?: number;
  minDate?: string;
}

export default function DatePickerField({
  value, onChange, label, placeholder = 'Select date',
  required, error, fromYear, toYear, minDate,
}: DatePickerFieldProps) {
  const now = new Date();
  const fy  = fromYear ?? now.getFullYear() - 5;
  const ty  = toYear   ?? now.getFullYear() + 15;
  const [open,      setOpen]      = useState(false);
  const [viewYear,  setViewYear]  = useState(() => value ? +value.slice(0, 4) : now.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? +value.slice(5, 7) - 1 : now.getMonth());
  const years = Array.from({ length: ty - fy + 1 }, (_, i) => fy + i);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow    = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const isoOf      = (d: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const isSelected = (d: number) => value === isoOf(d);
  const isToday    = (d: number) => now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === d;
  const isDisabled = (d: number) => !!minDate && isoOf(d) < minDate;
  const displayValue = value ? `${value.slice(8)} ${MONTHS[+value.slice(5, 7) - 1]} ${value.slice(0, 4)}` : null;

  const triggerClass = `w-full h-10 px-3.5 py-2.5 rounded-xl border text-[13px] transition-all outline-none bg-background text-foreground
    flex items-center justify-between gap-2 text-left
    ${error ? 'border-destructive focus:ring-2 focus:ring-destructive/20' : 'border-border focus:ring-2 focus:ring-ring/20 focus:border-ring'}`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] block">
          {label}{required && <span className="text-destructive"> *</span>}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={triggerClass}>
            <span className={displayValue ? 'text-foreground' : 'text-muted-foreground'}>
              {displayValue ?? placeholder}
            </span>
            <CalendarIcon size={13} className="text-muted-foreground shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0 w-56 rounded-xl shadow-lg border border-border bg-card">
          <div className="flex items-center gap-1 px-2 pt-2.5 pb-1.5">
            <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={13} />
            </button>
            <div className="flex-1 flex items-center justify-center gap-1">
              <select value={viewMonth} onChange={e => setViewMonth(+e.target.value)}
                className="text-[12px] font-semibold text-foreground bg-transparent outline-none cursor-pointer">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={viewYear} onChange={e => setViewYear(+e.target.value)}
                className="text-[12px] font-semibold text-foreground bg-transparent outline-none cursor-pointer">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-7 px-2 mb-0.5">
            {WEEK.map(d => <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-0.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 px-2 pb-2.5 gap-y-0.5">
            {cells.map((day, i) =>
              day === null ? <div key={i} /> : (
                <button key={i} type="button"
                  disabled={isDisabled(day)}
                  onClick={() => { if (!isDisabled(day)) { onChange(isoOf(day)); setOpen(false); } }}
                  className={`h-7 w-full text-[12px] rounded-lg font-medium transition-colors
                    ${isDisabled(day) ? 'text-muted-foreground opacity-40 cursor-not-allowed' :
                      isSelected(day) ? 'text-white' :
                      isToday(day) ? 'text-foreground font-bold' :
                      'text-foreground hover:bg-muted'}`}
                  style={isSelected(day) ? { background: '#0A7E8C' } : isToday(day) && !isDisabled(day) ? { backgroundColor: '#0A7E8C18' } : undefined}>
                  {day}
                </button>
              )
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}
