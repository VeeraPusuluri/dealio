import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLoanThreadStore, loanThreadStatusColors } from '@/stores/useLoanThreadStore';
import { useInteriorStore, interiorStatusColors } from '@/stores/useInteriorStore';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

const AdminDeals = () => {
  const { threads: loanThreads } = useLoanThreadStore();
  const { threads: interiorThreads } = useInteriorStore();
  const [activeTab, setActiveTab] = useState<'loans' | 'interior'>('loans');

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Deal Oversight</h2>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('loans')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'loans' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>Active Loans ({loanThreads.length})</button>
          <button onClick={() => setActiveTab('interior')} className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'interior' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>Interior Jobs ({interiorThreads.length})</button>
        </div>

        {activeTab === 'loans' && (
          <div className="bg-card rounded-lg card-shadow border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Bank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">CP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Officer</th>
              </tr></thead>
              <tbody>
                {loanThreads.map(t => (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-card-foreground">{t.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.projectName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.bank}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(t.loanAmount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.cpName || '—'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: loanThreadStatusColors[t.status] }}>{t.status}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{t.officerName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'interior' && (
          <div className="bg-card rounded-lg card-shadow border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Project / Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Services</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Quote</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              </tr></thead>
              <tbody>
                {interiorThreads.map(t => (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-card-foreground">{t.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.projectName} {t.tower}-{t.unit}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.vendorName}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${t.leadSource === 'CP Referral' ? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'}`}>{t.leadSource}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.serviceInterest.slice(0, 2).join(', ')}</td>
                    <td className="px-4 py-3 font-medium">{t.quoteAmount ? formatCurrency(t.quoteAmount) : '—'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: interiorStatusColors[t.status] }}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDeals;
