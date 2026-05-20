import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Edit, Send, ToggleLeft, ToggleRight } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  trigger: string;
  message: string;
  active: boolean;
  variables: string[];
}

const initialTemplates: Template[] = [
  { id: 'T1', name: 'New Launch Announcement', trigger: 'New Project Published', message: 'Hi [CP_Name], exciting news! [Project_Name] in [Location] just launched. [BHK_Types] starting ₹[Price]. Commission: [Commission]%. Be the first to share with your network! [Link]', active: true, variables: ['CP_Name', 'Project_Name', 'Location', 'BHK_Types', 'Price', 'Commission', 'Link'] },
  { id: 'T2', name: 'Site Visit Confirmation', trigger: 'Visit Scheduled', message: 'Hi [Customer_Name], your visit to [Project_Name] is confirmed for [Date] at [Time]. Address: [Location]. Contact: [CP_Name] at [CP_Phone]. See you there!', active: true, variables: ['Customer_Name', 'Project_Name', 'Date', 'Time', 'Location', 'CP_Name', 'CP_Phone'] },
  { id: 'T3', name: 'Booking Congratulations', trigger: 'Unit Booked', message: 'Congratulations [Customer_Name]! Your home at [Project_Name], Unit [Unit_No] is officially booked. Welcome to the [Builder_Name] family! Our team will contact you within 24 hours.', active: true, variables: ['Customer_Name', 'Project_Name', 'Unit_No', 'Builder_Name'] },
  { id: 'T4', name: 'Loan Sanctioned Alert', trigger: 'Loan Sanctioned', message: 'Great news [Customer_Name]! Your home loan of ₹[Amount] from [Bank_Name] has been sanctioned. Disbursement will happen within 7 working days. Reach out if you need help with next steps.', active: true, variables: ['Customer_Name', 'Amount', 'Bank_Name'] },
  { id: 'T5', name: 'Commission Released', trigger: 'Commission Released', message: 'Hi [CP_Name], your commission of ₹[Amount] for [Project_Name] - [Customer_Name] has been released to your account. Ref: [Ref_No]. Keep closing deals! — CPConnect Team', active: true, variables: ['CP_Name', 'Amount', 'Project_Name', 'Customer_Name', 'Ref_No'] },
  { id: 'T6', name: 'Follow-up Nudge', trigger: 'Lead Stale 48hrs', message: 'Hi [Customer_Name], just checking in on your property search! Have you had time to think about [Project_Name]? I\'m here to answer any questions. — [CP_Name]', active: true, variables: ['Customer_Name', 'Project_Name', 'CP_Name'] },
];

const AdminCampaigns = () => {
  const [templates, setTemplates] = useState(initialTemplates);
  const [editModal, setEditModal] = useState<Template | null>(null);
  const [editText, setEditText] = useState('');

  const toggleActive = (id: string) => {
    setTemplates((t) => t.map((tm) => tm.id === id ? { ...tm, active: !tm.active } : tm));
  };

  const openEdit = (t: Template) => { setEditModal(t); setEditText(t.message); };

  const saveEdit = () => {
    if (!editModal) return;
    setTemplates((t) => t.map((tm) => tm.id === editModal.id ? { ...tm, message: editText } : tm));
    toast.success('Template updated');
    setEditModal(null);
  };

  const testSend = (t: Template) => {
    toast.success(`Test message sent for "${t.name}"`, { description: t.message.substring(0, 80) + '...' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">WhatsApp Campaign Templates</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.id} className={`bg-card rounded-lg p-5 card-shadow border border-border ${!t.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-card-foreground text-sm">{t.name}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{t.trigger}</span>
                </div>
                <button onClick={() => toggleActive(t.id)} className="text-muted-foreground hover:text-foreground">
                  {t.active ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{t.message}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {t.variables.map((v) => (
                  <span key={v} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">[{v}]</span>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(t)} className="text-xs gap-1"><Edit size={12} />Edit</Button>
                <Button size="sm" variant="outline" onClick={() => testSend(t)} className="text-xs gap-1"><Send size={12} />Test Send</Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Template: {editModal?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {editModal?.variables.map((v) => (
                <button key={v} onClick={() => setEditText((t) => t + `[${v}]`)}
                  className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary font-medium hover:bg-primary/20">
                  [{v}]
                </button>
              ))}
            </div>
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 text-sm rounded-lg border border-border bg-background text-foreground resize-none" rows={6} />
            <Button onClick={saveEdit} className="w-full">Save Template</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminCampaigns;
