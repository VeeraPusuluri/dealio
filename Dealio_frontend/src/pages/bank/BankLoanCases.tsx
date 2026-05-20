import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDealStore } from '@/stores/useDealStore';
import { formatCurrency } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Clock, AlertCircle, FileText, MessageSquare, Inbox } from 'lucide-react';
import { toast } from 'sonner';

const BankLoanCases = () => {
  const { loanCases, updateLoanMilestone, deals } = useDealStore();
  const [filter, setFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [milestoneNotes, setMilestoneNotes] = useState('');

  const filtered = filter === 'all' ? loanCases : loanCases.filter((lc) => lc.status === filter);

  const completedCount = (milestones: any[]) => milestones.filter((m) => m.status === 'Completed').length;

  const handleMilestoneUpdate = (caseId: string, stage: string, status: 'Completed' | 'In Progress') => {
    updateLoanMilestone(caseId, stage, status, milestoneNotes);
    setMilestoneNotes('');
    toast.success(`${stage} marked as ${status}`);
  };

  const milestoneIcon = (status: string) => {
    if (status === 'Completed') return <CheckCircle2 size={16} className="text-green-600" />;
    if (status === 'In Progress') return <Clock size={16} className="text-amber-500 animate-pulse" />;
    return <AlertCircle size={16} className="text-muted-foreground" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">Loan Cases</h2>
            <p className="text-sm text-muted-foreground">{loanCases.length} total cases</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cases</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Sanctioned">Sanctioned</SelectItem>
              <SelectItem value="Disbursed">Disbursed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {filtered.map((lc) => {
            const completed = completedCount(lc.milestones);
            const progress = (completed / lc.milestones.length) * 100;
            const deal = deals.find((d) => d.id === lc.dealId);

            return (
              <div key={lc.id} className="bg-card rounded-lg p-5 card-shadow border border-border cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedCase(lc)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                      {lc.customerName}
                      {lc.isNRI && <Badge variant="outline" className="text-[10px]">NRI</Badge>}
                      {lc.loanType && <Badge variant="outline" className="text-[10px]">{lc.loanType}</Badge>}
                    </h3>
                    <p className="text-sm text-muted-foreground">{lc.projectName} · {lc.unitType} · {lc.builderName}</p>
                  </div>
                  <Badge className="bg-primary/10 text-primary">{lc.status}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Loan Amount</p>
                    <p className="font-semibold text-card-foreground">{formatCurrency(lc.loanAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Property Value</p>
                    <p className="font-semibold text-card-foreground">{formatCurrency(lc.propertyValue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Employment</p>
                    <p className="font-medium text-card-foreground">{lc.employmentType}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Progress value={progress} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground">{completed}/{lc.milestones.length}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loan Case Detail Modal */}
      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCase && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-card-foreground">{selectedCase.customerName}</h3>
                <p className="text-sm text-muted-foreground">{selectedCase.projectName} · {selectedCase.unitType}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Loan Amount</p>
                  <p className="font-bold text-card-foreground">{formatCurrency(selectedCase.loanAmount)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Property Value</p>
                  <p className="font-bold text-card-foreground">{formatCurrency(selectedCase.propertyValue)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Customer Phone</p>
                  <p className="font-medium text-card-foreground">{selectedCase.customerPhone}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="font-medium text-card-foreground">{selectedCase.submittedAt}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-card-foreground mb-4">Loan Milestone Tracker</h4>
                <div className="relative pl-8 space-y-4">
                  {selectedCase.milestones.map((m: any, i: number) => (
                    <div key={m.id} className="relative">
                      <div className="absolute -left-8 top-0.5">{milestoneIcon(m.status)}</div>
                      {i < selectedCase.milestones.length - 1 && (
                        <div className={`absolute -left-[22px] top-5 w-0.5 h-8 ${m.status === 'Completed' ? 'bg-green-300' : 'bg-border'}`} />
                      )}
                      <div className={`p-3 rounded-lg ${m.status === 'In Progress' ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800' : m.status === 'Completed' ? 'bg-green-50/50 dark:bg-green-950/10' : 'bg-muted/30'}`}>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${m.status === 'Completed' ? 'text-green-700 dark:text-green-400' : 'text-card-foreground'}`}>{m.stage}</p>
                          {m.completedDate && <span className="text-xs text-muted-foreground">{m.completedDate}</span>}
                        </div>
                        {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                        {m.status !== 'Completed' && (
                          <div className="flex items-center gap-2 mt-2">
                            {m.status === 'Pending' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleMilestoneUpdate(selectedCase.id, m.stage, 'In Progress')}>
                                Start
                              </Button>
                            )}
                            {m.status === 'In Progress' && (
                              <>
                                <Input className="h-7 text-xs" placeholder="Notes..." value={milestoneNotes} onChange={(e) => setMilestoneNotes(e.target.value)} />
                                <Button size="sm" className="h-7 text-xs" onClick={() => handleMilestoneUpdate(selectedCase.id, m.stage, 'Completed')}>
                                  Complete
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BankLoanCases;
