import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLoanThreadStore, loanThreadStatusColors } from '@/stores/useLoanThreadStore';
import { formatCurrency } from '@/lib/format';

const AdminDeals = () => {
  const { threads: loanThreads } = useLoanThreadStore();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Deal Oversight</h2>

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
      </div>
    </DashboardLayout>
  );
};

export default AdminDeals;