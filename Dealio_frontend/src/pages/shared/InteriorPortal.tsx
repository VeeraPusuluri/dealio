import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useInteriorStore, InteriorLeadStatus, interiorStatusColors, InteriorThread, InteriorThreadEvent } from '@/stores/useInteriorStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { ArrowLeft, Send, ChevronRight, Plus, Star } from 'lucide-react';

const statusList: InteriorLeadStatus[] = ['New', 'Contacted', 'Quote Sent', 'Confirmed', 'In Progress', 'Completed'];

const eventTypeIcon = (type: string) => {
  switch (type) {
    case 'property': return '🏗️';
    case 'referral': return '👤';
    case 'note': return '💬';
    case 'quote': return '📋';
    case 'accepted': return '✅';
    case 'work_started': return '🔨';
    case 'completed': return '⭐';
    default: return '📌';
  }
};

const InteriorPortal = () => {
  const { threads, updateStatus, addEvent } = useInteriorStore();
  const { user } = useAuthStore();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [noteText, setNoteText] = useState('');

  const filteredThreads = threads.filter(t => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    return true;
  });

  const activeThread = threads.find(t => t.id === selectedThread);

  const handleAddNote = () => {
    if (!activeThread || !noteText.trim()) return;
    const event: InteriorThreadEvent = {
      id: `IE${Date.now()}`,
      type: 'note',
      sender: user?.name || '',
      senderRole: user?.role || 'vendor',
      content: noteText,
      timestamp: new Date().toISOString(),
    };
    addEvent(activeThread.id, event);
    setNoteText('');
    toast.success('Note added to thread');
  };

  const handleStatusUpdate = (newStatus: InteriorLeadStatus) => {
    if (!activeThread) return;
    updateStatus(activeThread.id, newStatus);
    const event: InteriorThreadEvent = {
      id: `IE${Date.now()}`,
      type: newStatus === 'Completed' ? 'completed' : newStatus === 'In Progress' ? 'work_started' : 'note',
      sender: user?.name || '',
      senderRole: user?.role || 'vendor',
      content: `Status updated to ${newStatus}`,
      timestamp: new Date().toISOString(),
    };
    addEvent(activeThread.id, event);
    toast.success(`Status updated to ${newStatus}`);
  };

  if (activeThread) {
    return (
      <DashboardLayout>
        <div>
          <button onClick={() => setSelectedThread(null)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
            <ArrowLeft size={16} /> Back to Interior Leads
          </button>
          <div className="flex gap-6">
            {/* Left panel — Timeline */}
            <div className="flex-1 min-w-0">
              <div className="bg-card rounded-lg card-shadow border border-border p-5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground">{activeThread.customerName}</h2>
                    <p className="text-sm text-muted-foreground">{activeThread.projectName} — Tower {activeThread.tower}, Unit {activeThread.unit}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: interiorStatusColors[activeThread.status] }}>{activeThread.status}</span>
                </div>
                <div className="flex gap-1.5 mt-3">
                  {statusList.map((s, i) => {
                    const currentIdx = statusList.indexOf(activeThread.status);
                    return <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= currentIdx ? 'bg-accent' : 'bg-muted'}`} />;
                  })}
                </div>
              </div>

              <div className="bg-card rounded-lg card-shadow border border-border p-5">
                <h3 className="font-semibold text-card-foreground mb-4">Thread Timeline</h3>
                <div className="space-y-4">
                  {activeThread.events.map(event => (
                    <div key={event.id} className="flex gap-3">
                      <div className="text-lg mt-0.5">{eventTypeIcon(event.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-card-foreground">{event.sender}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{event.senderRole}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{new Date(event.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex gap-2 mb-2">
                    <select onChange={e => { if (e.target.value) handleStatusUpdate(e.target.value as InteriorLeadStatus); e.target.value = ''; }} className="px-2 py-1.5 rounded border border-input bg-card text-xs">
                      <option value="">Update Status...</option>
                      {statusList.filter(s => s !== activeThread.status).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." className="flex-1 px-3 py-2 rounded-lg border border-input bg-card text-sm" onKeyDown={e => e.key === 'Enter' && handleAddNote()} />
                    <button onClick={handleAddNote} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground"><Send size={16} /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="w-80 flex-shrink-0 space-y-4">
              <div className="bg-card rounded-lg card-shadow border border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Customer</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium text-card-foreground">{activeThread.customerName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium text-card-foreground">{activeThread.customerPhone}</span></div>
                </div>
              </div>
              <div className="bg-card rounded-lg card-shadow border border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Property</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span className="font-medium text-card-foreground">{activeThread.projectName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Unit</span><span className="font-medium text-card-foreground">Tower {activeThread.tower}, {activeThread.unit}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Area</span><span className="font-medium text-card-foreground">{activeThread.sqft} sqft</span></div>
                </div>
              </div>
              <div className="bg-card rounded-lg card-shadow border border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Service Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Source</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${activeThread.leadSource === 'CP Referral' ? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'}`}>{activeThread.leadSource}</span>
                  </div>
                  {activeThread.cpName && <div className="flex justify-between"><span className="text-muted-foreground">Referred by</span><span className="font-medium text-card-foreground">{activeThread.cpName}</span></div>}
                  <div><span className="text-muted-foreground block mb-1">Services</span>
                    <div className="flex flex-wrap gap-1">{activeThread.serviceInterest.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s}</span>)}</div>
                  </div>
                  {activeThread.quoteAmount && <div className="flex justify-between"><span className="text-muted-foreground">Quote</span><span className="font-bold text-secondary">{formatCurrency(activeThread.quoteAmount)}</span></div>}
                </div>
              </div>
              <div className="bg-card rounded-lg card-shadow border border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Vendor</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium text-card-foreground">{activeThread.vendorName}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-foreground">Interior Lead Repository</h2>
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-card text-sm">
              <option value="All">All Status</option>
              {statusList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid gap-3">
          {filteredThreads.map(thread => (
            <div key={thread.id} onClick={() => setSelectedThread(thread.id)} className="bg-card rounded-lg card-shadow border border-border p-4 cursor-pointer hover:border-accent/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                  {thread.customerName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-card-foreground">{thread.customerName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ml-auto" style={{ backgroundColor: interiorStatusColors[thread.status] }}>{thread.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{thread.projectName} — Tower {thread.tower}, Unit {thread.unit} · {thread.sqft} sqft</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${thread.leadSource === 'CP Referral' ? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'}`}>
                      {thread.leadSource}{thread.cpName ? ` — ${thread.cpName}` : thread.builderName ? ` — ${thread.builderName}` : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">{thread.serviceInterest.join(', ')}</span>
                    {thread.quoteAmount && <span className="text-xs font-medium text-card-foreground ml-auto">{formatCurrency(thread.quoteAmount)}</span>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InteriorPortal;
