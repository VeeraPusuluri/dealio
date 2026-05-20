import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFollowUpStore } from '@/stores/useFollowUpStore';
import { toast } from 'sonner';

interface CallLogModalProps {
  open: boolean;
  onClose: () => void;
  leadId: string;
  customerName: string;
  projectName: string;
}

const outcomes = ['Interested — confirmed', 'Interested — needs time', 'Not answering', 'Not interested', 'Wrong number', 'Callback requested'];
const durations = ['<1 min', '1–3 min', '3–10 min', '10+ min'];

const outcomeColors: Record<string, string> = {
  'Interested — confirmed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Interested — needs time': 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  'Not answering': 'bg-muted text-muted-foreground',
  'Not interested': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Wrong number': 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  'Callback requested': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export { outcomeColors };

const CallLogModal = ({ open, onClose, leadId, customerName, projectName }: CallLogModalProps) => {
  const { addCallLog, addFollowUp } = useFollowUpStore();
  const [outcome, setOutcome] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');

  const handleSubmit = () => {
    if (!outcome || !duration) return;
    addCallLog({
      id: `CL${Date.now()}`,
      leadId, outcome, duration, notes, nextFollowUp: nextFollowUp || undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
    });
    if (nextFollowUp) {
      addFollowUp({
        id: `FU${Date.now()}`,
        leadId, customerName, projectName,
        stage: '', reason: `Follow-up after call: ${outcome}`,
        dueDate: nextFollowUp, done: false,
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
    toast.success(`Call logged for ${customerName}`);
    setOutcome(''); setDuration(''); setNotes(''); setNextFollowUp('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log Call — {customerName}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Call Outcome <span className="text-destructive">*</span></label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {outcomes.map((o) => (
                <button key={o} onClick={() => setOutcome(o)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors ${outcome === o ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Duration <span className="text-destructive">*</span></label>
            <div className="flex gap-2 mt-1.5">
              {durations.map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${duration === d ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground hover:bg-muted'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1.5 p-2.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none"
              rows={2} placeholder="Key points from the call..." />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Next Follow-up</label>
            <input type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)}
              className="w-full mt-1.5 p-2.5 text-sm rounded-lg border border-border bg-background text-foreground" />
          </div>
          <Button onClick={handleSubmit} disabled={!outcome || !duration} className="w-full">Log Call</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallLogModal;
