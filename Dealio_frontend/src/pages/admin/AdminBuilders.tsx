import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { X, Building2 } from 'lucide-react';

const cityOptions = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'];
const builderTypes = ['Private Developer', 'Government', 'Joint Venture', 'NBCC'];

const AdminBuilders = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: '', brandName: '', builderType: 'Private Developer',
    address: '', state: '', city: 'Hyderabad', pincode: '',
    contactName: '', designation: '', mobile: '', email: '',
    pan: '', gstin: '', reraId: '', reraState: '', reraDate: '',
    projectsCompleted: 0, unitsDelivered: 0,
    accountName: '', accountNumber: '', ifsc: '', bankName: '',
    platformCut: 10, status: 'Active',
  });

  const existingBuilders = [
    { id: 'B001', name: 'Prestige Group', city: 'Hyderabad', projects: 12, status: 'Active', rera: 'REG-AP-2020-001' },
    { id: 'B002', name: 'Sobha Ltd', city: 'Bengaluru', projects: 8, status: 'Active', rera: 'REG-KA-2019-045' },
    { id: 'B003', name: 'My Home Group', city: 'Hyderabad', projects: 6, status: 'Active', rera: 'REG-TS-2021-112' },
    { id: 'B004', name: 'Aparna Constructions', city: 'Hyderabad', projects: 15, status: 'Active', rera: 'REG-TS-2018-078' },
    { id: 'B005', name: 'Incor Infrastructure', city: 'Hyderabad', projects: 4, status: 'Pending Verification', rera: 'REG-TS-2022-034' },
    { id: 'B006', name: 'Mahindra Lifespaces', city: 'Mumbai', projects: 20, status: 'Active', rera: 'REG-MH-2017-056' },
  ];

  const handleSubmit = () => {
    toast.success('Builder profile created! Welcome email sent.');
    setShowForm(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Builder Management</h2>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground">+ Add Builder</button>
        </div>

        <div className="bg-card rounded-lg card-shadow border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Builder</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">City</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Projects</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">RERA ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
            </tr></thead>
            <tbody>
              {existingBuilders.map(b => (
                <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-card-foreground">{b.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.city}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.projects}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{b.rera}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${b.status === 'Active' ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Builder Form Modal */}
        {showForm && (
          <>
            <div className="fixed inset-0 z-40 modal-backdrop" onClick={() => setShowForm(false)} />
            <div className="fixed right-0 top-0 bottom-0 z-50 w-[540px] bg-card border-l border-border overflow-y-auto">
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
                <h3 className="font-bold text-card-foreground">Add New Builder</h3>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Company Name <span className="text-destructive">*</span></label><input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Brand Name <span className="text-destructive">*</span></label><input value={form.brandName} onChange={e => setForm({...form, brandName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Builder Type <span className="text-destructive">*</span></label><select value={form.builderType} onChange={e => setForm({...form, builderType: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">{builderTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">City <span className="text-destructive">*</span></label><select value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">{cityOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div className="col-span-2"><label className="text-sm font-medium text-foreground mb-1 block">Registered Office Address <span className="text-destructive">*</span></label><textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm h-16 resize-none" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Contact Person <span className="text-destructive">*</span></label><input value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Mobile <span className="text-destructive">*</span></label><input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Email <span className="text-destructive">*</span></label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Company PAN <span className="text-destructive">*</span></label><input value={form.pan} onChange={e => setForm({...form, pan: e.target.value.toUpperCase()})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" maxLength={10} /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">GSTIN <span className="text-destructive">*</span></label><input value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">RERA Developer ID <span className="text-destructive">*</span></label><input value={form.reraId} onChange={e => setForm({...form, reraId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Projects Completed</label><input type="number" value={form.projectsCompleted || ''} onChange={e => setForm({...form, projectsCompleted: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Platform Commission Cut %</label><input type="number" value={form.platformCut} onChange={e => setForm({...form, platformCut: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Bank Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium text-foreground mb-1 block">Account Name</label><input value={form.accountName} onChange={e => setForm({...form, accountName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                    <div><label className="text-sm font-medium text-foreground mb-1 block">Account Number</label><input value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                    <div><label className="text-sm font-medium text-foreground mb-1 block">IFSC</label><input value={form.ifsc} onChange={e => setForm({...form, ifsc: e.target.value.toUpperCase()})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                    <div><label className="text-sm font-medium text-foreground mb-1 block">Bank Name</label><input value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Uploads</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['Company Registration', 'PAN Card', 'RERA Certificate', 'GST Certificate', 'Logo'].map(doc => (
                      <div key={doc} className="border-2 border-dashed border-input rounded-lg p-3 text-center text-xs text-muted-foreground cursor-pointer hover:border-secondary/40">{doc}</div>
                    ))}
                  </div>
                </div>
                <button onClick={handleSubmit} className="w-full py-2.5 rounded-lg font-semibold text-sm bg-secondary text-secondary-foreground">Create Builder Profile</button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminBuilders;
