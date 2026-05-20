import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { nriProperties } from '@/data/investments';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, Phone, MessageCircle, Wrench, Plus } from 'lucide-react';

const statusColors = { Tenanted: 'bg-green-100 text-green-800', Vacant: 'bg-red-100 text-red-800', 'Under Renovation': 'bg-amber-100 text-amber-800', 'Possession Pending': 'bg-gray-100 text-gray-800' };
const rentStatusColors = { Paid: 'text-green-600', Late: 'text-amber-600', Pending: 'text-red-600', Waived: 'text-gray-400' };

const NRIManage = () => {
  const [tab, setTab] = useState<'tenancy' | 'rent' | 'maintenance' | 'documents' | 'performance'>('tenancy');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueCategory, setIssueCategory] = useState('Plumbing');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueUrgency, setIssueUrgency] = useState('Within a week');
  const property = nriProperties[0];
  const tenant = property.tenant;
  const leaseEnd = new Date(tenant.leaseEnd);
  const daysToExpiry = Math.ceil((leaseEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const appreciation = ((property.currentValue - property.purchasePrice) / property.purchasePrice * 100).toFixed(1);
  const annualYield = (tenant.monthlyRent * 12 / property.currentValue * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Property Management</h2>

        {daysToExpiry <= 90 && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">⚠️ Tenancy expiring in {daysToExpiry} days — consider renewing.</div>
        )}

        {/* Property Card */}
        <div className="bg-card rounded-xl p-5 border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-lg">{property.name}</h3>
              <Badge className={`mt-1 ${statusColors[property.status]}`}>{property.status}</Badge>
            </div>
            <div className="text-right text-sm">
              <p className="text-muted-foreground">Monthly Rent</p>
              <p className="text-xl font-bold text-green-600">₹{tenant.monthlyRent.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Tenant</p><p className="font-medium">{tenant.name}</p></div>
            <div><p className="text-xs text-muted-foreground">Lease Expiry</p><p className="font-medium">{tenant.leaseEnd}</p></div>
            <div><p className="text-xs text-muted-foreground">Last Rent</p><p className="font-medium text-green-600">✅ Jan 1, 2025</p></div>
            <div><p className="text-xs text-muted-foreground">Manager</p><p className="font-medium">{property.manager}</p></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {(['tenancy', 'rent', 'maintenance', 'documents', 'performance'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t ? 'bg-[#0F2035] text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'tenancy' && (
          <div className="bg-card rounded-xl p-5 border space-y-4">
            <h3 className="font-semibold">Current Tenancy</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Tenant</p><p className="font-medium">{tenant.name}</p></div>
              <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{tenant.phone}</p></div>
              <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{tenant.email || 'N/A'}</p></div>
              <div><p className="text-xs text-muted-foreground">Company</p><p className="font-medium">{tenant.company || 'N/A'}</p></div>
              <div><p className="text-xs text-muted-foreground">Lease Period</p><p className="font-medium">{tenant.leaseStart} → {tenant.leaseEnd}</p></div>
              <div><p className="text-xs text-muted-foreground">Security Deposit</p><p className="font-medium">₹{tenant.deposit.toLocaleString('en-IN')}</p></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Lease Progress</p>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="h-2 rounded-full bg-teal-500" style={{ width: `${Math.min(100, ((Date.now() - new Date(tenant.leaseStart).getTime()) / (leaseEnd.getTime() - new Date(tenant.leaseStart).getTime())) * 100)}%` }} />
              </div>
            </div>
            <div className="flex gap-2">
              {daysToExpiry <= 90 && <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-teal-600" onClick={() => toast.success('Renewal request sent to property manager')}>Renew Tenancy</button>}
              <button className="px-4 py-2 rounded-lg text-sm font-medium border text-muted-foreground hover:bg-muted" onClick={() => toast.info('End tenancy flow initiated')}>End Tenancy</button>
            </div>
          </div>
        )}

        {tab === 'rent' && (
          <div className="bg-card rounded-xl p-5 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Rent Ledger</h3>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" defaultChecked className="accent-teal-600" /> Auto-collect reminder</label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-xs text-muted-foreground"><th className="p-2 text-left">Month</th><th className="p-2 text-left">Due</th><th className="p-2 text-left">Received</th><th className="p-2 text-left">Amount</th><th className="p-2 text-left">Status</th></tr></thead>
                <tbody>
                  {property.rentLedger.map((r, i) => (
                    <tr key={i} className={`border-b ${r.status === 'Late' ? 'bg-amber-50' : ''}`}>
                      <td className="p-2">{r.month}</td>
                      <td className="p-2">₹{r.due.toLocaleString('en-IN')}</td>
                      <td className="p-2">{r.received || '—'}</td>
                      <td className="p-2">₹{r.amount.toLocaleString('en-IN')}</td>
                      <td className="p-2"><span className={`font-medium ${rentStatusColors[r.status]}`}>{r.status === 'Paid' ? '✅ ' : ''}{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'maintenance' && (
          <div className="bg-card rounded-xl p-5 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Maintenance & Issues</h3>
              <button onClick={() => setShowIssueModal(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#F5A623]"><Plus size={14} /> Raise Issue</button>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs text-muted-foreground"><th className="p-2 text-left">#</th><th className="p-2 text-left">Category</th><th className="p-2 text-left">Description</th><th className="p-2 text-left">Date</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Cost</th></tr></thead>
              <tbody>
                {property.maintenance.map(m => (
                  <tr key={m.id} className="border-b">
                    <td className="p-2">{m.id}</td><td className="p-2">{m.category}</td><td className="p-2">{m.description}</td><td className="p-2">{m.date}</td>
                    <td className="p-2"><Badge className={m.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>{m.status}</Badge></td>
                    <td className="p-2">{m.cost ? `₹${m.cost.toLocaleString('en-IN')}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'documents' && (
          <div className="bg-card rounded-xl p-5 border">
            <h3 className="font-semibold mb-4">Property Documents</h3>
            {['Allotment Letter', 'Builder-Buyer Agreement', 'Sale Deed', 'Possession Certificate', 'Tenancy Agreement (Current)', 'Society NOC'].map((d, i) => (
              <div key={d} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{d}</span>
                <Badge className={i < 4 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{i < 4 ? '✅ Uploaded' : 'Pending'}</Badge>
              </div>
            ))}
          </div>
        )}

        {tab === 'performance' && (
          <div className="bg-card rounded-xl p-5 border">
            <h3 className="font-semibold mb-4">Property Performance</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-muted"><p className="text-xs text-muted-foreground">Purchase Price</p><p className="font-bold">₹{(property.purchasePrice / 10000000).toFixed(1)}Cr</p></div>
              <div className="p-3 rounded-lg bg-muted"><p className="text-xs text-muted-foreground">Current Value</p><p className="font-bold text-green-600">₹{(property.currentValue / 10000000).toFixed(2)}Cr</p></div>
              <div className="p-3 rounded-lg bg-muted"><p className="text-xs text-muted-foreground">Appreciation</p><p className="font-bold text-green-600">+{appreciation}%</p></div>
              <div className="p-3 rounded-lg bg-muted"><p className="text-xs text-muted-foreground">Total Rent Earned</p><p className="font-bold">₹{property.totalRentEarned.toLocaleString('en-IN')}</p></div>
              <div className="p-3 rounded-lg bg-muted"><p className="text-xs text-muted-foreground">Annual Yield</p><p className="font-bold">{annualYield}%</p></div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5A62315' }}><p className="text-xs text-muted-foreground">Total ROI</p><p className="font-bold text-lg" style={{ color: '#F5A623' }}>{((property.currentValue - property.purchasePrice + property.totalRentEarned) / property.purchasePrice * 100).toFixed(1)}%</p></div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showIssueModal} onOpenChange={setShowIssueModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Raise Maintenance Issue</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Category</label>
              <select value={issueCategory} onChange={e => setIssueCategory(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm bg-card">
                {['Plumbing', 'Electrical', 'Painting', 'Carpentry', 'Appliance', 'Pest Control', 'Security', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium">Description</label><textarea value={issueDesc} onChange={e => setIssueDesc(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm bg-card" rows={3} /></div>
            <div><label className="text-sm font-medium">Urgency</label>
              <div className="flex gap-2 mt-1">{['Emergency', 'Within a week', 'When convenient'].map(u => (
                <button key={u} onClick={() => setIssueUrgency(u)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${issueUrgency === u ? 'bg-[#0F2035] text-white border-[#0F2035]' : 'text-muted-foreground'}`}>{u}</button>
              ))}</div>
            </div>
            <button onClick={() => { toast.success('Issue raised — your property manager has been notified'); setShowIssueModal(false); setIssueDesc(''); }}
              className="w-full py-2.5 rounded-lg text-white font-medium text-sm bg-[#F5A623]">Submit Issue</button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default NRIManage;
