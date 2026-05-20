import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle, Clock, Loader, Camera, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem { id: string; name: string; status: 'pending' | 'in_progress' | 'completed'; note?: string; }

const defaultItems: ChecklistItem[] = [
  { id: 'PC01', name: 'Occupancy Certificate (OC)', status: 'completed', note: 'Received from GHMC' },
  { id: 'PC02', name: 'Completion Certificate (CC)', status: 'completed', note: 'Issued on 10-Jan-2025' },
  { id: 'PC03', name: 'Water connection active', status: 'completed' },
  { id: 'PC04', name: 'Electricity connection active', status: 'completed' },
  { id: 'PC05', name: 'Society formation completed', status: 'in_progress', note: 'Registration in progress' },
  { id: 'PC06', name: 'Common areas ready', status: 'in_progress' },
  { id: 'PC07', name: 'Lift operational', status: 'completed' },
  { id: 'PC08', name: 'Car parking allotted', status: 'completed' },
  { id: 'PC09', name: 'Handover letter issued', status: 'pending' },
  { id: 'PC10', name: 'Key handover scheduled', status: 'pending' },
];

const statusIcon = { pending: Clock, in_progress: Loader, completed: CheckCircle };
const statusColor = { pending: 'text-muted-foreground', in_progress: 'text-amber-600', completed: 'text-green-600' };

const PossessionTracker = ({ isBuilder = false }: { isBuilder?: boolean }) => {
  const [items, setItems] = useState<ChecklistItem[]>(defaultItems);
  const [newItem, setNewItem] = useState('');

  const completed = items.filter(i => i.status === 'completed').length;
  const pct = Math.round((completed / items.length) * 100);

  const cycleStatus = (id: string) => {
    if (!isBuilder) return;
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const next = item.status === 'pending' ? 'in_progress' : item.status === 'in_progress' ? 'completed' : 'pending';
      if (next === 'completed') toast.success(`${item.name} marked as completed`);
      return { ...item, status: next as ChecklistItem['status'] };
    }));
  };

  const addCustomItem = () => {
    if (!newItem.trim()) return;
    setItems(prev => [...prev, { id: `PC${Date.now()}`, name: newItem, status: 'pending' }]);
    setNewItem('');
    toast.success('Custom item added');
  };

  const allDone = pct === 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-card-foreground">Possession Tracker</h2>

        <div className="bg-card rounded-lg p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-card-foreground">{completed}/{items.length} items complete</p>
            <span className={`text-sm font-bold ${pct === 100 ? 'text-green-600' : 'text-primary'}`}>{pct}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${allDone ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
          </div>
          {allDone && <p className="text-xs text-green-600 mt-2 font-medium">🎉 Possession ready! Key handover can be scheduled.</p>}
        </div>

        <div className="space-y-2">
          {items.map(item => {
            const Icon = statusIcon[item.status];
            return (
              <div key={item.id} onClick={() => cycleStatus(item.id)} className={`bg-card rounded-lg border border-border p-3 flex items-center gap-3 ${isBuilder ? 'cursor-pointer hover:bg-muted/50' : ''}`}>
                <Icon size={18} className={statusColor[item.status]} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${item.status === 'completed' ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>{item.name}</p>
                  {item.note && <p className="text-[10px] text-muted-foreground">{item.note}</p>}
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${item.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : item.status === 'in_progress' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                  {item.status === 'in_progress' ? 'In Progress' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
            );
          })}
        </div>

        {isBuilder && (
          <div className="flex gap-2">
            <input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add custom checklist item..." className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground" />
            <button onClick={addCustomItem} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"><Plus size={14} /></button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export const BuilderPossession = () => <PossessionTracker isBuilder />;
export const CustomerPossession = () => <PossessionTracker isBuilder={false} />;
export default PossessionTracker;
