import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDealStore } from '@/stores/useDealStore';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const NRILoanStatus = () => {
  const { loanCases } = useDealStore();
  const nriCases = loanCases.filter((lc) => lc.isNRI);

  if (nriCases.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle size={48} className="text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-card-foreground mb-2">No Active Loan</h2>
          <p className="text-muted-foreground">You don't have an active NRI loan application yet.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-card-foreground">My NRI Loan Status</h2>

        {nriCases.map((lc) => {
          const completed = lc.milestones.filter((m) => m.status === 'Completed').length;
          const progress = (completed / lc.milestones.length) * 100;

          return (
            <div key={lc.id} className="bg-card rounded-lg p-6 card-shadow border border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-card-foreground text-lg">{lc.projectName}</h3>
                  <p className="text-sm text-muted-foreground">{lc.unitType} · {lc.loanType || 'NRI Home Loan'} · ₹{(lc.loanAmount / 100000).toFixed(0)}L</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Bank Officer</p>
                  <p className="text-sm font-medium text-card-foreground">{lc.bankOfficerName || 'Not assigned'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <Progress value={progress} className="h-3 flex-1" />
                <span className="text-sm font-semibold text-card-foreground">{Math.round(progress)}%</span>
              </div>

              <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
                {lc.milestones.map((m, i) => (
                  <div key={m.id} className="flex items-center">
                    <div className="flex flex-col items-center min-w-[80px]">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        m.status === 'Completed' ? 'bg-green-500 text-white' :
                        m.status === 'In Progress' ? 'bg-amber-500 text-white animate-pulse' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {m.status === 'Completed' ? <CheckCircle2 size={16} /> :
                         m.status === 'In Progress' ? <Clock size={16} /> :
                         <span className="text-xs">{i + 1}</span>}
                      </div>
                      <p className={`text-[10px] text-center mt-1 max-w-[80px] ${
                        m.status === 'Completed' ? 'text-green-600 dark:text-green-400 font-medium' :
                        m.status === 'In Progress' ? 'text-amber-600 dark:text-amber-400 font-medium' :
                        'text-muted-foreground'
                      }`}>{m.stage}</p>
                    </div>
                    {i < lc.milestones.length - 1 && (
                      <div className={`h-0.5 w-6 ${m.status === 'Completed' ? 'bg-green-400' : 'bg-border'}`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {lc.milestones.map((m) => (
                  <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg ${
                    m.status === 'Completed' ? 'bg-green-50/50 dark:bg-green-950/10' :
                    m.status === 'In Progress' ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800' :
                    'bg-muted/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      {m.status === 'Completed' ? <CheckCircle2 size={16} className="text-green-600" /> :
                       m.status === 'In Progress' ? <Clock size={16} className="text-amber-500" /> :
                       <AlertCircle size={16} className="text-muted-foreground" />}
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{m.stage}</p>
                        {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
                      </div>
                    </div>
                    {m.completedDate && <span className="text-xs text-muted-foreground">{m.completedDate}</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default NRILoanStatus;
