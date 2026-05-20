import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDealStore } from '@/stores/useDealStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Handshake, CreditCard, MessageSquare, FileText, Clock, User, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DealDetail = ({ deal, onClose }: { deal: any; onClose: () => void }) => {
  const { setDealCommission, addDealMessage, addDealDocument, addDealActivity, updateDealStatus, createLoanCase } = useDealStore();
  const [tab, setTab] = useState('timeline');
  const [msg, setMsg] = useState('');
  const [commType, setCommType] = useState<'fixed' | 'percent'>(deal.commissionType || 'percent');
  const [commValue, setCommValue] = useState(deal.commissionValue?.toString() || '');
  const [commStatus, setCommStatus] = useState<'Pending' | 'Approved' | 'Paid'>(deal.commissionStatus || 'Pending');
  const [loanForm, setLoanForm] = useState({ loanAmount: '', propertyValue: '', employmentType: 'Salaried' });

  const handleSendMessage = () => {
    if (!msg.trim()) return;
    addDealMessage(deal.id, { dealId: deal.id, senderId: 'B001', senderName: 'Prestige Group', senderRole: 'builder', message: msg });
    addDealActivity(deal.id, { dealId: deal.id, actorId: 'B001', actorName: 'Prestige Group', actorRole: 'builder', action: 'Sent message', targetType: 'message' });
    setMsg('');
    toast.success('Message sent');
  };

  const handleSetCommission = () => {
    setDealCommission(deal.id, commType, parseFloat(commValue), commStatus);
    addDealActivity(deal.id, { dealId: deal.id, actorId: 'B001', actorName: 'Prestige Group', actorRole: 'builder', action: `Set commission ${commType === 'percent' ? commValue + '%' : '₹' + commValue}`, targetType: 'commission' });
    toast.success('Commission updated');
  };

  const handleConvertToLoan = () => {
    createLoanCase({
      dealId: deal.id, customerId: deal.customerId, customerName: deal.customerName,
      customerPhone: deal.customerPhone, customerEmail: deal.customerEmail,
      projectId: deal.projectId, projectName: deal.projectName, unitType: deal.unitType,
      loanAmount: parseInt(loanForm.loanAmount) || deal.dealValue * 0.8,
      propertyValue: parseInt(loanForm.propertyValue) || deal.dealValue,
      employmentType: loanForm.employmentType,
      builderId: deal.builderId, builderName: deal.builderName,
      isNRI: deal.isNRI,
    });
    toast.success('Loan case created and sent to bank');
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'builder': return 'bg-teal-100 text-teal-800';
      case 'cp': return 'bg-orange-100 text-orange-800';
      case 'customer': return 'bg-green-100 text-green-800';
      case 'bank': return 'bg-blue-100 text-blue-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-card-foreground">{deal.customerName} {deal.isNRI && <Badge variant="outline" className="ml-2">NRI</Badge>}</h3>
          <p className="text-sm text-muted-foreground">{deal.projectName} · {deal.unitType} {deal.unitId && `· ${deal.unitId}`}</p>
        </div>
        <Badge className="bg-primary/10 text-primary">{deal.status}</Badge>
      </div>

      {deal.dealValue && <p className="text-lg font-bold text-card-foreground">{formatCurrency(deal.dealValue)}</p>}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
          <TabsTrigger value="messages" className="flex-1">Messages ({deal.messages.length})</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1">Documents ({deal.documents.length})</TabsTrigger>
          <TabsTrigger value="commission" className="flex-1">Commission</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <div className="relative pl-6 space-y-4">
            {deal.activities.map((a: any) => (
              <div key={a.id} className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                <div>
                  <p className="text-sm font-medium text-card-foreground">{a.action}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${roleColor(a.actorRole)}`}>{a.actorRole}</span>
                    <span className="text-xs text-muted-foreground">{a.actorName}</span>
                    <span className="text-xs text-muted-foreground">· {new Date(a.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-4 space-y-3">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {deal.messages.map((m: any) => (
              <div key={m.id} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${roleColor(m.senderRole)}`}>{m.senderRole}</span>
                  <span className="text-xs font-medium text-card-foreground">{m.senderName}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{new Date(m.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-card-foreground">{m.message}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
            <Button size="sm" onClick={handleSendMessage}>Send</Button>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="space-y-2">
            {deal.documents.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{d.name}</p>
                    <p className="text-[10px] text-muted-foreground">{d.category} · by {d.uploadedByRole} · {d.uploadedAt}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Download</Button>
              </div>
            ))}
            {deal.documents.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No documents yet</p>}
          </div>
        </TabsContent>

        <TabsContent value="commission" className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={commType} onValueChange={(v) => setCommType(v as 'fixed' | 'percent')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Value</label>
              <Input type="number" value={commValue} onChange={(e) => setCommValue(e.target.value)} placeholder={commType === 'percent' ? '2.5' : '250000'} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={commStatus} onValueChange={(v) => setCommStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSetCommission} size="sm">Update Commission</Button>
        </TabsContent>
      </Tabs>

      {deal.status === 'Interested - Loan Required' && !deal.loanCaseId && (
        <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/30">
          <h4 className="font-semibold text-card-foreground mb-3 flex items-center gap-2"><CreditCard size={16} />Convert to Loan</h4>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Input placeholder="Loan Amount" value={loanForm.loanAmount} onChange={(e) => setLoanForm({ ...loanForm, loanAmount: e.target.value })} />
            <Input placeholder="Property Value" value={loanForm.propertyValue} onChange={(e) => setLoanForm({ ...loanForm, propertyValue: e.target.value })} />
            <Select value={loanForm.employmentType} onValueChange={(v) => setLoanForm({ ...loanForm, employmentType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Salaried">Salaried</SelectItem>
                <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                <SelectItem value="Salaried (Overseas)">Salaried (Overseas)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleConvertToLoan}>Create Loan Case</Button>
        </div>
      )}
    </div>
  );
};

const BuilderDeals = () => {
  const { deals, fetchDeals, loading } = useDealStore();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState('all');
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        let bid = builderApi.getCachedBuilderId();
        if (!bid) {
          const email = user.email || `uid${user.id}@dealio.builder`;
          const b = await builderApi.ensureBuilder(user.name, email, user.phone, user.id) as { builderId: number };
          bid = String(b.builderId);
          builderApi.setCachedBuilderId(bid);
        }
        fetchDeals(bid);
      } catch { /* show empty state */ }
    })();
  }, [user?.id]);

  const filtered = filter === 'all' ? deals : deals.filter((d) => d.status === filter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="la-banner px-5 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Deal Management</h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-52 rounded-xl border-slate-200 shadow-sm"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Deals</SelectItem>
              <SelectItem value="Meeting Completed">Meeting Completed</SelectItem>
              <SelectItem value="Negotiation">Negotiation</SelectItem>
              <SelectItem value="Interested - Loan Required">Loan Required</SelectItem>
              <SelectItem value="Booked">Booked</SelectItem>
              <SelectItem value="Loan Sanctioned">Loan Sanctioned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-teal-500" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="la-card p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <Handshake size={26} className="text-teal-400" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No deals found</p>
            <p className="text-sm text-slate-400">
              {filter === 'all' ? 'Deals will appear here once customers book or negotiate.' : `No deals with status "${filter}".`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((deal) => (
              <div key={deal.id} className="bg-white rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all duration-150" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }} onClick={() => setSelectedDeal(deal)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      {deal.customerName}
                      {deal.isNRI && <Badge variant="outline" className="text-[10px] border-teal-200 text-teal-700">NRI</Badge>}
                    </h3>
                    <p className="text-sm text-slate-400">{deal.projectName} · {deal.unitType} · CP: {deal.cpName}</p>
                  </div>
                  <Badge className="bg-teal-50 text-teal-700 border-0">{deal.status}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  {deal.dealValue && <span className="font-semibold text-teal-600">{formatCurrency(deal.dealValue)}</span>}
                  {(deal.messages?.length ?? 0) > 0 && <span>{deal.messages.length} messages</span>}
                  {(deal.documents?.length ?? 0) > 0 && <span>{deal.documents.length} documents</span>}
                  {deal.commissionStatus && <span>Commission: {deal.commissionStatus}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedDeal && <DealDetail deal={selectedDeal} onClose={() => setSelectedDeal(null)} />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default BuilderDeals;
