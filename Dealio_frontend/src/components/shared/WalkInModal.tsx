import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLeadStore } from '@/stores/useLeadStore';
import { projects } from '@/data/projects';
import { channelPartners } from '@/data/channelPartners';
import { toast } from 'sonner';

interface WalkInModalProps {
  open: boolean;
  onClose: () => void;
}

const WalkInModal = ({ open, onClose }: WalkInModalProps) => {
  const { addLead } = useLeadStore();
  const [form, setForm] = useState({ name: '', phone: '', projectId: '', configs: [] as string[], source: 'Walk-in', cpId: '', notes: '' });

  const handleSubmit = () => {
    if (!form.name || !form.phone || !form.projectId) return;
    const project = projects.find((p) => p.id === form.projectId);
    const cp = channelPartners.find((c) => c.id === form.cpId);
    addLead({
      id: `L${Date.now()}`,
      customerName: form.name, phone: form.phone, email: '',
      projectId: form.projectId, projectName: project?.name || '',
      unitType: form.configs.join('/') || '2BHK',
      cpId: form.cpId || 'UNASSIGNED', cpName: cp?.name || 'Unassigned',
      budget: 0, stage: 'New Lead',
      notes: form.notes, source: 'Walk-in',
      createdAt: new Date().toISOString().split('T')[0], daysInStage: 0,
    });
    toast.success(`Walk-in registered and assigned to ${cp?.name || 'Admin'}`);
    setForm({ name: '', phone: '', projectId: '', configs: [], source: 'Walk-in', cpId: '', notes: '' });
    onClose();
  };

  const toggleConfig = (c: string) => setForm((f) => ({ ...f, configs: f.configs.includes(c) ? f.configs.filter((x) => x !== c) : [...f.configs, c] }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Log Walk-in Visitor</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground">Visitor Name <span className="text-destructive">*</span></label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full mt-1 p-2.5 text-sm rounded-lg border border-border bg-background text-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Mobile <span className="text-destructive">*</span></label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground bg-muted px-2 py-2.5 rounded-lg">+91</span>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="flex-1 p-2.5 text-sm rounded-lg border border-border bg-background text-foreground" maxLength={10} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Project <span className="text-destructive">*</span></label>
            <select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
              className="w-full mt-1 p-2.5 text-sm rounded-lg border border-border bg-background text-foreground">
              <option value="">Select project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Configuration</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {['2BHK', '3BHK', '4BHK'].map((c) => (
                <button key={c} onClick={() => toggleConfig(c)}
                  className={`text-xs px-3 py-1.5 rounded-lg border ${form.configs.includes(c) ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Source</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {['Walk-in', 'Builder Website', 'Referral', 'Hoarding', 'Newspaper'].map((s) => (
                <button key={s} onClick={() => setForm((f) => ({ ...f, source: s }))}
                  className={`text-xs px-3 py-1.5 rounded-lg border ${form.source === s ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Assign to CP</label>
            <select value={form.cpId} onChange={(e) => setForm((f) => ({ ...f, cpId: e.target.value }))}
              className="w-full mt-1 p-2.5 text-sm rounded-lg border border-border bg-background text-foreground">
              <option value="">Unassigned — Admin will allocate</option>
              {channelPartners.map((cp) => <option key={cp.id} value={cp.id}>{cp.name} ({cp.tier})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full mt-1 p-2.5 text-sm rounded-lg border border-border bg-background text-foreground resize-none" rows={2} />
          </div>
          <Button onClick={handleSubmit} disabled={!form.name || !form.phone || !form.projectId} className="w-full">Register Walk-in</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalkInModal;
