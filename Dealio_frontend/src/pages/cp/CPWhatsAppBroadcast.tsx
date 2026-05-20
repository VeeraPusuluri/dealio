import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { broadcastSequences } from '@/data/socialMedia';
import { MessageSquare, Play, Pause, CheckCircle, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';

const CPWhatsAppBroadcast = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [seqName, setSeqName] = useState('');
  const [segment, setSegment] = useState('All Leads');

  const statusColor: Record<string, string> = { Active: 'text-green-600', Paused: 'text-amber-600', Completed: 'text-muted-foreground' };
  const statusIcon: Record<string, React.ElementType> = { Active: Play, Paused: Pause, Completed: CheckCircle };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">WhatsApp Broadcast</h2>
            <p className="text-sm text-muted-foreground">Automated Day-1/Day-3/Day-7 sequences. Reply detection stops sequence & opens live chat.</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90">
            <Plus size={16} /> New Sequence
          </button>
        </div>

        {showCreate && (
          <div className="bg-card rounded-lg p-5 border border-border space-y-3">
            <h3 className="font-semibold text-card-foreground">Create Broadcast Sequence</h3>
            <input value={seqName} onChange={e => setSeqName(e.target.value)} placeholder="Sequence name" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground" />
            <select value={segment} onChange={e => setSegment(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground">
              <option>All Leads</option><option>Hot Leads</option><option>Warm Leads</option><option>Cold Leads</option><option>By City</option><option>By Project</option>
            </select>
            <div className="space-y-2">
              {[1, 3, 7].map(day => (
                <div key={day} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-14">Day {day}:</span>
                  <input placeholder={`Message for day ${day}... Use {{name}}, {{project}}`} className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground" />
                </div>
              ))}
            </div>
            <button onClick={() => { setShowCreate(false); toast.success('Sequence created!'); }} className="px-6 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold flex items-center gap-2 hover:bg-green-700">
              <Send size={14} /> Launch Sequence
            </button>
          </div>
        )}

        <div className="space-y-4">
          {broadcastSequences.map(seq => {
            const SIcon = statusIcon[seq.status];
            return (
              <div key={seq.id} className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-card-foreground">{seq.name}</h3>
                    <p className="text-xs text-muted-foreground">Segment: {seq.segment} • {seq.totalRecipients.toLocaleString('en-IN')} recipients • Started {seq.startedAt}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${statusColor[seq.status]}`}><SIcon size={12} /> {seq.status}</span>
                </div>
                <div className="space-y-2">
                  {seq.messages.map((msg, i) => {
                    const replyRate = msg.sent > 0 ? ((msg.replied / msg.sent) * 100).toFixed(1) : '0';
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <MessageSquare size={16} className="text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-card-foreground">Day {msg.day}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{msg.template}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-card-foreground">Sent: {msg.sent.toLocaleString('en-IN')}</p>
                          <p className="text-xs text-green-600">Replied: {msg.replied} ({replyRate}%)</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPWhatsAppBroadcast;
