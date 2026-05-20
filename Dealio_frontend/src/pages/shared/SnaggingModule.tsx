import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Camera, AlertTriangle, CheckCircle, Clock, RotateCcw, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

interface SnagItem {
  id: string; location: string; category: string; description: string; priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Rejected' | 'Reopened'; assignedTo?: string; dueDate?: string; resolutionNote?: string;
}

const initialSnags: SnagItem[] = [
  { id: 'SNG-0001', location: 'Master Bedroom', category: 'Painting', description: 'Uneven paint finish on east wall', priority: 'Medium', status: 'In Progress', assignedTo: 'Paint Team A', dueDate: '2025-02-01' },
  { id: 'SNG-0002', location: 'Kitchen', category: 'Plumbing', description: 'Sink tap has slow drip', priority: 'High', status: 'Open' },
  { id: 'SNG-0003', location: 'Bathroom 1', category: 'Flooring', description: 'Loose tile near shower drain', priority: 'High', status: 'Resolved', assignedTo: 'Floor Team', resolutionNote: 'Tile re-laid and grouted' },
];

const locations = ['Living Room', 'Master Bedroom', 'Bedroom 2', 'Kitchen', 'Bathroom 1', 'Bathroom 2', 'Balcony', 'Entrance', 'Parking', 'Other'];
const categories = ['Structural', 'Plumbing', 'Electrical', 'Painting', 'Flooring', 'Fixtures', 'Other'];

const statusIcon: Record<string, React.ElementType> = { Open: AlertTriangle, 'In Progress': Clock, Resolved: CheckCircle, Rejected: AlertTriangle, Reopened: RotateCcw };
const statusColor: Record<string, string> = { Open: 'text-red-600', 'In Progress': 'text-amber-600', Resolved: 'text-green-600', Rejected: 'text-muted-foreground', Reopened: 'text-red-600' };
const priorityColor: Record<string, string> = { High: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', Medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', Low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' };

const SnaggingModule = ({ isBuilder = false }: { isBuilder?: boolean }) => {
  const [snags, setSnags] = useState(initialSnags);
  const [showAdd, setShowAdd] = useState(false);
  const [newLoc, setNewLoc] = useState(locations[0]);
  const [newCat, setNewCat] = useState(categories[0]);
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  const addSnag = () => {
    if (!newDesc.trim()) { toast.error('Enter description'); return; }
    const id = `SNG-${String(snags.length + 1).padStart(4, '0')}`;
    setSnags(prev => [...prev, { id, location: newLoc, category: newCat, description: newDesc, priority: newPriority, status: 'Open' }]);
    setShowAdd(false); setNewDesc('');
    toast.success(`Snag ${id} raised`);
  };

  const updateStatus = (id: string, status: SnagItem['status']) => {
    setSnags(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    toast.success(`Snag ${id} → ${status}`);
  };

  const total = snags.length; const resolved = snags.filter(s => s.status === 'Resolved').length;
  const pending = snags.filter(s => ['Open', 'In Progress', 'Reopened'].includes(s.status)).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-card-foreground">Snagging Report</h2>
          {!isBuilder && <button onClick={() => setShowAdd(!showAdd)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90"><Plus size={14} /> Raise Snag</button>}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-3 border border-border"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-card-foreground">{total}</p></div>
          <div className="bg-card rounded-lg p-3 border border-border"><p className="text-xs text-muted-foreground">Resolved</p><p className="text-xl font-bold text-green-600">{resolved}</p></div>
          <div className="bg-card rounded-lg p-3 border border-border"><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold text-amber-600">{pending}</p></div>
          <div className="bg-card rounded-lg p-3 border border-border"><p className="text-xs text-muted-foreground">Overdue</p><p className="text-xl font-bold text-destructive">{snags.filter(s => s.dueDate && new Date(s.dueDate) < new Date() && s.status !== 'Resolved').length}</p></div>
        </div>

        {showAdd && (
          <div className="bg-card rounded-lg p-5 border border-border space-y-3">
            <h3 className="font-semibold text-card-foreground">New Snag Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="text-xs text-muted-foreground">Location</label><select value={newLoc} onChange={e => setNewLoc(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground">{locations.map(l => <option key={l}>{l}</option>)}</select></div>
              <div><label className="text-xs text-muted-foreground">Category</label><select value={newCat} onChange={e => setNewCat(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground">{categories.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="text-xs text-muted-foreground">Priority</label><select value={newPriority} onChange={e => setNewPriority(e.target.value as 'High'|'Medium'|'Low')} className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground"><option>High</option><option>Medium</option><option>Low</option></select></div>
            </div>
            <div><label className="text-xs text-muted-foreground">Description</label><textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground resize-none placeholder:text-muted-foreground" placeholder="Describe the defect..." /></div>
            <button onClick={addSnag} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-green-700"><Send size={14} /> Submit Snag</button>
          </div>
        )}

        <div className="space-y-2">
          {snags.map(s => {
            const Icon = statusIcon[s.status] || Clock;
            return (
              <div key={s.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Icon size={16} className={statusColor[s.status]} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-muted-foreground">{s.id}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${priorityColor[s.priority]}`}>{s.priority}</span>
                      </div>
                      <p className="text-sm font-medium text-card-foreground mt-0.5">{s.description}</p>
                      <p className="text-xs text-muted-foreground">{s.location} · {s.category}</p>
                      {s.assignedTo && <p className="text-xs text-muted-foreground mt-1">Assigned: {s.assignedTo}{s.dueDate ? ` · Due: ${s.dueDate}` : ''}</p>}
                      {s.resolutionNote && <p className="text-xs text-green-600 mt-1">✅ {s.resolutionNote}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isBuilder && s.status !== 'Resolved' && (
                      <button onClick={() => updateStatus(s.id, 'Resolved')} className="text-[10px] px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-600 font-medium">Resolve</button>
                    )}
                    {!isBuilder && s.status === 'Resolved' && (
                      <button onClick={() => updateStatus(s.id, 'Reopened')} className="text-[10px] px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 font-medium">Reopen</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {snags.length === 0 && <div className="bg-muted/50 rounded-lg p-8 text-center"><Camera size={32} className="mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">No snag items raised yet — items will appear here after possession</p></div>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export const BuilderSnagging = () => <SnaggingModule isBuilder />;
export const CustomerSnagging = () => <SnaggingModule isBuilder={false} />;
export default SnaggingModule;
