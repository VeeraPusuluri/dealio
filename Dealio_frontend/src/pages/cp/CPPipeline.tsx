import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cpApi, builderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { GripVertical, Phone, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CPLead {
  id: number;
  projectId: number;
  projectName: string;
  builderId?: number | null;
  customerName: string;
  customerPhone: string;
  status: string;
  estimatedCommission?: number | null;
  createdAt: string;
}

const COLUMNS: { status: string; label: string; dot: string }[] = [
  { status: 'New Lead',           label: 'New Lead',        dot: '#94a3b8' },
  { status: 'Profile Created',    label: 'Profile Created', dot: '#0d9488' },
  { status: 'Meeting Requested',  label: 'Contacted',       dot: '#6366f1' },
  { status: 'Meeting Confirmed',  label: 'Visit Scheduled', dot: '#8b5cf6' },
  { status: 'Meeting Done',       label: 'Visit Done',      dot: '#ec4899' },
  { status: 'Negotiation',        label: 'Negotiation',     dot: '#f59e0b' },
  { status: 'Agreement',          label: 'Agreement',       dot: '#2563eb' },
  { status: 'Booked',             label: 'Booked',          dot: '#10b981' },
  { status: 'Closed',             label: 'Closed',          dot: '#16a34a' },
];

const fmt = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(0)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const CPPipeline = () => {
  const user = useAuthStore(s => s.user);
  const [leads, setLeads]         = useState<CPLead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filterProject, setFilterProject] = useState('');
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await cpApi.getLeads(user.id);
      setLeads((data as CPLead[]) ?? []);
    } catch {
      toast.error('Could not load leads');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const projectNames = [...new Set(leads.map(l => l.projectName))].sort();
  const visible = filterProject ? leads.filter(l => l.projectName === filterProject) : leads;

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedId === null) return;
    const lead = leads.find(l => l.id === draggedId);
    if (!lead || lead.status === status) { setDraggedId(null); return; }

    setLeads(prev => prev.map(l => l.id === draggedId ? { ...l, status } : l));
    setDraggedId(null);
    toast.success(`Moved to ${status}`);

    if (lead.builderId) {
      try {
        await builderApi.updateLeadStage(lead.builderId, lead.id, status);
      } catch {
        // revert
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: lead.status } : l));
        toast.error('Failed to update stage');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 p-1">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-foreground">Property Journey</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{leads.length} leads across {projectNames.length} project{projectNames.length !== 1 ? 's' : ''}</p>
          </div>
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-input bg-background text-foreground">
            <option value="">All Projects</option>
            {projectNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-muted-foreground" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No leads yet. Add your first lead from the Leads page.</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '72vh' }}>
            {COLUMNS.map(col => {
              const colLeads = visible.filter(l => l.status.toLowerCase() === col.status.toLowerCase());
              return (
                <div
                  key={col.status}
                  className="flex-shrink-0 w-52 bg-muted/40 rounded-xl p-2 border border-border/50"
                  onDrop={e => handleDrop(e, col.status)}
                  onDragOver={e => e.preventDefault()}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.dot }} />
                    <span className="text-[11px] font-bold text-foreground truncate">{col.label}</span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground ml-auto shrink-0">{colLeads.length}</span>
                  </div>

                  <div className="space-y-2">
                    {colLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={e => handleDragStart(e, lead.id)}
                        className="bg-card rounded-lg p-3 border border-border cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none">
                        <div className="flex items-start gap-1.5">
                          <GripVertical size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-foreground truncate">{lead.customerName}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5 truncate">
                              <Building2 size={9} /> {lead.projectName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Phone size={9} /> {lead.customerPhone}
                          </span>
                          {lead.estimatedCommission ? (
                            <span className="text-[10px] font-semibold text-emerald-600 ml-auto">
                              {fmt(lead.estimatedCommission)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {colLeads.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/60 text-center py-6">Drop here</p>
                    )}
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

export default CPPipeline;
