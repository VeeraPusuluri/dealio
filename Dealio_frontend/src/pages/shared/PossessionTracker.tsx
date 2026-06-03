import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CheckCircle2, Clock, Loader2, Home, Plus, Key } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string; name: string; status: 'pending' | 'in_progress' | 'completed'; note?: string;
}

const statusIcon = { pending: Clock, in_progress: Loader2, completed: CheckCircle2 };
const statusColor = { pending: 'text-muted-foreground', in_progress: 'text-amber-500', completed: 'text-emerald-600' };
const statusPill = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-amber-50 text-amber-700 border border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const PossessionTracker = ({ isBuilder = false }: { isBuilder?: boolean }) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');

  const completed = items.filter(i => i.status === 'completed').length;
  const total = items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = total > 0 && pct === 100;

  const cycleStatus = (id: string) => {
    if (!isBuilder) return;
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const next: ChecklistItem['status'] = item.status === 'pending' ? 'in_progress' : item.status === 'in_progress' ? 'completed' : 'pending';
      if (next === 'completed') toast.success(`${item.name} marked as completed`);
      return { ...item, status: next };
    }));
  };

  const addCustomItem = () => {
    if (!newItem.trim()) return;
    setItems(prev => [...prev, { id: `PC${Date.now()}`, name: newItem.trim(), status: 'pending' }]);
    setNewItem('');
    toast.success('Checklist item added');
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-10 max-w-3xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold text-foreground">Possession Tracker</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Track handover milestones before key collection</p>
          </div>
          {total > 0 && (
            <div className="text-right">
              <p className={`text-[22px] font-bold ${allDone ? 'text-emerald-600' : 'text-foreground'}`}>{pct}%</p>
              <p className="text-[11px] text-muted-foreground">{completed}/{total} done</p>
            </div>
          )}
        </div>

        {/* Progress */}
        {total > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="h-3 rounded-full overflow-hidden bg-muted mb-3">
              <div className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : ''}`}
                style={{ width: `${pct}%`, background: allDone ? undefined : 'linear-gradient(90deg, #0A7E8C, #0d9488)' }} />
            </div>
            {allDone ? (
              <div className="flex items-center gap-2 text-emerald-700">
                <Key size={14} />
                <p className="text-[13px] font-semibold">All items complete — key handover can be scheduled! 🎉</p>
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">{total - completed} item{total - completed !== 1 ? 's' : ''} remaining</p>
            )}
          </div>
        )}

        {/* Checklist */}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Home size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-[14px] font-bold text-foreground mb-1">Possession tracking will begin after handover</h3>
            <p className="text-[12px] text-muted-foreground max-w-xs">
              {isBuilder
                ? 'Add checklist items below to track possession milestones for your customers.'
                : 'Your builder will set up the possession checklist once the project is ready for handover.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const Icon = statusIcon[item.status];
              return (
                <div key={item.id} onClick={() => cycleStatus(item.id)}
                  className={`rounded-xl border border-border bg-card p-3.5 flex items-center gap-3 transition-all ${
                    isBuilder ? 'cursor-pointer hover:bg-muted/30' : ''
                  } ${item.status === 'completed' ? 'opacity-70' : ''}`}>
                  <Icon size={16} className={`shrink-0 ${statusColor[item.status]} ${item.status === 'in_progress' ? 'animate-spin' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium ${item.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.name}
                    </p>
                    {item.note && <p className="text-[11px] text-muted-foreground mt-0.5">{item.note}</p>}
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${statusPill[item.status]}`}>
                    {item.status === 'in_progress' ? 'In Progress' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Add item (builder only) */}
        {isBuilder && (
          <div className="flex gap-2">
            <input
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomItem()}
              placeholder="Add checklist item… e.g. OC Certificate received"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
            />
            <button onClick={addCustomItem}
              className="px-4 py-2.5 rounded-xl font-semibold text-white flex items-center gap-1.5 text-[13px] hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
              <Plus size={14} /> Add
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export const BuilderPossession = () => <PossessionTracker isBuilder />;
export const CustomerPossession = () => <PossessionTracker isBuilder={false} />;
export default PossessionTracker;
