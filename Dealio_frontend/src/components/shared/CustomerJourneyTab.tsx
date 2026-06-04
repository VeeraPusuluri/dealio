import {
  Search, Bookmark, CalendarDays, MapPin, TrendingUp, FileText,
  CheckCircle2, CreditCard, ShieldCheck, Key, ChevronRight,
  Phone, MessageSquare, Calendar, Upload,
} from 'lucide-react';

/* ── Pipeline stage config ───────────────────────────────────────────── */
interface StageConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  // What the builder should do at this stage
  builderAction: string;
  builderHow: string;
  // What the CP should do at this stage
  cpAction: string;
  cpHow: string;
}

const STAGES: StageConfig[] = [
  {
    id: 'new_lead',
    label: 'New Lead',
    icon: Search,
    color: '#94A3B8',
    builderAction: 'Share project details',
    builderHow: 'Send the project brochure and pricing sheet. Go to Broadcast or reply in this deal.',
    cpAction: 'Introduce the project',
    cpHow: 'Call or WhatsApp the customer. Share the project brochure and schedule a visit.',
  },
  {
    id: 'profile_created',
    label: 'Profile Created',
    icon: Bookmark,
    color: '#8B5CF6',
    builderAction: 'Confirm customer interest',
    builderHow: 'Have your CP reach out to understand requirements and budget before scheduling a visit.',
    cpAction: 'Qualify the lead',
    cpHow: 'Confirm their budget, BHK preference, and preferred location. Then schedule a site visit.',
  },
  {
    id: 'meeting_requested',
    label: 'Visit Requested',
    icon: CalendarDays,
    color: '#3B82F6',
    builderAction: 'Confirm the site visit',
    builderHow: 'Go to Meetings → confirm the date and time. The customer will be notified automatically.',
    cpAction: 'Follow up on visit confirmation',
    cpHow: 'Confirm the visit date with the builder. Remind the customer 24 hours before.',
  },
  {
    id: 'meeting_confirmed',
    label: 'Visit Confirmed',
    icon: Calendar,
    color: '#6366F1',
    builderAction: 'Prepare for the visit',
    builderHow: 'Ensure a sales manager is available. Prepare the unit walkthrough and pricing presentation.',
    cpAction: 'Escort the customer',
    cpHow: 'Coordinate pick-up or meeting point. Accompany the customer for the site visit.',
  },
  {
    id: 'meeting_done',
    label: 'Visit Done',
    icon: MapPin,
    color: '#0A7E8C',
    builderAction: 'Send a pricing quote',
    builderHow: 'Upload a Pricing Quote in the Documents tab and toggle "Share with Customer" to send it.',
    cpAction: 'Gather feedback & negotiate',
    cpHow: 'Call the customer within 24 hrs of the visit. Note their objections and relay to the builder.',
  },
  {
    id: 'negotiation',
    label: 'Negotiation',
    icon: TrendingUp,
    color: '#F59E0B',
    builderAction: 'Share final pricing quote',
    builderHow: 'Upload a Pricing Quote → enable "Share with Customer". Respond to any queries in Messages.',
    cpAction: 'Facilitate the negotiation',
    cpHow: 'Broker between customer and builder. Confirm the final price and relay the quote.',
  },
  {
    id: 'agreement',
    label: 'Agreement',
    icon: FileText,
    color: '#E87722',
    builderAction: 'Send the sale agreement',
    builderHow: 'Upload the Sale Agreement in Documents → enable "Share with Customer". Await confirmation.',
    cpAction: 'Push for customer sign-off',
    cpHow: 'Remind the customer to review and confirm the agreement in their Dealio journey page.',
  },
  {
    id: 'booked',
    label: 'Booked',
    icon: CheckCircle2,
    color: '#16A34A',
    builderAction: 'Process the booking',
    builderHow: 'Collect the booking amount. Generate the Allotment Letter and upload it in Documents.',
    cpAction: 'Track the commission',
    cpHow: 'Confirm the booking with the builder and track your commission status in Commissions.',
  },
  {
    id: 'loan',
    label: 'Loan Processing',
    icon: CreditCard,
    color: '#0A7E8C',
    builderAction: 'Support the loan process',
    builderHow: 'Provide property documents to the bank on request. Monitor loan status in Loan section.',
    cpAction: 'Help with loan documentation',
    cpHow: 'Refer the customer to a bank partner. Follow up on the loan application status.',
  },
  {
    id: 'loan_sanctioned',
    label: 'Loan Sanctioned',
    icon: ShieldCheck,
    color: '#16A34A',
    builderAction: 'Schedule registration',
    builderHow: 'Coordinate the property registration date with the customer and sub-registrar.',
    cpAction: 'Confirm commission release',
    cpHow: 'Remind the builder to release your commission now that loan is sanctioned.',
  },
  {
    id: 'possession',
    label: 'Possession',
    icon: Key,
    color: '#6B3FA0',
    builderAction: 'Complete handover',
    builderHow: 'Conduct the property walkthrough, resolve any snagging, and hand over keys.',
    cpAction: 'Collect review & referral',
    cpHow: 'Ask for a Google/Dealio review and a referral. Commission should now be fully released.',
  },
];

/* ── Map deal status string → stage index ────────────────────────────── */
function resolveStageIndex(status: string): number {
  const s = status.toLowerCase().trim();
  if (s.includes('possession') || s === 'possession given') return 10;
  if (s.includes('registration') || s.includes('closed')) return 9;
  if (s.includes('loan sanctioned') || s.includes('loan disbursed')) return 9;
  if (s.includes('loan application') || s.includes('loan applied')) return 8;
  if (s === 'booked') return 7;
  if (s === 'agreement') return 6;
  if (s === 'negotiation') return 5;
  if (s.includes('meeting done') || s.includes('site visit done')) return 4;
  if (s.includes('meeting confirmed')) return 3;
  if (s.includes('meeting requested') || s.includes('site visit scheduled')) return 2;
  if (s.includes('profile created')) return 1;
  return 0; // new lead
}

interface CustomerJourneyTabProps {
  stage: string;               // deal/lead status string
  customerName: string;
  projectName: string;
  dealValue?: number | null;
  role: 'builder' | 'cp';
  // Optional quick-action callbacks
  onCall?: () => void;
  onWhatsApp?: () => void;
  onScheduleMeeting?: () => void;
  onSendQuote?: () => void;    // builder only
}

export default function CustomerJourneyTab({
  stage,
  customerName,
  projectName,
  dealValue,
  role,
  onCall,
  onWhatsApp,
  onScheduleMeeting,
  onSendQuote,
}: CustomerJourneyTabProps) {
  const currentIdx = resolveStageIndex(stage);
  const current    = STAGES[currentIdx];
  const isComplete = currentIdx >= STAGES.length - 1;
  const nextStage  = !isComplete ? STAGES[Math.min(currentIdx + 1, STAGES.length - 1)] : null;

  const actionText = role === 'builder' ? current.builderAction : current.cpAction;
  const howText    = role === 'builder' ? current.builderHow    : current.cpHow;

  const fmtVal = (v: number) => {
    if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)} Cr`;
    if (v >= 100_000)    return `₹${(v / 100_000).toFixed(0)} L`;
    return `₹${v.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4">

      {/* ── Current position banner ─────────────────────────────────────── */}
      <div
        className="rounded-xl p-3.5 flex items-start gap-3"
        style={{ backgroundColor: current.color + '15', border: `1.5px solid ${current.color}30` }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: current.color }}>
          <current.icon size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-bold text-foreground leading-snug">{customerName}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: current.color }}>
              {current.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{projectName}{dealValue ? ` · ${fmtVal(dealValue)}` : ''}</p>
          <p className="text-[11px] text-muted-foreground">Step {currentIdx + 1} of {STAGES.length}</p>
        </div>
      </div>

      {/* ── Progress stepper ────────────────────────────────────────────── */}
      <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
        <div className="flex items-start gap-0 min-w-max py-1">
          {STAGES.map((s, i) => {
            const isDone    = i < currentIdx;
            const isCurrent = i === currentIdx;
            const Icon      = s.icon;
            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      backgroundColor: isDone ? s.color : isCurrent ? s.color : 'transparent',
                      border: `2px solid ${isDone || isCurrent ? s.color : '#E2E8F0'}`,
                    }}>
                    <Icon size={10} style={{ color: isDone || isCurrent ? '#fff' : '#94A3B8' }} />
                  </div>
                  <span className="text-[8px] font-medium text-center leading-none whitespace-nowrap max-w-[48px] overflow-hidden"
                    style={{ color: isCurrent ? s.color : isDone ? '#64748B' : '#CBD5E1' }}>
                    {s.label}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className="w-6 h-px mb-4 rounded-full mx-0.5"
                    style={{ backgroundColor: i < currentIdx ? STAGES[i].color : '#E2E8F0' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Your next action ────────────────────────────────────────────── */}
      {!isComplete ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {role === 'builder' ? 'Your action' : 'Your action'}
          </p>
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: current.color }}>
              <ChevronRight size={12} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-foreground leading-snug">{actionText}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{howText}</p>
            </div>
          </div>

          {/* Contextual quick-action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {onCall && (
              <button onClick={onCall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-foreground hover:bg-muted transition-colors">
                <Phone size={11} /> Call
              </button>
            )}
            {onWhatsApp && (
              <button onClick={onWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-[11px] font-semibold text-green-700 hover:bg-green-100 transition-colors">
                <MessageSquare size={11} /> WhatsApp
              </button>
            )}
            {onScheduleMeeting && currentIdx <= 3 && (
              <button onClick={onScheduleMeeting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                <Calendar size={11} /> Schedule Visit
              </button>
            )}
            {onSendQuote && role === 'builder' && (currentIdx === 4 || currentIdx === 5) && (
              <button onClick={onSendQuote}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
                <Upload size={11} /> Send Quote
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            <Key size={14} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-emerald-800">Possession Complete</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Keys handed over. Ensure commission is fully released.</p>
          </div>
        </div>
      )}

      {/* ── What's coming next ──────────────────────────────────────────── */}
      {nextStage && currentIdx < STAGES.length - 2 && (
        <div className="rounded-xl border border-dashed border-border p-3.5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0"
            style={{ borderColor: nextStage.color + '60' }}>
            <nextStage.icon size={11} style={{ color: nextStage.color + '80' }} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Next milestone</p>
            <p className="text-[12px] font-semibold text-foreground">{nextStage.label}</p>
            <p className="text-[11px] text-muted-foreground">
              {role === 'builder' ? nextStage.builderAction : nextStage.cpAction}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
