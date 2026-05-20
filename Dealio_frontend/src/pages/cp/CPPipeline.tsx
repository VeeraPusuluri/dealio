import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLeadStore } from '@/stores/useLeadStore';
import { LeadStage, leadStageColors } from '@/data/leads';
import { calculateLeadScore } from '@/lib/leadScoring';
import { GripVertical, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const kanbanColumns: { stage: LeadStage; label: string }[] = [
  { stage: 'New Lead', label: 'New Lead' },
  { stage: 'Meeting Requested', label: 'Contacted' },
  { stage: 'Meeting Confirmed', label: 'Visit Scheduled' },
  { stage: 'Meeting Done', label: 'Visit Done' },
  { stage: 'Negotiation', label: 'Negotiation' },
  { stage: 'Booked', label: 'Booked' },
  { stage: 'Closed', label: 'Lost / Closed' },
];

const CPPipeline = () => {
  const { leads, moveLead } = useLeadStore();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState('');

  const cpLeads = leads.filter(l => !filterProject || l.projectId === filterProject);
  const projectIds = [...new Set(leads.map(l => l.projectId))];

  const handleDragStart = (e: React.DragEvent, id: string) => { setDraggedId(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDrop = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    if (draggedId) { moveLead(draggedId, stage); toast.success(`Lead moved to ${stage}`); setDraggedId(null); }
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-card-foreground">Pipeline (Kanban)</h2>
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="text-xs px-2 py-1.5 rounded border border-input bg-background text-foreground">
            <option value="">All Projects</option>
            {projectIds.map(id => { const l = leads.find(x => x.projectId === id); return <option key={id} value={id}>{l?.projectName}</option>; })}
          </select>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
          {kanbanColumns.map(col => {
            const colLeads = cpLeads.filter(l => l.stage === col.stage);
            const color = leadStageColors[col.stage];
            return (
              <div key={col.stage} className="flex-shrink-0 w-56 bg-muted/50 rounded-lg p-2" onDrop={e => handleDrop(e, col.stage)} onDragOver={handleDragOver}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-semibold text-card-foreground">{col.label}</span>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground ml-auto">{colLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {colLeads.map(lead => {
                    const score = calculateLeadScore(lead);
                    return (
                      <div key={lead.id} draggable onDragStart={e => handleDragStart(e, lead.id)}
                        className="bg-card rounded-lg p-3 border border-border cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-1.5">
                          <GripVertical size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-card-foreground truncate">{lead.customerName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{lead.projectName}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded-full ${score.bgColor} ${score.color}`}>{score.label}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {lead.meetingDate && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Calendar size={9} /> {lead.meetingDate}</span>}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto"><Phone size={9} /> {lead.daysInStage}d</span>
                        </div>
                      </div>
                    );
                  })}
                  {colLeads.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">No leads</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPPipeline;
