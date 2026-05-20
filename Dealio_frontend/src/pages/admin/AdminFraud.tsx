import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { fraudAlerts, FraudAlert, FraudStatus, duplicateLeads } from '@/data/fraudAlerts';
import { roleColors, roleLabels } from '@/stores/useAuthStore';
import { formatCurrency, formatDate } from '@/lib/format';
import { AlertTriangle, ShieldAlert, CheckCircle, Ban, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const fraudStatusColors: Record<FraudStatus, string> = { Open: '#DC2626', 'Under Review': '#F59E0B', Resolved: '#16A34A', 'False Positive': '#9CA3AF' };

const AdminFraud = () => {
  const [alerts, setAlerts] = useState(fraudAlerts);
  const [tab, setTab] = useState<'alerts' | 'duplicates'>('alerts');
  const [drawerAlert, setDrawerAlert] = useState<FraudAlert | null>(null);

  const highRisk = alerts.filter(a => a.riskScore >= 71 && a.status === 'Open').length;
  const mediumRisk = alerts.filter(a => a.riskScore >= 41 && a.riskScore < 71 && a.status === 'Open').length;
  const resolved = alerts.filter(a => a.status === 'Resolved').length;
  const falsePositives = alerts.filter(a => a.status === 'False Positive').length;

  const updateStatus = (id: string, status: FraudStatus) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setDrawerAlert(null);
    toast.success(`Alert marked as ${status}`);
  };

  const riskColor = (score: number) => score >= 71 ? '#DC2626' : score >= 41 ? '#F59E0B' : '#16A34A';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="High Risk Alerts" value={highRisk} icon={AlertTriangle} color="#DC2626" />
          <StatCard title="Medium Risk" value={mediumRisk} icon={ShieldAlert} color="#F59E0B" />
          <StatCard title="Resolved This Week" value={resolved} icon={CheckCircle} color="#16A34A" />
          <StatCard title="False Positives" value={falsePositives} icon={Ban} color="#9CA3AF" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          <button onClick={() => setTab('alerts')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'alerts' ? 'bg-card shadow text-card-foreground' : 'text-muted-foreground'}`}>Fraud Alerts</button>
          <button onClick={() => setTab('duplicates')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'duplicates' ? 'bg-card shadow text-card-foreground' : 'text-muted-foreground'}`}>Duplicate Leads</button>
        </div>

        {tab === 'alerts' && (
          <div className="bg-card rounded-lg card-shadow border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium text-right">Amount at Risk</th>
                <th className="px-4 py-3 font-medium">Risk Score</th>
                <th className="px-4 py-3 font-medium">Detected</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id} onClick={() => setDrawerAlert(a)} className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer">
                    <td className="px-4 py-3 font-medium text-card-foreground">{a.id}</td>
                    <td className="px-4 py-3 text-card-foreground">{a.type}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-card-foreground">{a.affectedUser}</span>
                        <StatusBadge status={roleLabels[a.affectedRole as keyof typeof roleLabels] || a.affectedRole} color={roleColors[a.affectedRole as keyof typeof roleColors] || '#6B7280'} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.project}</td>
                    <td className="px-4 py-3 text-right font-medium text-card-foreground">{formatCurrency(a.amountAtRisk)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={a.riskScore} className="h-2 w-16" />
                        <span className="text-xs font-semibold" style={{ color: riskColor(a.riskScore) }}>{a.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(a.dateDetected)}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} color={fraudStatusColors[a.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'duplicates' && (
          <div className="bg-card rounded-lg card-shadow border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">First CP</th>
                <th className="px-4 py-3 font-medium">First Date</th>
                <th className="px-4 py-3 font-medium">Second CP</th>
                <th className="px-4 py-3 font-medium">Second Date</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {duplicateLeads.map((d, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-card-foreground">{d.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.project}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{d.firstCP}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(d.firstDate)}</td>
                    <td className="px-4 py-3 text-red-500 font-medium">{d.secondCP}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(d.secondDate)}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => toast.success(`Lead awarded to ${d.firstCP}`)} className="px-3 py-1 rounded text-xs font-medium bg-green-600 text-white">Award to First CP</button>
                      <button onClick={() => toast.success('Investigating...')} className="px-3 py-1 rounded text-xs font-medium bg-muted text-card-foreground">Investigate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert Detail Drawer */}
      {drawerAlert && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerAlert(null)} />
          <div className="relative w-full max-w-lg bg-card h-full overflow-y-auto animate-slide-up shadow-xl">
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-card-foreground">Alert {drawerAlert.id}</h2>
                <button onClick={() => setDrawerAlert(null)} className="p-1 hover:bg-muted rounded"><X size={20} /></button>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={drawerAlert.type} color="#DC2626" />
                <StatusBadge status={drawerAlert.status} color={fraudStatusColors[drawerAlert.status]} />
                <div className="flex items-center gap-1">
                  <Progress value={drawerAlert.riskScore} className="h-2 w-16" />
                  <span className="text-xs font-bold" style={{ color: riskColor(drawerAlert.riskScore) }}>{drawerAlert.riskScore}</span>
                </div>
              </div>
              <p className="text-sm text-card-foreground">{drawerAlert.description}</p>

              <div>
                <h4 className="font-semibold text-card-foreground mb-2">Involved Parties</h4>
                <div className="space-y-1">
                  {drawerAlert.involvedParties.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm"><span className="text-card-foreground">{p.name}</span><span className="text-xs text-muted-foreground">({p.role})</span></div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-card-foreground mb-2">Timeline</h4>
                <div className="space-y-2">
                  {drawerAlert.timeline.map((t, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <div><span className="text-muted-foreground">{formatDate(t.date)}</span><p className="text-card-foreground">{t.event}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-card-foreground mb-2">Evidence</h4>
                <div className="space-y-1">
                  {drawerAlert.evidence.map((e, i) => <p key={i} className="text-sm text-muted-foreground">• {e}</p>)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => updateStatus(drawerAlert.id, 'False Positive')} className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-500 text-white">False Positive</button>
                <button onClick={() => toast.success('User suspended')} className="px-3 py-2 rounded-lg text-xs font-medium bg-red-600 text-white">Suspend User</button>
                <button onClick={() => toast.success('Commission blocked')} className="px-3 py-2 rounded-lg text-xs font-medium bg-yellow-600 text-white">Block Commission</button>
                <button onClick={() => updateStatus(drawerAlert.id, 'Resolved')} className="px-3 py-2 rounded-lg text-xs font-medium bg-green-600 text-white">Resolve</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminFraud;
