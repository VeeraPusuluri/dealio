import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Camera, AlertTriangle, CheckCircle2, Clock, RotateCcw,
  Plus, Send, X, Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

interface SnagItem {
  id: string; location: string; category: string; description: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Rejected' | 'Reopened';
  assignedTo?: string; dueDate?: string; resolutionNote?: string;
}

const LOCATIONS = ['Living Room', 'Master Bedroom', 'Bedroom 2', 'Kitchen', 'Bathroom 1', 'Bathroom 2', 'Balcony', 'Entrance', 'Parking', 'Other'];
const CATEGORIES = ['Structural', 'Plumbing', 'Electrical', 'Painting', 'Flooring', 'Fixtures', 'Other'];

const statusIcon: Record<string, React.ElementType> = {
  Open: AlertTriangle, 'In Progress': Clock, Resolved: CheckCircle2, Rejected: X, Reopened: RotateCcw,
};
const statusPill: Record<string, string> = {
  Open: 'bg-red-50 text-red-600 border border-red-200',
  'In Progress': 'bg-amber-50 text-amber-700 border border-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Rejected: 'bg-muted text-muted-foreground border border-border',
  Reopened: 'bg-red-50 text-red-600 border border-red-200',
};
const priorityPill: Record<string, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-blue-100 text-blue-700',
};

const inp = 'w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all placeholder:text-muted-foreground';

const SnaggingModule = ({ isBuilder = false }: { isBuilder?: boolean }) => {
  const [snags, setSnags] = useState<SnagItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newLoc, setNewLoc] = useState(LOCATIONS[0]);
  const [newCat, setNewCat] = useState(CATEGORIES[0]);
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const total = snags.length;
  const resolved = snags.filter(s => s.status === 'Resolved').length;
  const pending = snags.filter(s => ['Open', 'In Progress', 'Reopened'].includes(s.status)).length;
  const overdue = snags.filter(s => s.dueDate && new Date(s.dueDate) < new Date() && s.status !== 'Resolved').length;

  const addSnag = () => {
    if (!newDesc.trim()) { toast.error('Please enter a description'); return; }
    const id = `SNG-${String(snags.length + 1).padStart(4, '0')}`;
    setSnags(prev => [...prev, { id, location: newLoc, category: newCat, description: newDesc.trim(), priority: newPriority, status: 'Open' }]);
    setShowAdd(false); setNewDesc('');
    toast.success(`Snag ${id} raised successfully`);
  };

  const updateStatus = (id: string, status: SnagItem['status']) => {
    setSnags(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    toast.success(`Snag updated → ${status}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-10 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold text-foreground">Snagging Report</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Report and track defects for resolution before possession</p>
          </div>
          {!isBuilder && (
            <button onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
              <Plus size={14} /> Raise Snag
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: total, color: 'text-foreground', bg: 'bg-muted/40' },
            { label: 'Resolved', value: resolved, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-200' },
            { label: 'Pending', value: pending, color: 'text-amber-600', bg: 'bg-amber-50 border border-amber-200' },
            { label: 'Overdue', value: overdue, color: 'text-red-600', bg: 'bg-red-50 border border-red-200' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl p-4 ${bg}`}>
              <p className="text-[11px] font-medium text-muted-foreground mb-1">{label}</p>
              <p className={`text-[24px] font-bold leading-none ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Add snag form */}
        {showAdd && !isBuilder && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-foreground">New Snag Item</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">Location</label>
                <select value={newLoc} onChange={e => setNewLoc(e.target.value)} className={inp}>
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">Category</label>
                <select value={newCat} onChange={e => setNewCat(e.target.value)} className={inp}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">Priority</label>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value as 'High' | 'Medium' | 'Low')} className={inp}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">Description</label>
              <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} className={`${inp} resize-none`}
                placeholder="Describe the defect clearly…" />
            </div>
            <button onClick={addSnag}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: '#16A34A' }}>
              <Send size={13} /> Submit Snag
            </button>
          </div>
        )}

        {/* Snag list */}
        {snags.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              {isBuilder ? <Wrench size={24} className="text-muted-foreground" /> : <Camera size={24} className="text-muted-foreground" />}
            </div>
            <h3 className="text-[14px] font-bold text-foreground mb-1">No snags reported yet</h3>
            <p className="text-[12px] text-muted-foreground max-w-xs">
              {isBuilder
                ? 'Snag items reported by customers will appear here for you to assign and resolve.'
                : 'After possession, use "Raise Snag" to report any defects to your builder for resolution.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {snags.map(s => {
              const Icon = statusIcon[s.status] ?? Clock;
              return (
                <div key={s.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon size={15} className={`shrink-0 mt-0.5 ${
                        s.status === 'Open' ? 'text-red-500' : s.status === 'In Progress' ? 'text-amber-500' :
                        s.status === 'Resolved' ? 'text-emerald-500' : 'text-muted-foreground'
                      }`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-bold text-muted-foreground">{s.id}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${priorityPill[s.priority]}`}>{s.priority}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusPill[s.status]}`}>{s.status}</span>
                        </div>
                        <p className="text-[13px] font-medium text-foreground">{s.description}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{s.location} · {s.category}</p>
                        {s.assignedTo && <p className="text-[11px] text-muted-foreground mt-0.5">Assigned: {s.assignedTo}{s.dueDate ? ` · Due: ${s.dueDate}` : ''}</p>}
                        {s.resolutionNote && <p className="text-[11px] text-emerald-600 mt-1">✅ {s.resolutionNote}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {isBuilder && s.status !== 'Resolved' && (
                        <button onClick={() => updateStatus(s.id, 'Resolved')}
                          className="text-[11px] px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold hover:bg-emerald-100 transition-colors">
                          Resolve
                        </button>
                      )}
                      {!isBuilder && s.status === 'Resolved' && (
                        <button onClick={() => updateStatus(s.id, 'Reopened')}
                          className="text-[11px] px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-semibold hover:bg-red-100 transition-colors">
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export const BuilderSnagging = () => <SnaggingModule isBuilder />;
export const CustomerSnagging = () => <SnaggingModule isBuilder={false} />;
export default SnaggingModule;
