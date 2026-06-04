import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  FileText, Calendar, IndianRupee, CheckCircle, Clock, AlertTriangle,
  Plus, Send, Loader2, RefreshCw, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import DatePickerField from '@/components/shared/DatePickerField';
import { formatCurrency } from '@/lib/format';

interface Installment {
  installment: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid';
}

interface DealRow {
  id: number;
  customerName: string;
  projectName: string;
  dealValue: number | null;
  status: string;
  paymentSchedule: Installment[] | null;
}

const statusConfig = {
  Pending: { icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50  dark:bg-amber-900/20'  },
  Paid:    { icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50  dark:bg-green-900/20'  },
  Overdue: { icon: AlertTriangle, color: 'text-red-600',    bg: 'bg-red-50    dark:bg-red-900/20'    },
};

const BuilderDemandLetters = () => {
  const { user } = useAuthStore();
  const builderId = builderApi.getCachedBuilderId() || user?.id;

  const [deals, setDeals]       = useState<DealRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<DealRow | null>(null);
  const [saving, setSaving]     = useState(false);

  // New installment form
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDue, setNewDue]     = useState('');

  const load = useCallback(async () => {
    if (!builderId) return;
    setLoading(true);
    try {
      const data = await builderApi.getBuilderDeals(builderId) as DealRow[];
      const active = (data || []).filter(d =>
        ['Booked', 'Negotiation', 'Agreement', 'Loan Application Created', 'Loan Sanctioned'].includes(d.status)
      );
      setDeals(active);
      if (selected) {
        const refreshed = active.find(d => d.id === selected.id);
        if (refreshed) setSelected(refreshed);
      }
    } catch {
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  }, [builderId]);

  useEffect(() => { load(); }, [load]);

  const addInstallment = async () => {
    if (!selected || !newLabel.trim() || !newAmount || !newDue) {
      toast.error('Fill in all fields');
      return;
    }
    setSaving(true);
    const updated: Installment[] = [
      ...(selected.paymentSchedule ?? []),
      { installment: newLabel.trim(), amount: Number(newAmount), dueDate: newDue, status: 'Pending' },
    ];
    try {
      await builderApi.setPaymentSchedule(builderId!, selected.id, updated);
      setSelected(prev => prev ? { ...prev, paymentSchedule: updated } : prev);
      setDeals(prev => prev.map(d => d.id === selected.id ? { ...d, paymentSchedule: updated } : d));
      setNewLabel(''); setNewAmount(''); setNewDue('');
      setShowForm(false);
      toast.success('Demand letter created & saved');
    } catch {
      toast.error('Failed to save installment');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (idx: number) => {
    if (!selected) return;
    const updated = (selected.paymentSchedule ?? []).map((inst, i) =>
      i === idx ? { ...inst, status: 'Paid' as const } : inst
    );
    try {
      await builderApi.setPaymentSchedule(builderId!, selected.id, updated);
      setSelected(prev => prev ? { ...prev, paymentSchedule: updated } : prev);
      setDeals(prev => prev.map(d => d.id === selected.id ? { ...d, paymentSchedule: updated } : d));
      toast.success('Marked as paid');
    } catch {
      toast.error('Failed to update');
    }
  };

  const totalPending = selected?.paymentSchedule?.filter(i => i.status === 'Pending').reduce((s, i) => s + i.amount, 0) ?? 0;
  const totalPaid    = selected?.paymentSchedule?.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0) ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="la-banner px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Demand Letters</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage payment schedules for active deals</p>
          </div>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Deal list */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground px-1">Active Deals</p>
            {loading ? (
              <div className="la-card p-8 flex items-center justify-center">
                <Loader2 size={22} className="animate-spin text-teal-500" />
              </div>
            ) : deals.length === 0 ? (
              <div className="la-card p-8 text-center">
                <Building2 size={24} className="text-slate-300 mx-auto mb-2" />
                <p className="text-[13px] text-slate-500">No active deals yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Demand letters are available for Booked and later stages</p>
              </div>
            ) : (
              deals.map(deal => {
                const schedLen = deal.paymentSchedule?.length ?? 0;
                const paidLen  = deal.paymentSchedule?.filter(i => i.status === 'Paid').length ?? 0;
                return (
                  <button key={deal.id} onClick={() => { setSelected(deal); setShowForm(false); }}
                    className={`w-full text-left la-card p-4 hover:border-teal-300 transition-all ${selected?.id === deal.id ? 'border-teal-400 shadow-md' : ''}`}>
                    <p className="text-[13px] font-semibold text-slate-800 truncate">{deal.customerName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{deal.projectName}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-teal-600 font-semibold">{deal.dealValue ? formatCurrency(deal.dealValue) : '—'}</span>
                      <span className="text-[10px] text-slate-400">{paidLen}/{schedLen} paid</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Installment detail */}
          <div className="lg:col-span-2 space-y-4">
            {!selected ? (
              <div className="la-card p-12 text-center text-slate-400">
                <FileText size={28} className="mx-auto mb-3 opacity-40" />
                <p className="text-[13px]">Select a deal to manage payment schedule</p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="la-card p-3.5 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total Value</p>
                    <p className="text-[15px] font-bold text-slate-800 mt-0.5">{selected.dealValue ? formatCurrency(selected.dealValue) : '—'}</p>
                  </div>
                  <div className="la-card p-3.5 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Received</p>
                    <p className="text-[15px] font-bold text-green-600 mt-0.5">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div className="la-card p-3.5 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Pending</p>
                    <p className="text-[15px] font-bold text-amber-600 mt-0.5">{formatCurrency(totalPending)}</p>
                  </div>
                </div>

                {/* Header */}
                <div className="la-banner px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">{selected.customerName}</p>
                    <p className="text-[11px] text-slate-500">{selected.projectName} · {selected.status}</p>
                  </div>
                  <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
                    <Plus size={13} /> Add Demand
                  </button>
                </div>

                {/* Add form */}
                {showForm && (
                  <div className="la-card p-4 space-y-3">
                    <p className="text-[12px] font-bold text-slate-700">New Demand Letter</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Description</label>
                        <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                          placeholder="e.g. 2nd installment — Slab" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Amount (₹)</label>
                        <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                          placeholder="e.g. 20,00,000" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-medium block mb-1">Due Date</label>
                        <DatePickerField value={newDue} onChange={setNewDue} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addInstallment} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        {saving ? 'Saving…' : 'Send Demand'}
                      </button>
                      <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-[12px] text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Installment list */}
                {(!selected.paymentSchedule || selected.paymentSchedule.length === 0) ? (
                  <div className="la-card p-8 text-center text-slate-400">
                    <p className="text-[13px]">No demand letters yet — click "Add Demand" to create one</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selected.paymentSchedule.map((inst, idx) => {
                      const isOverdue = inst.status === 'Pending' && new Date(inst.dueDate) < new Date();
                      const key   = isOverdue ? 'Overdue' : inst.status as 'Pending' | 'Paid';
                      const cfg   = statusConfig[key];
                      const Icon  = cfg.icon;
                      return (
                        <div key={idx} className="la-card p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[13px] font-semibold text-slate-800">{inst.installment}</p>
                              <div className="flex items-center gap-4 mt-2 text-[12px]">
                                <span className="flex items-center gap-1 text-teal-600 font-semibold">
                                  <IndianRupee size={12} />{formatCurrency(inst.amount)}
                                </span>
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Calendar size={12} /> {inst.dueDate}
                                </span>
                              </div>
                            </div>
                            <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                              <Icon size={10} /> {isOverdue ? 'Overdue' : inst.status}
                            </span>
                          </div>
                          {inst.status === 'Pending' && (
                            <button onClick={() => markPaid(idx)}
                              className="mt-2.5 text-[11px] font-semibold text-teal-600 hover:underline">
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuilderDemandLetters;
