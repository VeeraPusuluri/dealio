import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { nriConsultations, nriCountries, nriProfiles } from '@/data/nriData';
import { projects } from '@/data/projects';
import { showDualTime } from '@/lib/nriUtils';
import { Video, Calendar, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const consultTypes = [
  { id: 'walkthrough', label: 'Project Walkthrough', desc: 'See a specific project virtually' },
  { id: 'investment', label: 'Investment Advice', desc: 'Help choosing between projects' },
  { id: 'loan', label: 'Loan & Finance', desc: 'NRI home loan process help' },
  { id: 'legal', label: 'Legal Guidance', desc: 'POA, FEMA, TDS questions' },
  { id: 'general', label: 'General Query', desc: 'Other questions' },
];

const timeSlots = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'];
const takenSlots = ['12:00 PM'];
const platforms = ['Google Meet', 'Zoom', 'WhatsApp Video'];

const NRIConsultation = () => {
  const profile = nriProfiles[0];
  const country = nriCountries.find(c => c.name === profile.country)!;
  const [step, setStep] = useState(1);
  const [type, setType] = useState('');
  const [project, setProject] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [platform, setPlatform] = useState('Google Meet');
  const [notes, setNotes] = useState('');
  const [booked, setBooked] = useState(false);

  const upcoming = nriConsultations.filter(c => c.status === 'Confirmed');
  const past = nriConsultations.filter(c => c.status === 'Completed');

  const handleBook = () => {
    setBooked(true);
    toast.success('Consultation booked! Ravi will send a WhatsApp reminder 1hr before.');
  };

  // Generate simple date options (next 7 weekdays)
  const dateOptions: string[] = [];
  const d = new Date();
  while (dateOptions.length < 7) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) dateOptions.push(d.toISOString().split('T')[0]);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Upcoming Consultations</h3>
            {upcoming.map(c => (
              <div key={c.id} className="bg-card rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{c.project} — {c.type}</p>
                  <p className="text-sm text-muted-foreground">{c.date} · {showDualTime(c.timeIST, country.timezone, country.offset)}</p>
                  <p className="text-xs text-muted-foreground mt-1">With {c.cpName} · {c.notes}</p>
                </div>
                <button onClick={() => window.open(c.link, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#0D9488' }}>
                  <ExternalLink size={14} /> Join Meeting
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Book New */}
        {!booked ? (
          <div className="bg-card rounded-xl p-6 border">
            <h3 className="font-semibold mb-4">Book New Consultation</h3>

            {/* Step indicator */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-[#F5A623]' : 'bg-muted'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-2">What do you need?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {consultTypes.map(t => (
                    <button key={t.id} onClick={() => { setType(t.id); setStep(2); }}
                      className={`p-4 rounded-lg border text-left transition-colors ${type === t.id ? 'border-[#F5A623] bg-[#F5A623]/10' : 'border-border hover:bg-muted/50'}`}>
                      <p className="font-medium text-sm">{t.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Select Project</p>
                <select value={project} onChange={e => setProject(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-sm">
                  <option value="">Choose project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.location}</option>)}
                </select>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">Your Advisor</p>
                  <p className="text-xs text-muted-foreground mt-1">Ravi Kumar · Platinum Tier · 4.9 ★ · 42 NRI consultations · Speaks: English, Hindi, Telugu</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg border text-sm">Back</button>
                  <button onClick={() => setStep(3)} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#F5A623' }}>Next</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Pick Date</p>
                <div className="flex flex-wrap gap-2">
                  {dateOptions.map(dd => (
                    <button key={dd} onClick={() => setDate(dd)}
                      className={`px-3 py-2 rounded-lg text-sm border ${date === dd ? 'border-[#F5A623] bg-[#F5A623]/10 font-medium' : 'border-border'}`}>
                      {new Date(dd).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </button>
                  ))}
                </div>
                {date && (
                  <>
                    <p className="text-sm text-muted-foreground mt-2">Pick Time</p>
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map(slot => {
                        const taken = takenSlots.includes(slot);
                        return (
                          <button key={slot} onClick={() => !taken && setTime(slot)} disabled={taken}
                            className={`px-3 py-2 rounded-lg text-xs border ${taken ? 'opacity-40 cursor-not-allowed' : time === slot ? 'border-[#F5A623] bg-[#F5A623]/10 font-medium' : 'border-border'}`}>
                            {showDualTime(slot, country.timezone, country.offset)}
                            {taken && <span className="block text-[10px] text-muted-foreground">Taken</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg border text-sm">Back</button>
                  <button onClick={() => setStep(4)} disabled={!date || !time} className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40" style={{ backgroundColor: '#F5A623' }}>Next</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Platform & Notes</p>
                <div className="flex gap-2">
                  {platforms.map(p => (
                    <button key={p} onClick={() => setPlatform(p)}
                      className={`px-4 py-2 rounded-lg text-sm border ${platform === p ? 'border-[#F5A623] bg-[#F5A623]/10 font-medium' : 'border-border'}`}>{p}</button>
                  ))}
                </div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything specific to discuss?"
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-card text-sm h-20" />
                <div className="flex gap-2">
                  <button onClick={() => setStep(3)} className="px-4 py-2 rounded-lg border text-sm">Back</button>
                  <button onClick={() => setStep(5)} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#F5A623' }}>Review</button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <p className="text-sm font-medium">Review & Confirm</p>
                <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Type:</span> {consultTypes.find(t => t.id === type)?.label}</p>
                  <p><span className="text-muted-foreground">Date:</span> {date && new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p><span className="text-muted-foreground">Time:</span> {time && showDualTime(time, country.timezone, country.offset)}</p>
                  <p><span className="text-muted-foreground">Platform:</span> {platform}</p>
                  <p><span className="text-muted-foreground">Advisor:</span> Ravi Kumar</p>
                  {notes && <p><span className="text-muted-foreground">Notes:</span> {notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(4)} className="px-4 py-2 rounded-lg border text-sm">Back</button>
                  <button onClick={handleBook} className="px-6 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: '#F5A623' }}>Confirm Booking</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-6 border border-green-200 text-center">
            <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
            <h3 className="font-bold text-lg">Consultation Booked!</h3>
            <p className="text-sm text-muted-foreground mt-2">Meeting link will be shared via WhatsApp. Ravi will send a reminder 1hr before.</p>
            <button onClick={() => { setBooked(false); setStep(1); setType(''); setTime(''); setDate(''); }}
              className="mt-4 px-4 py-2 rounded-lg border text-sm">Book Another</button>
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div className="bg-card rounded-xl p-5 border">
            <h3 className="font-semibold mb-3">Past Consultations</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-xs"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Advisor</th><th className="p-2 text-left">Project</th><th className="p-2 text-left">Notes</th></tr></thead>
              <tbody>
                {past.map(c => (
                  <tr key={c.id} className="border-b"><td className="p-2">{c.date}</td><td className="p-2">{c.cpName}</td><td className="p-2">{c.project}</td><td className="p-2 text-muted-foreground">{c.notes}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

function CheckCircle({ size, className }: { size: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}

export default NRIConsultation;
