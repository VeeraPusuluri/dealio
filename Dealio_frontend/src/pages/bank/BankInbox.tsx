import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/format';
import { useLoanStore } from '@/stores/useLoanStore';

const BankInbox = () => {
  const { loans } = useLoanStore();
  return (
    <DashboardLayout>
      <div className="bg-card rounded-lg card-shadow border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="px-4 py-3 font-medium">App ID</th><th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Project</th><th className="px-4 py-3 font-medium text-right">Amount</th>
            <th className="px-4 py-3 font-medium">Bank</th><th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Officer</th>
          </tr></thead>
          <tbody>{loans.map(l => (
            <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-medium text-card-foreground">{l.id}</td>
              <td className="px-4 py-3 text-card-foreground">{l.customerName}</td>
              <td className="px-4 py-3 text-muted-foreground">{l.projectName}</td>
              <td className="px-4 py-3 text-right text-card-foreground">{formatCurrency(l.loanAmount)}</td>
              <td className="px-4 py-3 text-muted-foreground">{l.bank}</td>
              <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{l.officerName || '—'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};
export default BankInbox;
