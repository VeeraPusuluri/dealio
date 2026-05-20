import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { landListings, builderInterests } from '@/data/landListings';
import { formatCurrency, formatDate } from '@/lib/format';
import { MapPin, Users, Clock, AlertCircle, FileText, Download, CheckCircle, Handshake } from 'lucide-react';

const jvAgreements = [
  { id: 'JV001', builder: 'Prestige Group', project: 'Kokapet Villas', revenueShare: 40, agreementDate: '2024-12-01', status: 'Active', totalRevenue: 32000000, received: 12800000 },
  { id: 'JV002', builder: 'Sobha Ltd', project: 'Adibatla Township', revenueShare: 35, agreementDate: '2025-01-05', status: 'Under Review', totalRevenue: 0, received: 0 },
];

const revenueHistory = [
  { date: '2025-01-15', amount: 6400000, project: 'Kokapet Villas', ref: 'PAY-2025-001' },
  { date: '2024-12-28', amount: 6400000, project: 'Kokapet Villas', ref: 'PAY-2024-012' },
];

const documents = [
  { name: 'Land Title Deed — Kokapet', status: 'Uploaded' },
  { name: 'JV Agreement — Prestige', status: 'Uploaded' },
  { name: 'NOC Certificate', status: 'Uploaded' },
  { name: 'Encumbrance Certificate', status: 'Uploaded' },
  { name: 'Layout Approval — Adibatla', status: 'Pending' },
];

const approvals = [
  { item: 'Approve revised JV terms for Sobha Township', status: 'Pending', date: '2025-01-18' },
  { item: 'Sign NOC for Phase 2 construction', status: 'Pending', date: '2025-01-20' },
];

const LandOwnerDashboard = () => {
  const active = landListings.filter(l => l.status === 'Active').length;
  const totalRevenue = revenueHistory.reduce((s, r) => s + r.amount, 0);
  const pendingApprovals = approvals.length;
  const pendingDocs = documents.filter(d => d.status === 'Pending').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active JV Projects" value={jvAgreements.filter(j => j.status === 'Active').length} icon={Handshake} color="#C0392B" />
          <StatCard title="Revenue Earned" value={`₹${(totalRevenue / 10000000).toFixed(1)}Cr`} icon={MapPin} color="#16A34A" />
          <StatCard title="Pending Approvals" value={pendingApprovals} icon={Clock} color="#F59E0B" />
          <StatCard title="Documents Pending" value={pendingDocs} icon={FileText} color="#2E5D8E" />
        </div>

        {/* My Land */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold text-card-foreground mb-4">My Land Parcels</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border">
                <th className="px-4 py-3">Location</th><th className="px-4 py-3">Area</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Interest</th>
              </tr></thead>
              <tbody>{landListings.map(l => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-card-foreground">{l.location}, {l.city}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.area} {l.areaUnit}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.dealPreference}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3 text-right font-semibold text-card-foreground">{l.buildersInterested}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        {/* JV Agreements */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold text-card-foreground mb-4">JV Agreements</h3>
          <div className="space-y-3">
            {jvAgreements.map(jv => (
              <div key={jv.id} className="p-4 bg-muted rounded-lg flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{jv.project}</p>
                  <p className="text-xs text-muted-foreground">Builder: {jv.builder} · Revenue Share: {jv.revenueShare}% · Since: {formatDate(jv.agreementDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {jv.received > 0 && <span className="text-sm font-semibold text-card-foreground">{formatCurrency(jv.received)} received</span>}
                  <StatusBadge status={jv.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue & Documents side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-5 border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Revenue History</h3>
            {revenueHistory.map(r => (
              <div key={r.ref} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{formatCurrency(r.amount)}</p>
                  <p className="text-xs text-muted-foreground">{r.project} · {formatDate(r.date)} · Ref: {r.ref}</p>
                </div>
                <CheckCircle size={16} className="text-green-600" />
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl p-5 border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Documents</h3>
            {documents.map(d => (
              <div key={d.name} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-muted-foreground" />
                  <span className="text-sm text-card-foreground">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={d.status} color={d.status === 'Uploaded' ? '#16A34A' : '#F59E0B'} />
                  {d.status === 'Uploaded' && <button className="p-1 hover:bg-muted rounded"><Download size={14} className="text-muted-foreground" /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approvals */}
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold text-card-foreground mb-4">Pending Approvals</h3>
          {approvals.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium text-card-foreground">{a.item}</p>
                <p className="text-xs text-muted-foreground">Due: {formatDate(a.date)}</p>
              </div>
              <button className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: '#C0392B' }}>Approve</button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LandOwnerDashboard;
