import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Calendar, IndianRupee, CheckCircle, Clock, AlertTriangle, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import DatePickerField from '@/components/shared/DatePickerField';

interface DemandLetter {
  id: string; booking: string; project: string; customer: string; amount: number;
  dueDate: string; description: string; penaltyPerDay: number; status: 'pending' | 'paid' | 'overdue';
  paymentDate?: string; paymentRef?: string;
}

const initialDemands: DemandLetter[] = [
  { id: 'DL001', booking: 'BK001', project: 'My Home Avatar', customer: 'Arjun Reddy', amount: 2200000, dueDate: '2025-02-15', description: '2nd installment — Slab completion', penaltyPerDay: 500, status: 'pending' },
  { id: 'DL002', booking: 'BK001', project: 'My Home Avatar', customer: 'Arjun Reddy', amount: 1100000, dueDate: '2025-01-05', description: '1st installment — Booking amount', penaltyPerDay: 0, status: 'paid', paymentDate: '2025-01-03', paymentRef: 'NEFT-2025010312345' },
];

const BuilderDemandLetters = () => {
  const [demands, setDemands] = useState(initialDemands);
  const [showCreate, setShowCreate] = useState(false);
  const [newAmount, setNewAmount] = useState(0);
  const [newDueDate, setNewDueDate] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    paid: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    overdue: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-red-100 dark:bg-red-900/30' },
  };

  const handleCreate = () => {
    if (!newAmount || !newDueDate) { toast.error('Fill amount and due date'); return; }
    setDemands(prev => [...prev, { id: `DL${Date.now()}`, booking: 'BK001', project: 'My Home Avatar', customer: 'Arjun Reddy', amount: newAmount, dueDate: newDueDate, description: newDesc, penaltyPerDay: 500, status: 'pending' }]);
    setShowCreate(false); setNewAmount(0); setNewDueDate(''); setNewDesc('');
    toast.success('Demand letter created & customer notified!');
  };

  const markPaid = (id: string) => {
    setDemands(prev => prev.map(d => d.id === id ? { ...d, status: 'paid' as const, paymentDate: new Date().toISOString().split('T')[0], paymentRef: 'NEFT-' + Date.now() } : d));
    toast.success('Marked as paid');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="la-banner px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Demand Letters</h2>
          <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}><Plus size={14} /> Create Demand</button>
        </div>

        {showCreate && (
          <div className="la-card p-5 space-y-4">
            <h3 className="font-semibold text-slate-700">New Demand Letter</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="text-xs text-slate-500 font-medium">Amount (₹)</label><input type="number" value={newAmount} onChange={e => setNewAmount(Number(e.target.value))} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all" /></div>
              <div><label className="text-xs text-slate-500 font-medium">Due Date</label><div className="mt-1"><DatePickerField value={newDueDate} onChange={setNewDueDate} /></div></div>
              <div><label className="text-xs text-slate-500 font-medium">Description</label><input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="e.g. 3rd installment — Plinth" className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all" /></div>
            </div>
            <button onClick={handleCreate} className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"><Send size={14} /> Send Demand</button>
          </div>
        )}

        <div className="space-y-3">
          {demands.map(d => {
            const cfg = statusConfig[d.status];
            return (
              <div key={d.id} className="la-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{d.description}</p>
                    <p className="text-xs text-slate-400">{d.project} — {d.customer}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} flex items-center gap-1`}><cfg.icon size={10} /> {d.status.charAt(0).toUpperCase() + d.status.slice(1)}</span>
                </div>
                <div className="flex items-center gap-6 mt-3 text-sm">
                  <span className="flex items-center gap-1 text-teal-600 font-semibold"><IndianRupee size={14} /> ₹{d.amount.toLocaleString('en-IN')}</span>
                  <span className="flex items-center gap-1 text-slate-400"><Calendar size={14} /> Due: {d.dueDate}</span>
                  {d.penaltyPerDay > 0 && <span className="text-xs text-red-500">Penalty: ₹{d.penaltyPerDay}/day</span>}
                </div>
                {d.paymentDate && <p className="text-xs text-emerald-600 mt-2">Paid on {d.paymentDate} — Ref: {d.paymentRef}</p>}
                {d.status === 'pending' && (
                  <button onClick={() => markPaid(d.id)} className="mt-3 text-xs text-teal-600 font-medium hover:underline">Mark as Paid</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuilderDemandLetters;
