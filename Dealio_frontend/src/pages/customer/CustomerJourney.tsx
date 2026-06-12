import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import JourneyTimeline from '@/components/shared/JourneyTimeline';
import { useAuthStore } from '@/stores/useAuthStore';
import { portalApi, builderApi } from '@/lib/api';
import {
  Loader2, AlertCircle, ListChecks, FileText, Clock, CheckCircle2,
  TrendingUp, Handshake, ExternalLink, MessageSquare, Sparkles, ArrowRight,
  Bookmark, Tag, X, Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { STAGE_META, normalizeStage } from '@/lib/dealStages';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DealDoc {
  id: number;
  name: string;
  docType: string;
  fileUrl?: string | null;
  uploadedByRole?: string;
  createdAt: string;
}

interface DealMessage {
  id: number;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

interface CustomerDeal {
  dealId: number;
  projectId: number;
  projectName: string;
  unitType?: string;
  dealStatus: string;
  dealValue?: number | null;
  customerConfirmed?: boolean;
  cpAgreed?: boolean;
  createdAt: string;
  loanCaseId?: number;
  loanAmount?: number;
  loanStatus?: string;
  tenureMonths?: number;
  interestRate?: number;
  dealDocuments?: DealDoc[];
  messages?: DealMessage[];
}

interface ApiMeeting {
  id: number;
  builderId?: number;
  projectId: number;
  projectName: string;
  preferredDate: string;
  confirmedDate?: string;
  status: string;
  createdAt: string;
}

type JourneyStep = {
  label: string;
  date?: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  notes?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateLabel(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtCrore(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)} Cr`;
  if (value >= 100_000)    return `₹${(value / 100_000).toFixed(1)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

// Deal statuses from backend are title-case: 'Negotiation', 'Agreement', 'Booked', etc.
// Journey order uses the actual backend strings (case-insensitive compare below)
const DEAL_STAGE_ORDER = [
  'meeting done',
  'negotiation',
  'agreement',
  'pending booking',
  'booked',
  'loan sanctioned',
  'closed',
];

const LOAN_ORDER = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'];

function dealStageIndex(status: string): number {
  return DEAL_STAGE_ORDER.indexOf(status.toLowerCase());
}

function buildJourney(deals: CustomerDeal[], meetings: ApiMeeting[]): JourneyStep[] {
  const steps: JourneyStep[] = [];

  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  sortedMeetings.forEach(m => {
    const done      = ['Completed', 'COMPLETED'].includes(m.status);
    const cancelled = ['Cancelled', 'CANCELLED'].includes(m.status);
    if (cancelled) return;
    steps.push({
      label: done
        ? `Site Visit Completed — ${m.projectName || 'Project'}`
        : `Site Visit Scheduled — ${m.projectName || 'Project'}`,
      date: toDateLabel(done ? (m.confirmedDate || m.preferredDate) : m.createdAt),
      status: done ? 'completed' : 'in-progress',
    });
  });

  if (deals.length === 0) {
    if (steps.length === 0) return [];
    steps.push({ label: 'Registration', status: 'upcoming' });
    steps.push({ label: 'Possession',   status: 'upcoming' });
    return steps;
  }

  const deal      = deals[0];
  const dealIdx   = dealStageIndex(deal.dealStatus);
  const dealDate  = toDateLabel(deal.createdAt);
  const suffix    = deal.projectName ? ` — ${deal.projectName}` : '';

  if (dealIdx >= dealStageIndex('negotiation'))
    steps.push({ label: `Negotiation${suffix}`, date: dealDate, status: 'completed' });

  if (dealIdx >= dealStageIndex('agreement'))
    steps.push({
      label: `Agreement${suffix}`,
      date: dealDate,
      status: deal.customerConfirmed ? 'completed' : 'in-progress',
      notes: deal.customerConfirmed ? 'Accepted by you' : 'Awaiting your acceptance',
    });

  if (dealIdx >= dealStageIndex('pending booking'))
    steps.push({
      label: `Booking in Progress${suffix}`,
      date: dealDate,
      status: dealIdx >= dealStageIndex('booked') ? 'completed' : 'in-progress',
      notes: 'Builder accepted your signed agreement — your booking is being confirmed.',
    });

  if (dealIdx >= dealStageIndex('booked'))
    steps.push({
      label: `Unit Booked${suffix}`,
      date: dealDate,
      status: 'completed',
      notes: deal.unitType || undefined,
    });

  if (deal.loanCaseId) {
    const loanIdx = deal.loanStatus ? LOAN_ORDER.indexOf(deal.loanStatus) : -1;
    steps.push({ label: 'Home Loan Applied', status: loanIdx >= 0 ? 'completed' : 'in-progress' });
    if (loanIdx >= LOAN_ORDER.indexOf('APPROVED'))
      steps.push({
        label: `Loan Approved${deal.loanAmount ? ` ${fmtCrore(deal.loanAmount)}` : ''}`,
        status: 'completed',
        notes: deal.interestRate && deal.tenureMonths
          ? `${deal.interestRate}% · ${Math.round(deal.tenureMonths / 12)} yrs`
          : undefined,
      });
    if (loanIdx >= LOAN_ORDER.indexOf('DISBURSED'))
      steps.push({ label: 'Loan Disbursed', status: 'completed' });
  }

  if (dealIdx >= dealStageIndex('closed')) {
    steps.push({ label: 'Registration Scheduled', date: dealDate, status: 'completed', notes: 'Sale Deed & Registration Receipt available in your document vault' });
    steps.push({ label: 'Keys Handover Date', date: dealDate, status: 'completed', notes: 'Welcome home — interior vendors are ready to help you set up' });
    steps.push({ label: 'Journey Complete', status: 'completed' });
  } else if (dealIdx >= dealStageIndex('loan sanctioned')) {
    steps.push({ label: 'Registration Pending', status: 'in-progress', notes: 'Documents being prepared' });
    steps.push({ label: 'Possession', status: 'upcoming' });
  } else {
    steps.push({ label: 'Registration', status: 'upcoming' });
    steps.push({ label: 'Possession',   status: 'upcoming' });
  }

  return steps;
}

// ─── Active Deal Card ─────────────────────────────────────────────────────────

function ActiveDealCard({
  deal,
  phone,
  customerName,
  onConfirmed,
  onNegotiationAccepted,
  onMessageSent,
}: {
  deal: CustomerDeal;
  phone: string;
  customerName: string;
  onConfirmed: () => void;
  onNegotiationAccepted: () => void;
  onMessageSent: (msg: DealMessage) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [accepting,  setAccepting]  = useState(false);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [uploadingAgreement, setUploadingAgreement] = useState(false);
  const [submittedAgreement, setSubmittedAgreement] = useState<DealDoc | null>(null);
  const [recipient,  setRecipient]  = useState<'builder' | 'cp'>('builder');
  const [replyText,  setReplyText]  = useState('');
  const [sending,    setSending]    = useState(false);
  const isNegotiation   = deal.dealStatus.toLowerCase() === 'negotiation';
  const isAgreement     = deal.dealStatus.toLowerCase() === 'agreement';
  const isPendingBooking = deal.dealStatus.toLowerCase() === 'pending booking';

  async function handleSendMessage() {
    const text = replyText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await portalApi.sendDealMessage(deal.dealId, phone, recipient, text);
      onMessageSent({
        id: Date.now(),
        senderName: customerName || 'You',
        senderRole: 'customer',
        message: text,
        createdAt: new Date().toISOString(),
      });
      setReplyText('');
      toast.success(`Message sent to ${recipient === 'builder' ? 'the builder' : 'your channel partner'}`);
    } catch (err) {
      toast.error((err as Error).message || 'Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const cardCls = isNegotiation
    ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
    : isPendingBooking
    ? 'bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200'
    : 'bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200';

  const badgeCls = isNegotiation
    ? 'bg-amber-100 text-amber-800 border border-amber-300'
    : isPendingBooking
    ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
    : 'bg-blue-100 text-blue-800 border border-blue-300';

  const stageLabel  = isNegotiation ? 'Negotiation in progress' : isPendingBooking ? 'Booking in progress' : 'Agreement reached';
  const stageNote   = isNegotiation
    ? 'Your channel partner is coordinating with the builder on pricing and terms.'
    : isPendingBooking
    ? 'The builder accepted your signed agreement — your booking is now being confirmed.'
    : 'The builder has shared an agreement. Please review and confirm your acceptance.';

  async function handleConfirm() {
    setConfirming(true);
    try {
      await portalApi.confirmDeal(deal.dealId, phone);
      toast.success('Acceptance confirmed! The builder has been notified.');
      onConfirmed();
    } catch (err) {
      toast.error((err as Error).message || 'Could not confirm. Please try again.');
    } finally {
      setConfirming(false);
    }
  }

  async function handleAcceptNegotiation() {
    setAccepting(true);
    try {
      await portalApi.acceptNegotiation(deal.dealId, phone);
      toast.success('Negotiation accepted! Moving to the Agreement stage.');
      onNegotiationAccepted();
    } catch (err) {
      toast.error((err as Error).message || 'Could not accept. Please try again.');
    } finally {
      setAccepting(false);
    }
  }

  async function handleUploadAgreement() {
    if (!agreementFile || uploadingAgreement) return;
    setUploadingAgreement(true);
    try {
      const doc = await portalApi.uploadSignedAgreement(deal.dealId, phone, agreementFile);
      toast.success('Signed agreement submitted to the builder!');
      setSubmittedAgreement(doc as DealDoc);
      setAgreementFile(null);
    } catch (err) {
      toast.error((err as Error).message || 'Could not upload the agreement. Please try again.');
    } finally {
      setUploadingAgreement(false);
    }
  }

  const signedAgreementDoc = submittedAgreement
    ?? deal.dealDocuments?.find(d => d.docType === 'Signed Agreement' && d.uploadedByRole === 'customer')
    ?? null;

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${cardCls}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: isNegotiation
                ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                : 'linear-gradient(135deg,#0A7E8C,#0d9488)',
            }}
          >
            {isNegotiation ? (
              <TrendingUp size={18} className="text-white" />
            ) : (
              <Handshake size={18} className="text-white" />
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Deal</p>
            <h2 className="text-base font-bold text-gray-900 leading-tight">
              {deal.projectName || 'Your Property'}
            </h2>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${badgeCls}`}>
          {stageLabel}
        </span>
      </div>

      {/* Deal value */}
      {deal.dealValue ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Deal value:</span>
          <span className="text-sm font-semibold text-gray-900">{fmtCrore(deal.dealValue)}</span>
        </div>
      ) : null}

      {/* Stage explanation */}
      <p className="text-sm text-gray-600 leading-relaxed">{stageNote}</p>

      {/* Accept negotiation — moves the deal forward to Agreement once you're happy with the terms */}
      {isNegotiation && (
        <div className="space-y-1.5">
          <button
            onClick={handleAcceptNegotiation}
            disabled={accepting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
          >
            {accepting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Handshake size={15} />
            )}
            {accepting ? 'Accepting…' : 'Accept Negotiation & Proceed'}
          </button>
          <p className="text-xs text-gray-400">
            Happy with the pricing and terms? Accepting will move this deal to the Agreement stage.
          </p>
        </div>
      )}

      {/* Confirm button / confirmed badge — only shown at Agreement stage */}
      {isAgreement && (
        deal.customerConfirmed ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
            <CheckCircle2 size={17} className="text-teal-600" />
            You've confirmed acceptance
          </div>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}
          >
            {confirming ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            {confirming ? 'Confirming…' : 'Confirm Acceptance'}
          </button>
        )
      )}

      {/* Upload signed agreement — available once the customer has confirmed acceptance */}
      {(isAgreement || isPendingBooking) && deal.customerConfirmed && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <FileText size={11} /> Signed Agreement
          </p>
          {signedAgreementDoc ? (
            <div className="flex items-center gap-3 bg-white/70 border border-gray-200 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                <CheckCircle2 size={15} className="text-teal-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{signedAgreementDoc.name}</p>
                <p className="text-xs text-gray-400">
                  {isPendingBooking ? 'Accepted by the builder — your booking is being processed' : 'Submitted to the builder for review'}
                </p>
              </div>
              {signedAgreementDoc.fileUrl && (
                <a href={signedAgreementDoc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 shrink-0">
                  <ExternalLink size={12} /> View
                </a>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                Print, sign, and upload your copy of the agreement so the builder can countersign and proceed.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-dashed border-gray-300 bg-white/70 text-sm text-gray-600 cursor-pointer hover:border-teal-300 transition-colors">
                  <FileText size={15} className="text-gray-400 shrink-0" />
                  <span className="truncate">{agreementFile ? agreementFile.name : 'Choose a PDF, image, or Word file…'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    className="hidden"
                    onChange={e => setAgreementFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  onClick={handleUploadAgreement}
                  disabled={!agreementFile || uploadingAgreement}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity shrink-0"
                  style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}
                >
                  {uploadingAgreement ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  {uploadingAgreement ? 'Uploading…' : 'Submit to Builder'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Documents — shown for both negotiation and agreement stages */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {isNegotiation ? 'Pricing & Documents' : 'Documents from Builder'}
        </p>
        {(deal.dealDocuments && deal.dealDocuments.length > 0) ? (
          deal.dealDocuments.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 bg-white/70 border border-gray-200 rounded-xl px-4 py-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                doc.docType === 'Pricing Quote' ? 'bg-teal-50' : 'bg-blue-50'
              }`}>
                <FileText size={15} className={doc.docType === 'Pricing Quote' ? 'text-teal-500' : 'text-blue-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                <p className="text-xs text-gray-400">{doc.docType}</p>
              </div>
              {doc.fileUrl ? (
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 shrink-0">
                  <ExternalLink size={12} /> Open
                </a>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium shrink-0">
                  <Clock size={12} /> Pending
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 italic bg-white/60 rounded-xl px-4 py-3 border border-dashed border-gray-200">
            {isNegotiation
              ? 'Your pricing quote will appear here once the builder shares it.'
              : 'Documents will appear here once the builder shares them.'}
          </p>
        )}
      </div>

      {/* Messages from builder/CP */}
      {deal.messages && deal.messages.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <MessageSquare size={11} /> Messages
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {deal.messages.map(msg => {
              const isBuilder = msg.senderRole === 'builder';
              const isCP      = msg.senderRole === 'cp';
              return (
                <div key={msg.id} className={`rounded-xl px-3.5 py-2.5 text-sm ${
                  isBuilder
                    ? 'bg-teal-50 border border-teal-100'
                    : isCP
                      ? 'bg-orange-50 border border-orange-100'
                      : 'bg-white/70 border border-gray-200'
                }`}>
                  <p className={`text-[10px] font-bold mb-0.5 ${
                    isBuilder ? 'text-teal-600' : isCP ? 'text-orange-600' : 'text-gray-500'
                  }`}>
                    {msg.senderName} · {isBuilder ? 'Builder' : isCP ? 'Channel Partner' : msg.senderRole === 'customer' ? 'You' : msg.senderRole}
                  </p>
                  <p className="text-gray-800 leading-relaxed">{msg.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(msg.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact builder / CP — available while negotiating pricing & terms */}
      {isNegotiation && (
        <div className="space-y-2.5 pt-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <MessageSquare size={11} /> Conversations
          </p>
          <p className="text-xs text-gray-500">
            Have a question about pricing or terms? Message the builder or your channel partner directly.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setRecipient('builder')}
              className={`flex-1 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${
                recipient === 'builder'
                  ? 'bg-teal-50 border-teal-300 text-teal-700'
                  : 'bg-white/70 border-gray-200 text-gray-500 hover:text-gray-700'
              }`}
            >
              Builder
            </button>
            <button
              onClick={() => setRecipient('cp')}
              className={`flex-1 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${
                recipient === 'cp'
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'bg-white/70 border-gray-200 text-gray-500 hover:text-gray-700'
              }`}
            >
              Channel Partner
            </button>
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={2}
              placeholder={`Write a message to your ${recipient === 'builder' ? 'builder' : 'channel partner'}…`}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white/80 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 resize-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !replyText.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity shrink-0"
              style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              {sending ? '' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shortlist a unit & request pricing (pre-negotiation) ────────────────────

interface UnitRow { id: string; tower: string; floor: number; unit: number; bhk: string; areaSqft?: number; price?: number; status: string; facing?: string; }
interface ShortlistEntry { id: number; projectId: number; unitId: string; status: string; builderNote: string | null; }

function pricingRequestedKey(shortlistId: number) { return `dealio_pricing_requested_${shortlistId}`; }

function ShortlistAndPricingCard({ meetings, phone }: { meetings: ApiMeeting[]; phone: string }) {
  const eligibleMeetings = meetings.filter(m =>
    ['Completed', 'COMPLETED'].includes(m.status) && m.builderId != null,
  );

  const [loading,    setLoading]    = useState(true);
  const [shortlist,  setShortlist]  = useState<ShortlistEntry | null>(null);
  const [pricingRequested, setPricingRequested] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const [picking,    setPicking]    = useState<ApiMeeting | null>(null);
  const [units,      setUnits]      = useState<UnitRow[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const projectIds = eligibleMeetings.map(m => m.projectId);

  useEffect(() => {
    if (!phone || eligibleMeetings.length === 0) { setLoading(false); return; }
    setLoading(true);
    portalApi.getMyShortlists(phone)
      .then(data => {
        const list = (data as ShortlistEntry[]) || [];
        const match = list.find(s => projectIds.includes(s.projectId)) ?? null;
        setShortlist(match);
        if (match) setPricingRequested(localStorage.getItem(pricingRequestedKey(match.id)) === '1');
      })
      .catch(() => setShortlist(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, eligibleMeetings.length]);

  if (loading || eligibleMeetings.length === 0) return null;

  const matchedMeeting = shortlist ? eligibleMeetings.find(m => m.projectId === shortlist.projectId) : undefined;

  async function openPicker(meeting: ApiMeeting) {
    setPicking(meeting);
    setSelectedUnit(null);
    setUnitsLoading(true);
    try {
      const project = await builderApi.getProject(meeting.builderId!, meeting.projectId) as {
        unitMatrix?: UnitRow[]; totalUnits?: number; configurations?: string[]; floorsPerTower?: number;
      };
      if (project?.unitMatrix?.length) {
        setUnits(project.unitMatrix.filter(u => u.status === 'Available'));
      } else {
        const total   = project?.totalUnits ?? 0;
        const configs = project?.configurations ?? ['2 BHK'];
        const floors  = project?.floorsPerTower ?? Math.max(1, Math.min(Math.ceil(total / 4), 15));
        const perFloor = Math.max(1, Math.ceil(total / floors));
        const synthetic: UnitRow[] = [];
        for (let f = 1; f <= floors && synthetic.length < total; f++) {
          for (let u = 1; u <= perFloor && synthetic.length < total; u++) {
            synthetic.push({ id: `A-${f}0${u}`, tower: 'A', floor: f, unit: u, bhk: configs[(u - 1) % configs.length], status: 'Available' });
          }
        }
        setUnits(synthetic);
      }
    } catch { toast.error('Could not load units'); setPicking(null); }
    finally { setUnitsLoading(false); }
  }

  async function handleShortlist() {
    if (!picking || !selectedUnit || !phone) return;
    setSubmitting(true);
    try {
      await portalApi.shortlistUnit({
        customerPhone: phone,
        builderId: picking.builderId!,
        projectId: picking.projectId,
        unitId: selectedUnit.id,
        unitDetails: selectedUnit,
      });
      toast.success(`Unit ${selectedUnit.id} shortlisted! The builder will review it.`);
      setShortlist({ id: Date.now(), projectId: picking.projectId, unitId: selectedUnit.id, status: 'Pending', builderNote: null });
      setPicking(null);
      setSelectedUnit(null);
    } catch (err) { toast.error((err as Error).message || 'Failed to shortlist unit'); }
    finally { setSubmitting(false); }
  }

  async function handleRequestPricing() {
    if (!shortlist || !matchedMeeting || requesting) return;
    setRequesting(true);
    try {
      await portalApi.requestPricing({
        builderId: matchedMeeting.builderId!,
        projectId: shortlist.projectId,
        customerPhone: phone,
        unitId: shortlist.unitId,
        unitDetails: { unitId: shortlist.unitId },
        note: 'Please share a pricing quote for this unit.',
      });
      localStorage.setItem(pricingRequestedKey(shortlist.id), '1');
      setPricingRequested(true);
      toast.success('Pricing request sent to the builder!');
    } catch (err) { toast.error((err as Error).message || 'Could not send pricing request'); }
    finally { setRequesting(false); }
  }

  return (
    <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/60 to-cyan-50/40 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
          <Bookmark size={18} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Found a unit you like?</p>
          <h2 className="text-base font-bold text-gray-900 leading-tight">Shortlist it & request pricing</h2>
        </div>
      </div>

      {!shortlist ? (
        <>
          <p className="text-sm text-gray-600 leading-relaxed">
            After your site visit, shortlist the unit you're interested in — the builder will review it and you can then request a pricing quote.
          </p>
          <div className="space-y-2">
            {eligibleMeetings.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-3 bg-white/70 border border-gray-200 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.projectName || 'Project'}</p>
                  <p className="text-xs text-gray-400">Visited {toDateLabel(m.confirmedDate || m.preferredDate)}</p>
                </div>
                <button
                  onClick={() => openPicker(m)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shrink-0 hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}
                >
                  <Bookmark size={13} /> Shortlist a Unit
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-white/70 border border-gray-200 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
              <Bookmark size={15} className="text-teal-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800">Unit {shortlist.unitId} shortlisted</p>
              <p className="text-xs text-gray-400">{matchedMeeting?.projectName || 'Project'} · {shortlist.status === 'Pending' ? 'Awaiting builder review' : shortlist.status}</p>
            </div>
          </div>

          {pricingRequested ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-teal-700">
              <CheckCircle2 size={17} className="text-teal-600" />
              Pricing request sent — the builder will share a quote soon.
            </div>
          ) : (
            <button
              onClick={handleRequestPricing}
              disabled={requesting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
            >
              {requesting ? <Loader2 size={15} className="animate-spin" /> : <Tag size={15} />}
              {requesting ? 'Sending…' : 'Request Pricing'}
            </button>
          )}
        </div>
      )}

      {/* Unit picker modal */}
      {picking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setPicking(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-900">Pick a unit</p>
                <p className="text-xs text-gray-400">{picking.projectName}</p>
              </div>
              <button onClick={() => setPicking(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {unitsLoading ? (
                <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-teal-500" /></div>
              ) : units.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No available units found.</p>
              ) : units.map(u => {
                const isSelected = selectedUnit?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUnit(u)}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      isSelected ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-white hover:border-teal-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">Unit {u.id} · {u.bhk}</p>
                      <p className="text-xs text-gray-400">
                        Tower {u.tower} · Floor {u.floor === 0 ? 'Ground' : u.floor}
                        {u.areaSqft ? ` · ${u.areaSqft} sqft` : ''}
                      </p>
                    </div>
                    {isSelected && <CheckCircle2 size={18} className="text-teal-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleShortlist}
                disabled={!selectedUnit || submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Bookmark size={15} />}
                {submitting ? 'Shortlisting…' : selectedUnit ? `Shortlist Unit ${selectedUnit.id}` : 'Select a unit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

// ─── Journey threads — one journey per meeting (links customer · builder · CP) ───
// Every site-visit booking is its own thread, keyed by its Meeting id — the unique handle
// that links the three parties' rows (Meeting.customerId / builderId / cpId, and the Deal
// it becomes via Deal.builderId / customerId / cpId). The matching deal attaches to its
// most recent visit; a deal with no visit gets its own thread.

interface JourneyThread {
  key: string;
  projectId: number;
  projectName: string;
  /** Unique per-thread handle shown to the user — "Visit #<meetingId>" or "Deal #<dealId>". */
  handle: string;
  deal: CustomerDeal | null;
  meetings: ApiMeeting[];
  lastActivity: number;
}

function buildThreads(deals: CustomerDeal[], meetings: ApiMeeting[]): JourneyThread[] {
  const threads: JourneyThread[] = [];
  const claimedDeals = new Set<number>();

  // Newest visit first, so when several visits share a project the deal attaches to the
  // most recent one and older visits stay visit-only threads.
  const sortedMeetings = [...meetings].sort(
    (a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0),
  );

  sortedMeetings.forEach(m => {
    let deal: CustomerDeal | null = null;
    if (m.projectId != null) {
      const match = deals.find(d => d.projectId === m.projectId && !claimedDeals.has(d.dealId));
      if (match) { deal = match; claimedDeals.add(match.dealId); }
    }
    threads.push({
      key:        `m${m.id}`,
      projectId:  m.projectId,
      projectName: m.projectName || deal?.projectName || '',
      handle:     `Visit #${m.id}`,
      deal,
      meetings:   [m],
      lastActivity: Math.max(
        new Date(m.createdAt).getTime() || 0,
        deal ? (new Date(deal.createdAt).getTime() || 0) : 0,
      ),
    });
  });

  // Deals that never matched a visit → their own thread.
  deals.forEach(d => {
    if (claimedDeals.has(d.dealId)) return;
    threads.push({
      key:        `d${d.dealId}`,
      projectId:  d.projectId,
      projectName: d.projectName || '',
      handle:     `Deal #${d.dealId}`,
      deal:       d,
      meetings:   [],
      lastActivity: new Date(d.createdAt).getTime() || 0,
    });
  });

  return threads.sort((a, b) => b.lastActivity - a.lastActivity);
}

const PRE_DEAL_STAGES = ['', 'meeting requested', 'meeting confirmed', 'meeting done', 'new lead', 'enquiry'];

type ThreadKind = 'visit' | 'deal';

// A thread counts as a "deal" once a real transaction is underway (negotiation onwards),
// otherwise it's still a "visit". Drives the Visits / Deals filter.
function threadKind(thread: JourneyThread): ThreadKind {
  const status = thread.deal?.dealStatus?.toLowerCase() ?? '';
  return thread.deal && !PRE_DEAL_STAGES.includes(status) ? 'deal' : 'visit';
}

// The current-stage chip for a thread — the deal stage when a deal is underway, else the
// site-visit status. Gives an at-a-glance answer to "where is this visit right now?".
function threadStage(thread: JourneyThread): { label: string; badge: string; color: string } {
  const status = thread.deal?.dealStatus?.toLowerCase() ?? '';
  if (thread.deal && !PRE_DEAL_STAGES.includes(status)) {
    const meta = STAGE_META[normalizeStage(thread.deal.dealStatus)];
    return { label: meta.label, badge: meta.badge, color: meta.color };
  }
  const s = (thread.meetings[0]?.status ?? '').toLowerCase();
  if (s.includes('cancel'))    return { label: 'Visit Cancelled',   badge: 'bg-rose-50 text-rose-700 border-rose-200',         color: '#e11d48' };
  if (s.includes('complet'))   return { label: 'Visit Completed',   badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', color: '#059669' };
  if (s.includes('reschedul')) return { label: 'Visit Rescheduled', badge: 'bg-amber-50 text-amber-700 border-amber-200',       color: '#d97706' };
  if (s.includes('follow'))    return { label: 'Follow-up Needed',  badge: 'bg-amber-50 text-amber-700 border-amber-200',       color: '#d97706' };
  if (s.includes('confirm'))   return { label: 'Visit Confirmed',   badge: 'bg-blue-50 text-blue-700 border-blue-200',          color: '#2563eb' };
  if (thread.meetings.length)  return { label: 'Visit Requested',   badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',    color: '#6366f1' };
  return { label: 'In Progress', badge: 'bg-gray-50 text-gray-600 border-gray-200', color: '#94a3b8' };
}

// ─── Possession card (interior-vendor activation, shown when a thread closes) ────

function PossessionCard({ deal }: { deal: CustomerDeal }) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,#8B5CF6,#D946EF)' }}>
          <Sparkles size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Interior Vendor — now available</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Keys handed over for {deal.projectName || 'your home'}! Hire a trusted interior vendor directly from your portal — book a free consult to get quotes for design, modular kitchen, painting and more.
          </p>
        </div>
        <Link to="/customer/meeting"
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shrink-0 hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg,#8B5CF6,#D946EF)' }}>
          Hire a Vendor <ArrowRight size={13} />
        </Link>
      </div>

      <div className="border-t border-violet-200/70 pt-3 flex flex-wrap gap-x-6 gap-y-2">
        {[
          { label: 'Unit Marked SOLD', done: true },
          { label: 'Loan Disbursed', done: deal.loanStatus === 'DISBURSED' || !deal.loanCaseId },
          { label: 'Journey Complete', done: true },
          { label: 'Interior Vendor Activated', done: true },
        ].map(item => (
          <span key={item.label} className={`flex items-center gap-1.5 text-xs font-medium ${item.done ? 'text-emerald-700' : 'text-gray-400'}`}>
            <CheckCircle2 size={13} className={item.done ? 'text-emerald-600' : 'text-gray-300'} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── One journey thread (per property) ──────────────────────────────────────────

function JourneyThreadCard({
  thread, phone, customerName, onReload,
}: {
  thread: JourneyThread;
  phone: string;
  customerName: string;
  onReload: () => void;
}) {
  const [deal, setDeal] = useState<CustomerDeal | null>(thread.deal);
  useEffect(() => { setDeal(thread.deal); }, [thread.deal]);

  const status    = deal?.dealStatus.toLowerCase() ?? '';
  const isActive  = status === 'negotiation' || status === 'agreement' || status === 'pending booking';
  const isClosed  = status === 'closed';
  const isPreDeal = !deal || PRE_DEAL_STAGES.includes(status);

  const steps  = buildJourney(deal ? [deal] : [], thread.meetings);
  const handle = thread.handle;
  const stage  = threadStage(thread);

  return (
    <div
      className="rounded-2xl border border-gray-200/70 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-500"
      style={{ borderLeft: `3px solid ${stage.color}` }}
    >
      {/* Header strip — handle · project · current stage · deal room */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-gray-50/70 to-transparent">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11px] font-bold text-white px-2 py-0.5 rounded-md shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg,#6366F1,#818CF8)' }}>
            {handle}
          </span>
          <h2 className="text-[15px] font-bold text-gray-900 truncate tracking-tight">{thread.projectName || 'Your Property'}</h2>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${stage.badge}`}>
            {stage.label}
          </span>
          {deal && (
            <Link to={`/customer/deals/${deal.dealId}`}
              className="hidden sm:flex items-center gap-1 text-xs font-semibold text-secondary hover:gap-1.5 transition-all">
              Deal Room <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Pre-negotiation: shortlist a unit & request pricing (self-hides until a visit is done) */}
        {isPreDeal && <ShortlistAndPricingCard meetings={thread.meetings} phone={phone} />}

        {/* Active deal — negotiation / agreement / pending booking */}
        {isActive && deal && (
          <ActiveDealCard
            deal={deal}
            phone={phone}
            customerName={customerName}
            onConfirmed={() => setDeal(prev => prev ? { ...prev, customerConfirmed: true } : prev)}
            onNegotiationAccepted={onReload}
            onMessageSent={(msg) => setDeal(prev => prev ? { ...prev, messages: [...(prev.messages ?? []), msg] } : prev)}
          />
        )}

        {/* Milestone timeline */}
        {steps.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle size={22} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No milestones yet for this property.</p>
          </div>
        ) : (
          <JourneyTimeline steps={steps} />
        )}

        {/* Possession reached */}
        {isClosed && deal && <PossessionCard deal={deal} />}
      </div>
    </div>
  );
}

const CustomerJourney = () => {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState<JourneyThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty,   setEmpty]   = useState(false);
  const [filter,  setFilter]  = useState<'all' | ThreadKind>('all');

  const phone = user?.phone ?? '';

  const load = useCallback(() => {
    if (!phone) { setLoading(false); setEmpty(true); return; }
    Promise.all([portalApi.getMyDeals(phone), portalApi.getMyMeetings(phone)])
      .then(([dealsData, meetingsData]) => {
        const deals    = (dealsData    as CustomerDeal[]) || [];
        const meetings = (meetingsData as ApiMeeting[])   || [];
        // One journey thread per property — each links the customer, builder and CP
        // through its deal/meeting rows and tracks its own milestones independently.
        const built = buildThreads(deals, meetings);
        setThreads(built);
        setEmpty(built.length === 0);
      })
      .catch(() => toast.error('Could not load journey'))
      .finally(() => setLoading(false));
  }, [phone]);

  useEffect(() => { load(); }, [load]);

  const visitCount = threads.filter(t => threadKind(t) === 'visit').length;
  const dealCount  = threads.length - visitCount;
  const filtered   = filter === 'all' ? threads : threads.filter(t => threadKind(t) === filter);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50/60 px-5 sm:px-6 py-5">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-indigo-300/20 blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25"
              style={{ background: 'linear-gradient(135deg, #6366F1, #818CF8)' }}
            >
              <ListChecks size={22} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Property Journey</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track every milestone from first visit to possession</p>
            </div>
            {!loading && !empty && (
              <div className="ml-auto hidden sm:flex items-stretch gap-2.5">
                <div className="px-4 py-2 rounded-xl bg-white/70 border border-indigo-100 text-center backdrop-blur-sm">
                  <p className="text-lg font-bold text-gray-900 leading-none">{threads.length}</p>
                  <p className="text-[10px] font-medium text-gray-500 mt-1 uppercase tracking-wide">Journeys</p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/70 border border-indigo-100 text-center backdrop-blur-sm">
                  <p className="text-lg font-bold text-gray-900 leading-none">{dealCount}</p>
                  <p className="text-[10px] font-medium text-gray-500 mt-1 uppercase tracking-wide">Active deals</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-secondary" />
          </div>
        ) : empty ? (
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6">
            <div className="flex flex-col items-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
                <ListChecks size={28} className="text-indigo-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-base">No journeys yet</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Schedule a site visit or book a unit, and your property journey will appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Filter — view all journeys, just site visits, or active/closed deals */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100/80 border border-gray-200/70 w-fit">
              {([
                ['all',   'All',    threads.length],
                ['visit', 'Visits', visitCount],
                ['deal',  'Deals',  dealCount],
              ] as const).map(([key, label, count]) => {
                const active = filter === key;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {label}
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                      active ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200/80 text-gray-500'
                    }`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-12 text-center">
                <p className="text-sm text-gray-400">
                  No {filter === 'deal' ? 'active deals' : 'site visits'} to show.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {filtered.map(t => (
                  <JourneyThreadCard
                    key={t.key}
                    thread={t}
                    phone={phone}
                    customerName={user?.name ?? ''}
                    onReload={load}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CustomerJourney;
