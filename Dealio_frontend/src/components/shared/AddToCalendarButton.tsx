import { CalendarPlus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { type CalendarOpts, googleCalendarUrl, outlookCalendarUrl, downloadICS } from '@/lib/calendarUtils';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const OutlookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
    <rect width="24" height="24" rx="4" fill="#0072C6"/>
    <path d="M13 6h7v12h-7V6z" fill="#0078D4"/>
    <path d="M4 8.5l9-2.5v16L4 19.5V8.5z" fill="#28A8E0"/>
    <ellipse cx="8.5" cy="14" rx="3" ry="3.5" fill="white"/>
    <ellipse cx="8.5" cy="14" rx="2" ry="2.5" fill="#0072C6"/>
  </svg>
);

interface Props {
  opts: CalendarOpts;
  className?: string;
}

export default function AddToCalendarButton({ opts, className }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={
            className ??
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-foreground border border-border bg-muted/40 hover:bg-muted/60 transition-colors'
          }>
          <CalendarPlus size={14} />
          Add to Calendar
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1.5" align="center" side="top">
        <a
          href={googleCalendarUrl(opts)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
          <GoogleIcon />
          <span className="text-[13px] font-medium text-foreground">Google Calendar</span>
        </a>
        <button
          onClick={() => downloadICS(opts)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left">
          <AppleIcon />
          <span className="text-[13px] font-medium text-foreground">Apple Calendar</span>
        </button>
        <a
          href={outlookCalendarUrl(opts)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
          <OutlookIcon />
          <span className="text-[13px] font-medium text-foreground">Outlook</span>
        </a>
      </PopoverContent>
    </Popover>
  );
}
