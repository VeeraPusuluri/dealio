import { useState } from 'react';
import { useLeadStore } from '@/stores/useLeadStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { projects } from '@/data/projects';
import { Lead } from '@/data/leads';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface AddLeadPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const sourceOptions = ['Self', 'Personal Referral', 'WhatsApp Share', 'Instagram', 'Facebook', '99acres', 'MagicBricks', 'Housing.com', 'Google Ad', 'Builder Event', 'Walk-in', 'Other'];
const configOptions = ['1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Plot'];
const possessionOptions = ['Ready to Move', 'Within 1 Year', '1–2 Years', '2+ Years', 'Flexible'];
const facingOptions = ['East', 'West', 'North', 'South', 'Corner Unit', 'Any'];
const siteVisitOptions = ['Yes — Immediate', 'Yes — Within a Week', 'Maybe', 'No'];
const loanOptions = ['Yes', 'No', 'Already Pre-Approved'];
const residenceOptions = ['Owned', 'Rented', 'Staying with Family'];
const urgencyOptions = ['Very High — 0 to 1 month', 'High — 1 to 3 months', 'Medium — 3 to 6 months', 'Low — 6 months+'];

const AddLeadPanel = ({ isOpen, onClose }: AddLeadPanelProps) => {
  const { addLead } = useLeadStore();
  const { user } = useAuthStore();

  const [form, setForm] = useState({
    fullName: '', mobile: '', whatsappSame: true, whatsapp: '', email: '',
    customerType: 'End User', source: 'Self',
    projectId: projects[0]?.id || '', configurations: ['3BHK'] as string[],
    budgetFrom: 5000000, budgetTo: 15000000,
    possession: 'Flexible', preferredFloor: '', facing: [] as string[],
    siteVisit: 'Yes — Within a Week', loanRequired: 'Yes',
    residentialStatus: 'Owned', urgency: 'Medium — 3 to 6 months',
    priority: 'Warm' as 'Hot' | 'Warm' | 'Cold',
    notes: '', followUpDate: '', followUpTime: '',
  });

  if (!isOpen) return null;

  const toggleConfig = (c: string) => {
    setForm(prev => ({
      ...prev,
      configurations: prev.configurations.includes(c)
        ? prev.configurations.filter(x => x !== c)
        : [...prev.configurations, c],
    }));
  };

  const toggleFacing = (f: string) => {
    setForm(prev => ({
      ...prev,
      facing: prev.facing.includes(f) ? prev.facing.filter(x => x !== f) : [...prev.facing, f],
    }));
  };

  const handleSubmit = () => {
    if (!form.fullName || !form.mobile) {
      toast.error('Please fill required fields');
      return;
    }
    const project = projects.find(p => p.id === form.projectId);
    const lead: Lead = {
      id: `L${Date.now()}`,
      customerName: form.fullName,
      phone: form.mobile,
      email: form.email,
      projectId: form.projectId,
      projectName: project?.name || '',
      unitType: form.configurations[0] || '3BHK',
      cpId: user?.id || 'CP001',
      cpName: user?.name || 'Unknown CP',
      budget: form.budgetTo,
      stage: 'New Lead',
      notes: form.notes,
      source: form.source,
      createdAt: new Date().toISOString().split('T')[0],
      daysInStage: 0,
    };
    addLead(lead);
    const followupMsg = form.followUpDate ? ` Follow up by ${form.followUpDate}.` : '';
    toast.success(`Lead added!${followupMsg}`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 modal-backdrop" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[480px] bg-card border-l border-border overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h3 className="font-bold text-card-foreground text-lg">Add New Lead</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-6">
          {/* Section A */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Customer Identity</h4>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Full Name <span className="text-destructive">*</span></label>
              <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Mobile Number <span className="text-destructive">*</span></label>
              <div className="flex">
                <span className="px-3 py-2 rounded-l-lg border border-r-0 border-input bg-muted text-sm text-muted-foreground">+91</span>
                <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="w-full px-3 py-2 rounded-r-lg border border-input bg-card text-sm" maxLength={10} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.whatsappSame} onChange={e => setForm({...form, whatsappSame: e.target.checked})} className="rounded accent-secondary" />
              WhatsApp same as mobile
            </label>
            {!form.whatsappSame && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">WhatsApp Number</label>
                <input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Customer Type <span className="text-destructive">*</span></label>
              <div className="flex gap-2">
                {['End User', 'Investor', 'NRI'].map(t => (
                  <button key={t} onClick={() => setForm({...form, customerType: t})}
                    className={`px-4 py-2 rounded-lg text-xs font-medium border ${form.customerType === t ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Source of Lead <span className="text-destructive">*</span></label>
              <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">
                {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Section B */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Property Requirement</h4>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Interested Project <span className="text-destructive">*</span></label>
              <select value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.location}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Preferred Configuration <span className="text-destructive">*</span></label>
              <div className="flex flex-wrap gap-2">
                {configOptions.map(c => (
                  <button key={c} onClick={() => toggleConfig(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${form.configurations.includes(c) ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground'}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Budget Range <span className="text-destructive">*</span></label>
              <p className="text-sm font-medium text-secondary mb-2">₹{(form.budgetFrom / 100000).toFixed(0)}L – ₹{form.budgetTo >= 10000000 ? (form.budgetTo / 10000000).toFixed(1) + 'Cr' : (form.budgetTo / 100000).toFixed(0) + 'L'}</p>
              <div className="flex gap-3">
                <input type="range" min={2000000} max={50000000} step={500000} value={form.budgetFrom} onChange={e => setForm({...form, budgetFrom: parseInt(e.target.value)})} className="flex-1 accent-secondary" />
                <input type="range" min={2000000} max={50000000} step={500000} value={form.budgetTo} onChange={e => setForm({...form, budgetTo: parseInt(e.target.value)})} className="flex-1 accent-secondary" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Preferred Possession <span className="text-destructive">*</span></label>
              <div className="flex flex-wrap gap-2">
                {possessionOptions.map(p => (
                  <button key={p} onClick={() => setForm({...form, possession: p})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${form.possession === p ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground'}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Facing Preference</label>
              <div className="flex flex-wrap gap-2">
                {facingOptions.map(f => (
                  <button key={f} onClick={() => toggleFacing(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${form.facing.includes(f) ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground'}`}>{f}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Section C */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Intent & Qualification</h4>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Site Visit Willing <span className="text-destructive">*</span></label>
              <div className="flex flex-wrap gap-2">
                {siteVisitOptions.map(s => (
                  <button key={s} onClick={() => setForm({...form, siteVisit: s})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${form.siteVisit === s ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Home Loan Required <span className="text-destructive">*</span></label>
              <div className="flex gap-2">
                {loanOptions.map(l => (
                  <button key={l} onClick={() => setForm({...form, loanRequired: l})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${form.loanRequired === l ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Urgency to Buy <span className="text-destructive">*</span></label>
              <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">
                {urgencyOptions.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Lead Priority <span className="text-destructive">*</span></label>
              <div className="flex gap-2">
                {[
                  { label: '🔴 Hot', value: 'Hot' as const },
                  { label: '🟡 Warm', value: 'Warm' as const },
                  { label: '🔵 Cold', value: 'Cold' as const },
                ].map(p => (
                  <button key={p.value} onClick={() => setForm({...form, priority: p.value})}
                    className={`px-4 py-2 rounded-lg text-xs font-medium border ${form.priority === p.value ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground'}`}>{p.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Section D */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes</h4>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Initial Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm h-20 resize-none" placeholder="Key details from first conversation, objections, preferences..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Follow-up Date</label>
                <input type="date" value={form.followUpDate} onChange={e => setForm({...form, followUpDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Follow-up Time</label>
                <input type="time" value={form.followUpTime} onChange={e => setForm({...form, followUpTime: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
              </div>
            </div>
          </div>

          <button onClick={handleSubmit} className="w-full py-3 rounded-lg font-semibold text-sm bg-accent text-accent-foreground hover:opacity-90 transition-opacity">
            Add Lead to Pipeline
          </button>
        </div>
      </div>
    </>
  );
};

export default AddLeadPanel;
