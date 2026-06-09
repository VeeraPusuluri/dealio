import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi, customerApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Loader2, X, ChevronRight, MessageSquare, FileText, IndianRupee,
  User, Phone, Building2, Clock, Send, Plus, ExternalLink,
  CheckCircle2, AlertCircle, Handshake, BarChart3,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DealDoc {
  id: number;
  name: string;
  docType: string;
  fileUrl?: string | null;
  uploadedByRole: string;
  sharedWithCp: boolean;
  sharedWithCustomer: boolean;
  createdAt: string;
}

interface DealMsg {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

interface PayInstallment {
  installment: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid';
}

interface DealDetail {
  id: number;
  status: string;
  dealValue?: number | null;
  customerName: string;
  customerPhone: string;
  projectName: string;
  projectId: number;
  cpName?: string | null;
  cpPhone?: string | null;
  cpTier: string;
  commissionPercent: number;
  commissionAmount?: number | null;
  cpAgreed: boolean;
  customerConfirmed: boolean;
  commissionStatus?: string | null;
  paymentSchedule?: PayInstallment[] | null;
  messages: DealMsg[];
  dealDocuments: DealDoc[];
  createdAt: string;
  updatedAt: string;
}

interface DealSummary {
  id: number;
  status: string;
  dealValue?: number | null;
  customerName: string;
  projectName: string;
  cpName?: string | null;
  commissionStatus?: string | null;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STAGES = ['Meeting Done', 'Negotiation', 'Agreement', 'Pending Booking', 'Booked', 'Closed'] as const;
type DealStage = typeof STAGES[number];

function dealStageIndexOf(status: string): number {
  return STAGES.indexOf(status as DealStage);
}

function fmtCurrency(v?: number | null): string {
  if (v == null) return '—';
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)} Cr`;
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(1)} L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STAGE_COLORS: Record<string, string> = {
  'Meeting Done':    '#0A7E8C',
  'Negotiation':     '#D97706',
  'Agreement':       '#2563EB',
  'Pending Booking': '#0891B2',
  'Booked':          '#059669',
  'Closed':          '#7C3AED',
};

const STAGE_BG: Record<string, string> = {
  'Meeting Done':    'bg-teal-50 text-teal-700 border-teal-200',
  'Negotiation':     'bg-amber-50 text-amber-700 border-amber-200',
  'Agreement':       'bg-blue-50 text-blue-700 border-blue-200',
  'Pending Booking': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Booked':          'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Closed':          'bg-violet-50 text-violet-700 border-violet-200',
};

const TIER_STYLES: Record<string, string> = {
  Silver:   'bg-slate-100 text-slate-700 border-slate-300',
  Gold:     'bg-amber-100 text-amber-700 border-amber-300',
  Platinum: 'bg-indigo-100 text-indigo-700 border-indigo-300',
};

const TIER_DOT: Record<string, string> = {
  Silver:   '#64748b',
  Gold:     '#D97706',
  Platinum: '#4F46E5',
};

const DOC_TYPES = ['Pricing Quote', 'Sale Agreement', 'Allotment Letter', 'Sale Deed', 'Registration Copy', 'Other'] as const;

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-8 h-4 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#0A7E8C]' : 'bg-slate-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

// ─── Deal Detail Drawer ───────────────────────────────────────────────────────

export function DealDrawer({
  dealSummary,
  builderId,
  userId,
  onClose,
  onRefreshList,
}: {
  dealSummary: DealSummary;
  builderId: string;
  userId: number;
  onClose: () => void;
  onRefreshList: () => void;
}) {
  const [tab, setTab] = useState<'overview' | 'timeline' | 'messages' | 'documents' | 'commission'>('overview');
  const [detail, setDetail] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageUpdating, setStageUpdating] = useState(false);

  // Messages state
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Documents state
  const [docForm, setDocForm] = useState({ docType: 'Pricing Quote', sharedWithCp: false, sharedWithCustomer: false });
  const [docFile, setDocFile] = useState<File | null>(null);
  const [addingDoc, setAddingDoc] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [togglingDoc, setTogglingDoc] = useState<number | null>(null);
  const [acceptingAgreement, setAcceptingAgreement] = useState(false);

  const openQuoteForm = () => {
    setDocForm({ docType: 'Pricing Quote', sharedWithCp: false, sharedWithCustomer: true });
    setShowDocForm(true);
    setTab('documents');
  };

  // Payment schedule state
  const [scheduleForm, setScheduleForm] = useState({ installment: '', amount: '', dueDate: '', status: 'Pending' as 'Pending' | 'Paid' });
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // CP assignment state
  interface CPOption { id: number; fullName: string; phone?: string; }
  const [availableCPs, setAvailableCPs] = useState<CPOption[]>([]);
  const [assigningCP, setAssigningCP] = useState(false);
  const [showCPAssign, setShowCPAssign] = useState(false);

  // Commission
  const [releasingComm, setReleasingComm] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await builderApi.getDeal(builderId, dealSummary.id) as DealDetail;
      setDetail(data);
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to load deal details');
    } finally {
      setLoading(false);
    }
  }, [builderId, dealSummary.id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  useEffect(() => {
    customerApi.getAvailableCPs()
      .then(d => setAvailableCPs((d as CPOption[]) || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'messages') {
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [tab, detail?.messages]);

  // ── Stage Update ──
  const handleStageUpdate = async (newStage: string) => {
    if (!detail || stageUpdating) return;
    setStageUpdating(true);
    try {
      await builderApi.updateBuilderDealStatus(builderId, detail.id, newStage);
      await loadDetail();
      onRefreshList();
      toast.success(`Stage updated to ${newStage}`);
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to update stage');
    } finally {
      setStageUpdating(false);
    }
  };

  // ── Accept signed agreement → move deal to Pending Booking ──
  const handleAcceptAgreement = async () => {
    if (!detail || acceptingAgreement) return;
    setAcceptingAgreement(true);
    try {
      await builderApi.acceptSignedAgreement(builderId, detail.id);
      await loadDetail();
      onRefreshList();
      toast.success('Agreement accepted — deal moved to Pending Booking');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to accept agreement');
    } finally {
      setAcceptingAgreement(false);
    }
  };

  // ── Send Message ──
  const handleSendMsg = async () => {
    if (!detail || !msgText.trim() || sendingMsg) return;
    const text = msgText.trim();
    setSendingMsg(true);
    setMsgText('');
    try {
      await builderApi.sendDealMessage(builderId, detail.id, text);
      const newMsg: DealMsg = {
        id: Date.now(),
        senderId: userId,
        senderName: 'You',
        senderRole: 'builder',
        message: text,
        createdAt: new Date().toISOString(),
      };
      setDetail(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev);
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to send message');
      setMsgText(text);
    } finally {
      setSendingMsg(false);
    }
  };

  // ── Add Document ──
  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !docFile || addingDoc) return;
    setAddingDoc(true);
    try {
      const result = await builderApi.uploadDealDocument(
        builderId, detail.id, docFile,
        docForm.docType, docForm.sharedWithCp, docForm.sharedWithCustomer,
      ) as DealDoc;
      setDetail(prev => prev ? { ...prev, dealDocuments: [...prev.dealDocuments, result] } : prev);
      setDocForm({ docType: 'Pricing Quote', sharedWithCp: false, sharedWithCustomer: false });
      setDocFile(null);
      setShowDocForm(false);
      toast.success('Document uploaded');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to upload document');
    } finally {
      setAddingDoc(false);
    }
  };

  // ── Share Document Toggle ──
  const handleShareToggle = async (doc: DealDoc, field: 'sharedWithCp' | 'sharedWithCustomer') => {
    if (!detail || togglingDoc === doc.id) return;
    setTogglingDoc(doc.id);
    const updated = { sharedWithCp: doc.sharedWithCp, sharedWithCustomer: doc.sharedWithCustomer, [field]: !doc[field] };
    try {
      await builderApi.shareDealDocument(builderId, detail.id, doc.id, updated);
      setDetail(prev => prev ? {
        ...prev,
        dealDocuments: prev.dealDocuments.map(d => d.id === doc.id ? { ...d, ...updated } : d),
      } : prev);
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to update sharing');
    } finally {
      setTogglingDoc(null);
    }
  };

  // ── Add Installment ──
  const handleAddInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !scheduleForm.installment.trim() || !scheduleForm.amount || !scheduleForm.dueDate || savingSchedule) return;
    setSavingSchedule(true);
    const newItem: PayInstallment = {
      installment: scheduleForm.installment.trim(),
      amount: parseFloat(scheduleForm.amount),
      dueDate: scheduleForm.dueDate,
      status: scheduleForm.status,
    };
    const updatedSchedule = [...(detail.paymentSchedule ?? []), newItem];
    try {
      await builderApi.setPaymentSchedule(builderId, detail.id, updatedSchedule);
      setDetail(prev => prev ? { ...prev, paymentSchedule: updatedSchedule } : prev);
      setScheduleForm({ installment: '', amount: '', dueDate: '', status: 'Pending' });
      setShowScheduleForm(false);
      toast.success('Installment added');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  // ── Release Commission ──
  const handleReleaseCommission = async () => {
    if (!detail || releasingComm) return;
    setReleasingComm(true);
    try {
      await builderApi.releaseBuilderCommission(builderId, detail.id);
      toast.success('Commission released');
      await loadDetail();
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to release commission');
    } finally {
      setReleasingComm(false);
    }
  };

  const tabs = [
    { key: 'overview',    label: 'Overview',    icon: BarChart3 },
    { key: 'timeline',    label: 'Timeline',    icon: Clock },
    { key: 'messages',    label: 'Messages',    icon: MessageSquare },
    { key: 'documents',   label: 'Documents',   icon: FileText },
    { key: 'commission',  label: 'Commission',  icon: IndianRupee },
  ] as const;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-card flex flex-col shadow-2xl border-l border-border overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0A7E8C10 0%, transparent 100%)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#0A7E8C18', color: '#0A7E8C' }}>
              <Handshake size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[14px] font-bold text-foreground truncate">{dealSummary.customerName}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground truncate">{dealSummary.projectName}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STAGE_BG[dealSummary.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                  {dealSummary.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <Link
              to={`/builder/deals/${dealSummary.id}`}
              title="Open the shared Deal Room"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-[#0A7E8C] hover:bg-[#0A7E8C12] transition-colors"
            >
              <ExternalLink size={13} /> Deal Room
            </Link>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-border flex-shrink-0 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3.5 py-3 text-[11px] font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
                tab === key
                  ? 'border-[#0A7E8C] text-[#0A7E8C]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-muted/20">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : !detail ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-6">
              <AlertCircle size={24} className="text-muted-foreground mb-2" />
              <p className="text-[13px] text-muted-foreground">Failed to load deal details</p>
              <button onClick={loadDetail} className="mt-3 text-[12px] text-[#0A7E8C] hover:underline">Retry</button>
            </div>
          ) : (
            <div className="p-5 space-y-4">

              {/* ── OVERVIEW TAB ── */}
              {tab === 'overview' && (
                <>
                  {/* Send Quote CTA — shown when in Negotiation and no quote sent yet */}
                  {detail.status === 'Negotiation' && !detail.dealDocuments.some(d => d.docType === 'Pricing Quote' && d.sharedWithCustomer) && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <FileText size={16} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-amber-900">Customer awaiting your price quote</p>
                        <p className="text-[11px] text-amber-700 mt-0.5">Upload a pricing quote and share it directly with the customer to move the deal forward.</p>
                      </div>
                      <button
                        onClick={openQuoteForm}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}
                      >
                        <Plus size={12} /> Send Quote
                      </button>
                    </div>
                  )}

                  {/* Deal Value Hero */}
                  <div className="bg-card rounded-2xl border border-border p-4 shadow-sm text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">Deal Value</p>
                    <p className="text-[28px] font-black leading-tight" style={{ color: '#0A7E8C' }}>
                      {fmtCurrency(detail.dealValue)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">{detail.projectName}</p>
                  </div>

                  {/* Stage Progression */}
                  <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-3">Stage Progress</p>
                    <div className="flex flex-wrap gap-2">
                      {STAGES.map((s) => {
                        const isActive = detail.status === s;
                        const color = STAGE_COLORS[s];
                        return (
                          <button
                            key={s}
                            disabled={stageUpdating}
                            onClick={() => handleStageUpdate(s)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                              isActive
                                ? 'text-white border-transparent shadow-sm'
                                : 'bg-card hover:opacity-80 border-border text-muted-foreground hover:text-foreground'
                            }`}
                            style={isActive ? { backgroundColor: color, borderColor: color } : {}}
                          >
                            {stageUpdating && isActive
                              ? <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" />{s}</span>
                              : s
                            }
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Customer</p>
                    <div className="flex items-center gap-2.5">
                      <User size={14} style={{ color: '#0A7E8C' }} />
                      <span className="text-[13px] font-semibold text-foreground">{detail.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone size={14} style={{ color: '#0A7E8C' }} />
                      <a href={`tel:${detail.customerPhone}`} className="text-[13px] text-foreground hover:text-[#0A7E8C] transition-colors">
                        {detail.customerPhone}
                      </a>
                    </div>
                    {detail.customerConfirmed && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span className="text-[11px] text-emerald-700 font-medium">Customer Confirmed</span>
                      </div>
                    )}
                  </div>

                  {/* CP Info + Assign */}
                  <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Channel Partner</p>
                      <button
                        onClick={() => setShowCPAssign(v => !v)}
                        className="text-[10px] font-semibold text-[#0A7E8C] hover:opacity-75 transition-opacity">
                        {detail.cpName ? 'Change' : '+ Assign CP'}
                      </button>
                    </div>

                    {detail.cpName ? (
                      <>
                        <div className="flex items-center gap-2.5">
                          <User size={14} style={{ color: '#0A7E8C' }} />
                          <span className="text-[13px] font-semibold text-foreground">{detail.cpName}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ml-auto ${TIER_STYLES[detail.cpTier] ?? 'bg-muted text-muted-foreground border-border'}`}>
                            {detail.cpTier}
                          </span>
                        </div>
                        {detail.cpPhone && (
                          <div className="flex items-center gap-2.5">
                            <Phone size={14} style={{ color: '#0A7E8C' }} />
                            <a href={`tel:${detail.cpPhone}`} className="text-[13px] text-foreground hover:text-[#0A7E8C] transition-colors">
                              {detail.cpPhone}
                            </a>
                          </div>
                        )}
                        {detail.cpAgreed && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span className="text-[11px] text-emerald-700 font-medium">CP Agreed</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-[12px] text-muted-foreground">No CP assigned — click "+ Assign CP" to link one.</p>
                    )}

                    {showCPAssign && (
                      <div className="pt-2 border-t border-border space-y-2">
                        <p className="text-[10px] text-muted-foreground">Select a CP to assign:</p>
                        <div className="max-h-36 overflow-y-auto space-y-1">
                          {availableCPs.length === 0 && <p className="text-[11px] text-muted-foreground">No CPs available</p>}
                          {availableCPs.map(cp => (
                            <button
                              key={cp.id}
                              disabled={assigningCP}
                              onClick={async () => {
                                setAssigningCP(true);
                                try {
                                  await builderApi.assignCPToDeal(builderId, detail.id, cp.id);
                                  toast.success(`${cp.fullName} assigned to this deal`);
                                  setShowCPAssign(false);
                                  loadDetail();
                                } catch { toast.error('Failed to assign CP'); }
                                finally { setAssigningCP(false); }
                              }}
                              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl border border-border hover:border-[#0A7E8C] hover:bg-teal-50/40 transition-all text-[12px]">
                              <User size={12} style={{ color: '#0A7E8C' }} />
                              <span className="font-medium text-foreground">{cp.fullName}</span>
                              {cp.phone && <span className="text-muted-foreground ml-auto text-[10px]">{cp.phone}</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Schedule */}
                  <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Payment Schedule</p>
                      <button
                        onClick={() => setShowScheduleForm(v => !v)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#0A7E8C] hover:opacity-80 transition-opacity"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>

                    {(detail.paymentSchedule?.length ?? 0) === 0 && !showScheduleForm ? (
                      <p className="text-[12px] text-muted-foreground text-center py-3">No installments yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left font-semibold text-muted-foreground pb-2 pr-2">Installment</th>
                              <th className="text-right font-semibold text-muted-foreground pb-2 pr-2">Amount</th>
                              <th className="text-left font-semibold text-muted-foreground pb-2 pr-2">Due Date</th>
                              <th className="text-center font-semibold text-muted-foreground pb-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {(detail.paymentSchedule ?? []).map((inst, idx) => (
                              <tr key={idx}>
                                <td className="py-2 pr-2 text-foreground font-medium">{inst.installment}</td>
                                <td className="py-2 pr-2 text-right font-semibold" style={{ color: '#0A7E8C' }}>{fmtCurrency(inst.amount)}</td>
                                <td className="py-2 pr-2 text-muted-foreground">{fmtDate(inst.dueDate)}</td>
                                <td className="py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    inst.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                  }`}>{inst.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {showScheduleForm && (
                      <form onSubmit={handleAddInstallment} className="mt-4 space-y-2.5 border-t border-border pt-4">
                        <p className="text-[11px] font-bold text-foreground">Add Installment</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            required
                            value={scheduleForm.installment}
                            onChange={e => setScheduleForm(f => ({ ...f, installment: e.target.value }))}
                            placeholder="Label (e.g. Booking)"
                            className="px-3 py-2 rounded-xl border border-border bg-muted/40 text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground"
                          />
                          <input
                            required
                            type="number"
                            min="1"
                            value={scheduleForm.amount}
                            onChange={e => setScheduleForm(f => ({ ...f, amount: e.target.value }))}
                            placeholder="Amount (₹)"
                            className="px-3 py-2 rounded-xl border border-border bg-muted/40 text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground"
                          />
                          <input
                            required
                            type="date"
                            value={scheduleForm.dueDate}
                            onChange={e => setScheduleForm(f => ({ ...f, dueDate: e.target.value }))}
                            className="px-3 py-2 rounded-xl border border-border bg-muted/40 text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                          />
                          <select
                            value={scheduleForm.status}
                            onChange={e => setScheduleForm(f => ({ ...f, status: e.target.value as 'Pending' | 'Paid' }))}
                            className="px-3 py-2 rounded-xl border border-border bg-muted/40 text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={savingSchedule}
                            className="flex-1 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-1.5"
                            style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}
                          >
                            {savingSchedule ? <Loader2 size={12} className="animate-spin" /> : null}
                            Save Installment
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowScheduleForm(false)}
                            className="px-4 py-2 rounded-xl text-[12px] text-muted-foreground border border-border hover:bg-muted transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </>
              )}

              {/* ── TIMELINE TAB ── */}
              {tab === 'timeline' && (
                <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground mb-4">Deal Activity</p>
                  <div className="space-y-1">
                    {(() => {
                      const events: { label: string; date: string; color: string; sub?: string }[] = [
                        { label: 'Deal Created', date: detail.createdAt, color: '#0A7E8C', sub: `Customer: ${detail.customerName}` },
                        ...(detail.messages ?? []).map(m => ({
                          label: `Message from ${m.senderName}`,
                          date: m.createdAt,
                          color: m.senderRole === 'builder' ? '#0A7E8C' : m.senderRole === 'cp' ? '#E87722' : '#6B7280',
                          sub: m.message.length > 60 ? m.message.slice(0, 60) + '…' : m.message,
                        })),
                        ...(detail.dealDocuments ?? []).map(d => ({
                          label: `Document uploaded: ${d.name}`,
                          date: d.createdAt,
                          color: '#6B3FA0',
                          sub: `${d.docType}${d.sharedWithCustomer ? ' · shared with customer' : ''}${d.sharedWithCp ? ' · shared with CP' : ''}`,
                        })),
                        { label: `Current stage: ${detail.status}`, date: detail.updatedAt, color: STAGE_COLORS[detail.status] ?? '#94a3b8' },
                      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                      return events.map((e, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
                            <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: e.color }} />
                            {i < events.length - 1 && <div className="w-px flex-1 mt-1 bg-border min-h-[16px]" />}
                          </div>
                          <div className="flex-1 pb-3 min-w-0">
                            <p className="text-[12px] font-semibold text-foreground leading-tight">{e.label}</p>
                            {e.sub && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{e.sub}</p>}
                            <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDate(e.date)}</p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* ── MESSAGES TAB ── */}
              {tab === 'messages' && (
                <div className="flex flex-col" style={{ minHeight: '400px' }}>
                  <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col flex-1">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px] max-h-[400px]">
                      {detail.messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 text-center">
                          <MessageSquare size={28} className="text-muted-foreground opacity-40 mb-2" />
                          <p className="text-[12px] text-muted-foreground">No messages yet. Start the conversation.</p>
                        </div>
                      )}
                      {detail.messages.map((msg) => {
                        const isBuilder = msg.senderRole === 'builder';
                        return (
                          <div key={msg.id} className={`flex ${isBuilder ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                              isBuilder
                                ? 'bg-[#0A7E8C] text-white rounded-br-sm'
                                : 'bg-muted text-foreground rounded-bl-sm border border-border'
                            }`}>
                              {!isBuilder && (
                                <p className="text-[10px] font-bold mb-1 opacity-70">{msg.senderName} · {msg.senderRole}</p>
                              )}
                              <p className="text-[13px] leading-relaxed">{msg.message}</p>
                              <p className={`text-[10px] mt-1 ${isBuilder ? 'opacity-70 text-right' : 'text-muted-foreground'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={msgEndRef} />
                    </div>

                    <div className="border-t border-border p-3 flex gap-2">
                      <input
                        value={msgText}
                        onChange={e => setMsgText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMsg()}
                        placeholder="Message CP or customer…"
                        className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted/40 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground"
                      />
                      <button
                        onClick={handleSendMsg}
                        disabled={sendingMsg || !msgText.trim()}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-50 flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}
                      >
                        {sendingMsg ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DOCUMENTS TAB ── */}
              {tab === 'documents' && (
                <>
                  <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Deal Documents</p>
                      <div className="flex items-center gap-2">
                        {detail.status === 'Negotiation' && (
                          <button
                            onClick={openQuoteForm}
                            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white"
                            style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}
                          >
                            <FileText size={11} /> Send Quote
                          </button>
                        )}
                        <button
                          onClick={() => setShowDocForm(v => !v)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#0A7E8C] hover:opacity-80"
                        >
                          <Plus size={12} /> Add Document
                        </button>
                      </div>
                    </div>

                    {detail.dealDocuments.length === 0 && !showDocForm && (
                      <p className="text-[12px] text-muted-foreground text-center py-4">No documents yet</p>
                    )}

                    {detail.dealDocuments.map(doc => (
                      <div key={doc.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                        <FileText size={15} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <p className="text-[13px] font-semibold text-foreground truncate">{doc.name}</p>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex-shrink-0">
                              {doc.docType}
                            </span>
                            {doc.fileUrl && (
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-0.5 text-[11px] text-[#0A7E8C] hover:underline flex-shrink-0"
                              >
                                <ExternalLink size={10} /> Open
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <Toggle
                                checked={doc.sharedWithCp}
                                onChange={() => handleShareToggle(doc, 'sharedWithCp')}
                                disabled={togglingDoc === doc.id}
                              />
                              Send to CP
                            </label>
                            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <Toggle
                                checked={doc.sharedWithCustomer}
                                onChange={() => handleShareToggle(doc, 'sharedWithCustomer')}
                                disabled={togglingDoc === doc.id}
                              />
                              Send to Customer
                            </label>
                          </div>

                          {doc.docType === 'Signed Agreement' && doc.uploadedByRole === 'customer' && (
                            detail.status === 'Agreement' ? (
                              <button
                                onClick={handleAcceptAgreement}
                                disabled={acceptingAgreement}
                                className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                                style={{ backgroundColor: '#0A7E8C' }}
                              >
                                {acceptingAgreement
                                  ? <><Loader2 size={11} className="animate-spin" /> Accepting…</>
                                  : <><CheckCircle2 size={11} /> Accept Agreement &amp; Move to Pending Booking</>}
                              </button>
                            ) : (dealStageIndexOf(detail.status) > dealStageIndexOf('Agreement')) && (
                              <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} /> Agreement accepted
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    ))}

                    {showDocForm && (
                      <form onSubmit={handleAddDoc} className="space-y-3 border-t border-border pt-4 mt-2">
                        <p className="text-[11px] font-bold text-foreground">Upload Document</p>

                        {/* File drop zone */}
                        <label className={`flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed cursor-pointer transition-colors py-5 ${
                          docFile ? 'border-teal-400 bg-teal-50/40' : 'border-border hover:border-teal-300 hover:bg-muted/30'
                        }`}>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                            className="hidden"
                            onChange={e => setDocFile(e.target.files?.[0] ?? null)}
                          />
                          {docFile ? (
                            <>
                              <FileText size={20} className="text-teal-600" />
                              <span className="text-[12px] font-semibold text-teal-700 text-center px-2 truncate max-w-full">{docFile.name}</span>
                              <span className="text-[10px] text-teal-500">{(docFile.size / 1024).toFixed(0)} KB · click to change</span>
                            </>
                          ) : (
                            <>
                              <FileText size={20} className="text-muted-foreground" />
                              <span className="text-[12px] font-medium text-foreground">Click to choose a file</span>
                              <span className="text-[10px] text-muted-foreground">PDF, Word, JPG, PNG — max 20 MB</span>
                            </>
                          )}
                        </label>

                        <select
                          value={docForm.docType}
                          onChange={e => setDocForm(f => ({ ...f, docType: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-muted/40 text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                        >
                          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-[12px] text-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={docForm.sharedWithCp}
                              onChange={e => setDocForm(f => ({ ...f, sharedWithCp: e.target.checked }))}
                              className="rounded"
                            />
                            Share with CP
                          </label>
                          <label className="flex items-center gap-2 text-[12px] text-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              checked={docForm.sharedWithCustomer}
                              onChange={e => setDocForm(f => ({ ...f, sharedWithCustomer: e.target.checked }))}
                              className="rounded"
                            />
                            Share with Customer
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={addingDoc || !docFile}
                            className="flex-1 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                            style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}
                          >
                            {addingDoc ? <><Loader2 size={12} className="animate-spin" /> Uploading…</> : 'Upload Document'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowDocForm(false); setDocFile(null); }}
                            className="px-4 py-2 rounded-xl text-[12px] text-muted-foreground border border-border hover:bg-muted transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </>
              )}

              {/* ── COMMISSION TAB ── */}
              {tab === 'commission' && (
                <>
                  {/* Tier Hero */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col items-center text-center gap-3">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${TIER_DOT[detail.cpTier] ?? '#94a3b8'}18` }}>
                      <span className="text-2xl font-black" style={{ color: TIER_DOT[detail.cpTier] ?? '#94a3b8' }}>
                        {detail.cpTier?.[0] ?? '?'}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[12px] font-bold px-3 py-1 rounded-full border ${TIER_STYLES[detail.cpTier] ?? 'bg-muted text-muted-foreground border-border'}`}>
                        {detail.cpTier} Partner
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{detail.cpName ?? 'No CP assigned'}</p>
                  </div>

                  {/* Commission Details */}
                  <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Commission Breakdown</p>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">Rate</p>
                        <p className="text-[20px] font-black" style={{ color: '#0A7E8C' }}>{detail.commissionPercent}%</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">Deal Value</p>
                        <p className="text-[14px] font-bold text-foreground leading-tight">{fmtCurrency(detail.dealValue)}</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 border border-border p-3 text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">Commission</p>
                        <p className="text-[14px] font-bold leading-tight" style={{ color: TIER_DOT[detail.cpTier] ?? '#0A7E8C' }}>
                          {fmtCurrency(detail.commissionAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Agreement flags */}
                    <div className="flex gap-3">
                      <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium ${
                        detail.cpAgreed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-muted border-border text-muted-foreground'
                      }`}>
                        {detail.cpAgreed ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        CP Agreed
                      </div>
                      <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium ${
                        detail.customerConfirmed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-muted border-border text-muted-foreground'
                      }`}>
                        {detail.customerConfirmed ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                        Customer Confirmed
                      </div>
                    </div>

                    {/* Payout eligibility status */}
                    {(() => {
                      const released = detail.commissionStatus === 'Released';
                      const eligible = !released && (detail.status === 'Booked' || detail.status === 'Closed') && detail.cpAgreed && detail.customerConfirmed;
                      if (!released && !eligible) return null;
                      return (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-semibold ${
                          released ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {released ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          {released ? 'Commission paid out' : 'Eligible for payout'}
                        </div>
                      );
                    })()}

                    {/* Release Button */}
                    <button
                      onClick={handleReleaseCommission}
                      disabled={releasingComm}
                      className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}
                    >
                      {releasingComm ? <Loader2 size={14} className="animate-spin" /> : <IndianRupee size={14} />}
                      Release Commission
                    </button>
                  </div>
                </>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function BuilderDealsPanel({ builderId: externalBid, embedded }: { builderId?: string | null; embedded?: boolean } = {}) {
  const user = useAuthStore(s => s.user);
  const [builderId, setBuilderId] = useState<string | null>(externalBid ?? null);
  const [deals, setDeals] = useState<DealSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedDeal, setSelectedDeal] = useState<DealSummary | null>(null);

  const loadDeals = useCallback(async (bid: string) => {
    setLoading(true);
    try {
      const data = await builderApi.getBuilderDeals(bid) as DealSummary[];
      setDeals(data ?? []);
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to load deals');
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (externalBid) { setBuilderId(externalBid); loadDeals(externalBid); return; }
    if (!user?.id) return;
    (async () => {
      let bid = builderApi.getCachedBuilderId();
      if (!bid) {
        try {
          const email = user.email || `uid${user.id}@dealio.builder`;
          const res = await builderApi.ensureBuilder(user.name || '', email, user.phone, user.id) as { builderId: number };
          bid = String(res.builderId);
          builderApi.setCachedBuilderId(bid);
        } catch {
          setLoading(false);
          return;
        }
      }
      setBuilderId(bid);
      await loadDeals(bid);
    })();
  }, [user?.id, externalBid, loadDeals]);

  const filtered = filter === 'all' ? deals : deals.filter(d => d.status === filter);

  // Stats
  const stats = [
    { label: 'Total Deals', value: deals.length, color: '#0A7E8C', bg: 'bg-card' },
    { label: 'Negotiation', value: deals.filter(d => d.status === 'Negotiation').length, color: '#D97706', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Agreement', value: deals.filter(d => d.status === 'Agreement').length, color: '#2563EB', bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { label: 'Booked / Closed', value: deals.filter(d => d.status === 'Booked' || d.status === 'Closed').length, color: '#059669', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  ];

  const selClass = 'px-3 py-2 rounded-xl bg-card border border-border text-[12px] text-foreground outline-none focus:ring-2 focus:ring-ring/20 transition-all';

  const inner = (
    <>
      <div className="flex flex-col gap-4">

        {/* ── Header ── */}
        {!embedded && <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-foreground leading-tight">Deal Management</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {deals.length} deal{deals.length !== 1 ? 's' : ''} · click any deal to open details
            </p>
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className={selClass}>
            <option value="all">All Deals</option>
            <option value="Meeting Done">Meeting Done</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Agreement">Agreement</option>
            <option value="Pending Booking">Pending Booking</option>
            <option value="Booked">Booked</option>
            <option value="Closed">Closed</option>
          </select>
        </div>}
        {embedded && <div className="flex items-center justify-between flex-shrink-0">
          <p className="text-[12px] text-muted-foreground">{deals.length} deal{deals.length !== 1 ? 's' : ''}</p>
          <select value={filter} onChange={e => setFilter(e.target.value)} className={selClass}>
            <option value="all">All</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Agreement">Agreement</option>
            <option value="Pending Booking">Pending Booking</option>
            <option value="Booked">Booked</option>
            <option value="Closed">Closed</option>
          </select>
        </div>}

        {/* ── Stats Row ── */}
        {!loading && deals.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
            {stats.map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-2xl border border-border ${bg} px-4 py-3 flex items-center gap-3`}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
                  <p className="text-[22px] font-black text-foreground leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Deal List ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Handshake size={26} className="text-muted-foreground" />
            </div>
            <p className="text-[14px] font-bold text-foreground mb-1">No deals found</p>
            <p className="text-[13px] text-muted-foreground max-w-xs mx-auto">
              {filter === 'all'
                ? 'Deals will appear here once meetings are done and negotiations begin.'
                : `No deals with status "${filter}".`}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(deal => {
              const stageStyle = STAGE_BG[deal.status] ?? 'bg-muted text-muted-foreground border-border';
              const stageColor = STAGE_COLORS[deal.status] ?? '#94a3b8';
              const initials = deal.customerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div
                  key={deal.id}
                  onClick={() => { if (builderId) setSelectedDeal(deal); }}
                  className="bg-card rounded-2xl border border-border p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-ring/40 transition-all duration-150 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[12px] font-black text-white"
                        style={{ backgroundColor: stageColor }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-bold text-foreground leading-tight truncate">{deal.customerName}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Building2 size={11} className="text-muted-foreground flex-shrink-0" />
                          <span className="text-[12px] text-muted-foreground truncate">{deal.projectName}</span>
                          {deal.cpName && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-[12px] text-muted-foreground truncate">CP: {deal.cpName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${stageStyle}`}>
                        {deal.status}
                      </span>
                      {deal.dealValue != null && (
                        <span className="text-[13px] font-bold" style={{ color: '#0A7E8C' }}>
                          {fmtCurrency(deal.dealValue)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{fmtDate(deal.createdAt)}</span>
                      {deal.commissionStatus && (
                        <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[10px] font-medium">
                          Comm: {deal.commissionStatus}
                        </span>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Deal Detail Drawer ── */}
      {selectedDeal && builderId && (
        <DealDrawer
          dealSummary={selectedDeal}
          builderId={builderId}
          userId={Number(user?.id ?? 0)}
          onClose={() => setSelectedDeal(null)}
          onRefreshList={() => { if (builderId) loadDeals(builderId); }}
        />
      )}
    </>
  );
  return embedded ? inner : <DashboardLayout>{inner}</DashboardLayout>;
}

const BuilderDealsPage = () => <BuilderDealsPanel />;
export default BuilderDealsPage;
