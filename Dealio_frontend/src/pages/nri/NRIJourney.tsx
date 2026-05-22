import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle2, Circle, Clock, ArrowDown } from 'lucide-react';

const steps = [
  { label: 'Enquiry via CPConnect', date: 'Dec 10, 2024', detail: 'Connected with CP Ravi Kumar', status: 'done' },
  { label: 'Video Consultation #1', date: 'Dec 18, 2024', detail: 'Discussed My Home Avatar 4BHK via Zoom', status: 'done' },
  { label: 'Video Consultation #2', date: 'Dec 22, 2024', detail: 'Virtual tour of Tower C units', status: 'done' },
  { label: 'Unit Shortlisted', date: 'Dec 24, 2024', detail: 'Tower C, Unit 1204 — 4BHK, 2,400sqft, ₹2.2Cr', status: 'done' },
  { label: 'Negotiation Complete', date: 'Dec 26, 2024', detail: 'Price locked at ₹2.2Cr. No further changes.', status: 'done' },
  { label: 'Unit Booked', date: 'Dec 28, 2024', detail: 'Booking amount ₹22L paid via NRE account. Allotment letter received.', status: 'done' },
  { label: 'POA Executed', date: 'Jan 2, 2025', detail: 'Suresh Mehta (Brother) authorised via Specific POA', status: 'done' },
  { label: 'Home Loan Applied', date: 'Jan 5, 2025', detail: '₹1.65Cr applied at HDFC Bank. Ref: HDFC-2025-00124', status: 'done' },
  { label: 'Loan Sanctioned', date: 'Jan 12, 2025', detail: '₹1.65Cr sanctioned. EMI: ₹1,38,500/month for 20 years.', status: 'done' },
  { label: 'Loan Disbursement', date: 'In Progress', detail: 'Bank processing. Expected: Jan 25', status: 'current' },
  { label: 'Construction Progress Updates', date: 'Upcoming', detail: 'Builder sends quarterly photos', status: 'pending' },
  { label: 'Pre-Possession Inspection', date: 'Sep 2025', detail: '', status: 'pending' },
  { label: 'Possession & Key Handover', date: 'Sep 2025', detail: '', status: 'pending' },
  { label: 'Property Registration', date: 'Sep 2025', detail: 'Your POA nominee will sign on your behalf', status: 'pending' },
];

const NRIJourney = () => {
  const doneCount = steps.filter(s => s.status === 'done').length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress */}
        <div className="bg-card rounded-xl p-5 border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">Your Property Journey</h2>
            <span className="text-sm font-medium" style={{ color: '#F5A623' }}>{pct}% complete</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#F5A623' }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Possession in ~180 days</p>
        </div>

        {/* Timeline */}
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                {step.status === 'done' ? (
                  <CheckCircle2 size={22} className="text-green-500 flex-shrink-0" />
                ) : step.status === 'current' ? (
                  <div className="w-[22px] h-[22px] rounded-full border-2 border-amber-400 flex items-center justify-center animate-pulse flex-shrink-0">
                    <Clock size={12} className="text-amber-500" />
                  </div>
                ) : (
                  <Circle size={22} className="text-muted-foreground/40 flex-shrink-0" />
                )}
                {i < steps.length - 1 && <div className={`w-px flex-1 min-h-[24px] ${step.status === 'done' ? 'bg-green-300' : 'bg-border'}`} />}
              </div>
              <div className={`pb-6 ${step.status === 'pending' ? 'opacity-50' : ''}`}>
                <div className={`rounded-lg p-3 ${step.status === 'current' ? 'border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20' : 'bg-card border'}`}>
                  <p className="text-sm font-semibold">{step.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.date}</p>
                  {step.detail && <p className="text-xs text-muted-foreground mt-1">{step.detail}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NRIJourney;
