import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useFollowUpStore } from '@/stores/useFollowUpStore';
import { Phone, MessageSquare, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MilestoneChip from '@/components/shared/MilestoneChip';

const CPFollowUps = () => {
  const { followUps, markDone } = useFollowUpStore();
  const today = new Date();
  const [selectedMonth] = useState(today.getMonth());
  const [selectedYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const dayFollowUps = followUps.filter((f) => f.dueDate === selectedDate);

  const getDateStr = (day: number) => `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const hasFU = (day: number) => followUps.some((f) => f.dueDate === getDateStr(day) && !f.done);

  const openWhatsApp = (name: string, project: string, template: string) => {
    const templates: Record<string, string> = {
      'new': `Hi ${name}, I'm your property consultant. I saw you're interested in ${project}. I'd love to share some details. Are you available for a quick call today?`,
      'visit': `Hi ${name}, just a reminder about your site visit at ${project}. Our team is excited to show you around! Reply YES to confirm.`,
      'followup': `Hi ${name}, just checking in on your property search! Have you had time to think about ${project}? I'm here to answer any questions.`,
      'congrats': `Congratulations ${name} on booking your home at ${project}! Our team will be in touch with the next steps. Welcome to the family!`,
    };
    window.open(`https://wa.me/?text=${encodeURIComponent(templates[template] || templates['followup'])}`, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Follow-up Calendar</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="bg-card rounded-lg p-5 card-shadow border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-card-foreground text-sm">
                {new Date(selectedYear, selectedMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h3>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {days.map((day) => {
                const dateStr = getDateStr(day);
                const isToday = dateStr === today.toISOString().split('T')[0];
                const isSelected = dateStr === selectedDate;
                const has = hasFU(day);
                return (
                  <button key={day} onClick={() => setSelectedDate(dateStr)}
                    className={`text-xs py-1.5 rounded-md relative transition-colors ${isSelected ? 'bg-primary text-primary-foreground font-bold' : isToday ? 'bg-accent/20 text-accent font-semibold' : 'text-card-foreground hover:bg-muted'}`}>
                    {day}
                    {has && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-destructive" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day's follow-ups */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-semibold text-card-foreground text-sm">
              Follow-ups for {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              <span className="ml-2 text-xs text-muted-foreground">({dayFollowUps.length} pending)</span>
            </h3>
            {dayFollowUps.length === 0 && (
              <div className="bg-card rounded-lg p-8 card-shadow border border-border text-center">
                <p className="text-muted-foreground text-sm">No follow-ups scheduled for this day</p>
              </div>
            )}
            {dayFollowUps.map((fu) => (
              <div key={fu.id} className="bg-card rounded-lg p-4 card-shadow border border-border flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-card-foreground">{fu.customerName}</p>
                    <MilestoneChip milestone={fu.stage || 'Enquiry'} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{fu.projectName}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{fu.reason}</p>
                  {fu.dueTime && <p className="text-[10px] text-muted-foreground mt-0.5">Scheduled: {fu.dueTime}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => window.open(`tel:+91`, '_blank')} className="gap-1 text-xs">
                    <Phone size={12} />Call
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openWhatsApp(fu.customerName, fu.projectName, 'followup')} className="gap-1 text-xs">
                    <MessageSquare size={12} />WhatsApp
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => markDone(fu.id)} className="gap-1 text-xs text-green-600">
                    <CheckCircle2 size={12} />Done
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPFollowUps;
