import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { channelPartners } from '@/data/channelPartners';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';

const cityOptions = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'];
const specOptions = ['Residential', 'Commercial', 'Luxury', 'Affordable', 'NRI Deals', 'Plots'];
const tierColors = { Platinum: '#8B5CF6', Gold: '#F59E0B', Silver: '#6B7280' };

const AdminCPs = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: '', displayName: '', mobile: '', whatsapp: '', email: '',
    city: 'Hyderabad', state: 'Telangana', areas: [] as string[],
    reraAgent: '', reraState: '', reraExpiry: '',
    aadhaar: '', pan: '',
    accountName: '', accountNumber: '', ifsc: '', bankName: '',
    referredBy: '', tier: 'Silver' as 'Silver' | 'Gold' | 'Platinum',
    specialization: [] as string[],
    commissionRate: 2.5,
  });

  const toggleSpec = (s: string) => {
    setForm(prev => ({
      ...prev,
      specialization: prev.specialization.includes(s)
        ? prev.specialization.filter(x => x !== s)
        : [...prev.specialization, s],
    }));
  };

  const handleSubmit = () => {
    const code = `CP-${form.fullName.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    toast.success(`CP profile created! Referral code: ${code}`);
    setShowForm(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Channel Partner Management</h2>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground flex items-center gap-1.5"><Plus size={16} /> Add CP</button>
        </div>

        <div className="bg-card rounded-lg card-shadow border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">City</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tier</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Deals</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Earnings</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Score</th>
            </tr></thead>
            <tbody>
              {channelPartners.map(cp => (
                <tr key={cp.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-card-foreground">{cp.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cp.city}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: tierColors[cp.tier] }}>{cp.tier}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{cp.totalDeals}</td>
                  <td className="px-4 py-3 font-medium">₹{(cp.totalEarnings / 100000).toFixed(1)}L</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-secondary" style={{ width: `${cp.influencerScore}%` }} /></div>
                      <span className="text-xs text-muted-foreground">{cp.influencerScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showForm && (
          <>
            <div className="fixed inset-0 z-40 modal-backdrop" onClick={() => setShowForm(false)} />
            <div className="fixed right-0 top-0 bottom-0 z-50 w-[500px] bg-card border-l border-border overflow-y-auto">
              <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
                <h3 className="font-bold text-card-foreground">Add New Channel Partner</h3>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded"><X size={18} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Full Name <span className="text-destructive">*</span></label><input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Display Name <span className="text-destructive">*</span></label><input value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Mobile <span className="text-destructive">*</span></label><input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" maxLength={10} /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Email <span className="text-destructive">*</span></label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">City <span className="text-destructive">*</span></label><select value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">{cityOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">RERA Agent Number <span className="text-destructive">*</span></label><input value={form.reraAgent} onChange={e => setForm({...form, reraAgent: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">PAN Number <span className="text-destructive">*</span></label><input value={form.pan} onChange={e => setForm({...form, pan: e.target.value.toUpperCase()})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" maxLength={10} /></div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Tier <span className="text-destructive">*</span></label>
                    <div className="flex gap-2">
                      {(['Silver', 'Gold', 'Platinum'] as const).map(t => (
                        <button key={t} onClick={() => setForm({...form, tier: t})}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${form.tier === t ? 'text-white' : 'border-input text-muted-foreground'}`}
                          style={form.tier === t ? { backgroundColor: tierColors[t], borderColor: tierColors[t] } : {}}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Specialization</label>
                  <div className="flex flex-wrap gap-2">
                    {specOptions.map(s => (
                      <button key={s} onClick={() => toggleSpec(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${form.specialization.includes(s) ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Commission Rate (%) <span className="text-destructive">*</span></label>
                  <input type="number" value={form.commissionRate} onChange={e => setForm({...form, commissionRate: parseFloat(e.target.value) || 0})} className="w-40 px-3 py-2 rounded-lg border border-input bg-card text-sm" step={0.25} />
                </div>
                <button onClick={handleSubmit} className="w-full py-2.5 rounded-lg font-semibold text-sm bg-secondary text-secondary-foreground">Create CP Profile</button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCPs;
