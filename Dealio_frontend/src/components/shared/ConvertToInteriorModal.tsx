import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useInteriorStore, InteriorThread } from '@/stores/useInteriorStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { services } from '@/data/services';
import { projects } from '@/data/projects';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface ConvertToInteriorModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
  projectName?: string;
  unit?: string;
  tower?: string;
  sqft?: number;
  source: 'builder' | 'cp';
}

const serviceOptions = ['Full Interior', 'Modular Kitchen', 'Wardrobe', 'False Ceiling', 'Flooring', 'Painting', 'Electrical', 'Plumbing'];

const ConvertToInteriorModal = ({ isOpen, onClose, customerName = '', projectName = '', unit = '', tower = '', sqft = 0, source }: ConvertToInteriorModalProps) => {
  const { addThread } = useInteriorStore();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    customerName, projectName, unit, tower, sqft,
    vendorId: 'SV001',
    serviceInterest: [] as string[],
    notes: '',
    customerPhone: '',
  });

  if (!isOpen) return null;

  const toggleService = (s: string) => {
    setForm(prev => ({
      ...prev,
      serviceInterest: prev.serviceInterest.includes(s)
        ? prev.serviceInterest.filter(x => x !== s)
        : [...prev.serviceInterest, s],
    }));
  };

  const handleSubmit = () => {
    const vendor = services.find(s => s.id === form.vendorId);
    const thread: InteriorThread = {
      id: `IT${Date.now()}`,
      customerId: `C${Date.now()}`,
      customerName: form.customerName,
      customerPhone: form.customerPhone || '9800000000',
      projectId: '',
      projectName: form.projectName,
      unit: form.unit,
      tower: form.tower,
      sqft: form.sqft,
      vendorId: form.vendorId,
      vendorName: vendor?.name || 'DesignCraft Interiors',
      leadSource: source === 'cp' ? 'CP Referral' : 'Builder Conversion',
      cpId: source === 'cp' ? user?.id : undefined,
      cpName: source === 'cp' ? user?.name : undefined,
      builderId: source === 'builder' ? user?.id : undefined,
      builderName: source === 'builder' ? user?.name : undefined,
      serviceInterest: form.serviceInterest,
      status: 'New',
      events: [
        { id: `IE${Date.now()}`, type: 'property', sender: 'System', senderRole: 'system', content: `Property: ${form.projectName}, Tower ${form.tower}, Unit ${form.unit}, ${form.sqft} sqft`, timestamp: new Date().toISOString() },
        { id: `IE${Date.now() + 1}`, type: 'referral', sender: user?.name || '', senderRole: source, content: source === 'cp' ? `Lead referred by CP ${user?.name}` : `Converted from sale by ${user?.name}`, timestamp: new Date().toISOString() },
      ],
      createdAt: new Date().toISOString().split('T')[0],
    };
    if (form.notes) {
      thread.events.push({ id: `IE${Date.now() + 2}`, type: 'note', sender: user?.name || '', senderRole: source, content: form.notes, timestamp: new Date().toISOString() });
    }
    addThread(thread);
    toast.success('Interior lead created! Vendor notified.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center">
      <div className="bg-card rounded-lg card-shadow border border-border w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-card-foreground">{source === 'builder' ? 'Convert to Interior Lead' : 'Refer to Interior'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Customer Name</label>
            <input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Project</label>
              <input value={form.projectName} onChange={e => setForm({...form, projectName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Unit</label>
              <input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Flat Size (sqft)</label>
            <input type="number" value={form.sqft || ''} onChange={e => setForm({...form, sqft: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Select Interior Vendor</label>
            <select value={form.vendorId} onChange={e => setForm({...form, vendorId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">
              {services.filter(s => s.category === 'Interior Design' || s.category === 'Civil Work').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Service Interest <span className="text-destructive">*</span></label>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.map(s => (
                <button key={s} onClick={() => toggleService(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${form.serviceInterest.includes(s) ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Notes for Vendor</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm h-20 resize-none" />
          </div>
          <button onClick={handleSubmit} className="w-full py-2.5 rounded-lg font-semibold text-sm bg-secondary text-secondary-foreground">
            Confirm & Create Interior Lead
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConvertToInteriorModal;
