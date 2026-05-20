import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDealStore } from '@/stores/useDealStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatCurrency } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, FileText, Upload, Clock, User, Building2, Landmark, Globe } from 'lucide-react';
import { toast } from 'sonner';

const DealConversation = () => {
  const { user } = useAuthStore();
  const { deals, addDealMessage, addDealDocument } = useDealStore();
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState('KYC');
  const [showUpload, setShowUpload] = useState(false);

  if (!user) return null;

  // Filter deals by user role
  const myDeals = deals.filter((d) => {
    if (user.role === 'builder') return d.builderId === user.id;
    if (user.role === 'cp') return d.cpId === user.id;
    if (user.role === 'customer') return d.customerId === user.id;
    if (user.role === 'bank') return d.loanCaseId;
    if (user.role === 'nri') return d.isNRI && d.customerId === user.id;
    return false;
  });

  const roleColor = (role: string) => {
    switch (role) {
      case 'builder': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
      case 'cp': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'customer': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'bank': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'nri': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case 'builder': return <Building2 size={12} />;
      case 'cp': return <User size={12} />;
      case 'customer': return <User size={12} />;
      case 'bank': return <Landmark size={12} />;
      case 'nri': return <Globe size={12} />;
      default: return <User size={12} />;
    }
  };

  const handleSend = () => {
    if (!msg.trim() || !selectedDeal) return;
    addDealMessage(selectedDeal.id, {
      dealId: selectedDeal.id,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role as any,
      message: msg,
    });
    setMsg('');
    toast.success('Message sent');
  };

  const handleUploadDoc = () => {
    if (!docName || !selectedDeal) return;
    addDealDocument(selectedDeal.id, {
      dealId: selectedDeal.id,
      name: docName,
      category: docCategory as any,
      uploadedBy: user.id,
      uploadedByRole: user.role,
      sharedWith: [],
    });
    setDocName('');
    setShowUpload(false);
    toast.success('Document uploaded');
  };

  // Allowed doc categories by role
  const allowedCategories = () => {
    if (user.role === 'customer' || user.role === 'nri') return ['KYC'];
    if (user.role === 'builder') return ['Agreement', 'NOC', 'Other'];
    if (user.role === 'bank') return ['Sanction', 'Disbursement', 'Other'];
    return ['Other'];
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Deal List */}
        <div className="w-80 flex-shrink-0 bg-card rounded-lg card-shadow border border-border overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-card-foreground">Deal Conversations</h3>
            <p className="text-xs text-muted-foreground">{myDeals.length} deals</p>
          </div>
          {myDeals.map((d) => {
            const unread = d.messages.filter((m) => m.senderId !== user.id).length;
            return (
              <button key={d.id} onClick={() => setSelectedDeal(d)}
                className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors ${selectedDeal?.id === d.id ? 'bg-primary/5' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm text-card-foreground truncate">{d.customerName}</p>
                  {unread > 0 && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{unread}</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{d.projectName} · {d.status}</p>
              </button>
            );
          })}
        </div>

        {/* Conversation Area */}
        <div className="flex-1 bg-card rounded-lg card-shadow border border-border flex flex-col">
          {selectedDeal ? (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-card-foreground">{selectedDeal.customerName}</h3>
                  <p className="text-xs text-muted-foreground">{selectedDeal.projectName} · {selectedDeal.unitType}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}>
                    <Upload size={14} className="mr-1" />Upload Doc
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="messages" className="flex-1 flex flex-col">
                <TabsList className="mx-4 mt-2">
                  <TabsTrigger value="messages">Messages</TabsTrigger>
                  <TabsTrigger value="documents">Documents ({selectedDeal.documents.length})</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="flex-1 flex flex-col px-4 pb-4">
                  <div className="flex-1 overflow-y-auto space-y-3 py-4">
                    {selectedDeal.messages.map((m: any) => (
                      <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-lg ${m.senderId === user.id ? 'bg-primary/10' : 'bg-muted/50'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${roleColor(m.senderRole)}`}>
                              {roleIcon(m.senderRole)} {m.senderRole}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-sm text-card-foreground">{m.message}</p>
                        </div>
                      </div>
                    ))}
                    {selectedDeal.messages.length === 0 && <p className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</p>}
                  </div>
                  <div className="flex gap-2">
                    <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === 'Enter' && handleSend()} />
                    <Button onClick={handleSend}>Send</Button>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                  {selectedDeal.documents.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-card-foreground">{d.name}</p>
                          <p className="text-[10px] text-muted-foreground">{d.category} · {d.uploadedByRole} · {d.uploadedAt}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Download</Button>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="timeline" className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="relative pl-6 space-y-4">
                    {selectedDeal.activities.map((a: any) => (
                      <div key={a.id} className="relative">
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                        <p className="text-sm font-medium text-card-foreground">{a.action}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${roleColor(a.actorRole)}`}>{a.actorRole}</span>
                          <span className="text-xs text-muted-foreground">{a.actorName} · {new Date(a.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                <p>Select a deal to view the conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={docCategory} onValueChange={setDocCategory}>
              <SelectTrigger><SelectValue placeholder="Document Category" /></SelectTrigger>
              <SelectContent>
                {allowedCategories().map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Document name (e.g. Aadhaar Card)" />
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
              <Upload size={24} className="mx-auto mb-2" />
              <p className="text-sm">Drag & drop or click to select file</p>
              <p className="text-xs">PDF, JPG, PNG (max 10MB)</p>
              <input type="file" className="hidden" />
            </div>
            <Button className="w-full" onClick={handleUploadDoc}>Upload & Submit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DealConversation;
