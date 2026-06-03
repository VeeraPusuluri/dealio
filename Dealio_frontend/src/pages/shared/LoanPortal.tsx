import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLoanThreadStore, LoanThreadStatus, loanThreadStatusColors, LoanThreadEvent, LoanThread } from '@/stores/useLoanThreadStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatCurrency, formatDate } from '@/lib/format';
import { projects } from '@/data/projects';
import { toast } from 'sonner';
import DatePickerField from '@/components/shared/DatePickerField';
import {
  Building2, User, CreditCard, FileText, MessageSquare, ChevronRight, X,
  Upload, Plus, Clock, CheckCircle2, AlertCircle, Send, ArrowLeft
} from 'lucide-react';

const statusSteps: LoanThreadStatus[] = ['Applied', 'Documents Submitted', 'Under Review', 'Sanctioned', 'Disbursed'];

const roleIcon = (role: string) => {
  switch (role) {
    case 'builder': return '🏗️';
    case 'cp': return '👤';
    case 'customer': return '📋';
    case 'bank': return '🏦';
    default: return '📌';
  }
};

const eventTypeIcon = (type: string) => {
  switch (type) {
    case 'property': return '🏗️';
    case 'cp_joined': return '👤';
    case 'customer_profile': return '📋';
    case 'loan_initiated': return '🏦';
    case 'document': return '📄';
    case 'status_update': return '✅';
    case 'note': return '💬';
    default: return '📌';
  }
};

const LoanPortal = () => {
  const { threads, addThread, updateStatus, addEvent, uploadDocument } = useLoanThreadStore();
  const { user } = useAuthStore();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [addUpdateType, setAddUpdateType] = useState<string>('note');
  const [noteText, setNoteText] = useState('');

  // Create form state
  const [newThread, setNewThread] = useState({
    projectId: '', tower: '', unit: '', floor: 1, unitType: '3BHK', carpetArea: 0, saleValue: 0, bookingAmount: 0, possessionDate: '',
    customerName: '', customerDob: '', panNumber: '', aadhaarLast4: '', customerPhone: '', customerEmail: '',
    employmentType: 'Salaried' as 'Salaried' | 'Self-Employed' | 'Business Owner' | 'Retired' | 'NRI', company: '', monthlyIncome: 0, experience: 0, existingEmis: 0, cibilScore: 0,
    bank: 'HDFC', loanAmount: 0, tenure: 20, loanType: 'Home Purchase' as 'Home Purchase' | 'Construction' | 'Plot + Construction' | 'Balance Transfer',
  });

  const filteredThreads = threads.filter(t => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (searchTerm && !t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) && !t.projectName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const activeThread = threads.find(t => t.id === selectedThread);
  const canCreate = user?.role === 'builder' || user?.role === 'cp' || user?.role === 'admin';
  const canUpdateStatus = user?.role === 'bank' || user?.role === 'admin';

  const handleSubmitThread = () => {
    const project = projects.find(p => p.id === newThread.projectId);
    const rate = newThread.bank === 'HDFC' ? 8.65 : newThread.bank === 'SBI' ? 8.25 : 8.9;
    const monthlyRate = rate / 1200;
    const months = newThread.tenure * 12;
    const emi = Math.round(newThread.loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)));

    const thread: LoanThread = {
      id: `LT${Date.now()}`,
      projectId: newThread.projectId, projectName: project?.name || '', tower: newThread.tower, unit: newThread.unit,
      floor: newThread.floor, unitType: newThread.unitType, carpetArea: newThread.carpetArea,
      saleValue: newThread.saleValue, bookingAmount: newThread.bookingAmount, possessionDate: newThread.possessionDate,
      customerId: `C${Date.now()}`, customerName: newThread.customerName, customerPhone: newThread.customerPhone,
      customerEmail: newThread.customerEmail, customerDob: newThread.customerDob, panNumber: newThread.panNumber,
      aadhaarLast4: newThread.aadhaarLast4, employmentType: newThread.employmentType, company: newThread.company,
      monthlyIncome: newThread.monthlyIncome, experience: newThread.experience, existingEmis: newThread.existingEmis,
      cibilScore: newThread.cibilScore,
      cpId: user?.role === 'cp' ? user.id : undefined, cpName: user?.role === 'cp' ? user.name : undefined,
      builderId: user?.role === 'builder' ? user.id : undefined, builderName: user?.role === 'builder' ? user.name : undefined,
      bank: newThread.bank, loanAmount: newThread.loanAmount, tenure: newThread.tenure,
      loanType: newThread.loanType, interestRate: rate, emi,
      status: 'Applied', createdBy: user?.name || '', createdByRole: user?.role || '', createdAt: new Date().toISOString().split('T')[0],
      unreadUpdates: 0,
      documents: getDocumentsForType(newThread.employmentType),
      events: [
        { id: `LE${Date.now()}`, type: 'loan_initiated', sender: 'System', senderRole: 'system', content: `Loan application initiated — ${newThread.bank}, ${formatCurrency(newThread.loanAmount)}`, timestamp: new Date().toISOString() },
      ],
    };
    addThread(thread);
    setShowCreateForm(false);
    setCreateStep(1);
    toast.success('Loan application created! Thread is now live.');
  };

  const handleAddNote = () => {
    if (!activeThread || !noteText.trim()) return;
    const event: LoanThreadEvent = {
      id: `LE${Date.now()}`,
      type: addUpdateType as any,
      sender: user?.name || '',
      senderRole: user?.role as any || 'system',
      content: noteText,
      timestamp: new Date().toISOString(),
    };
    addEvent(activeThread.id, event);
    setNoteText('');
    toast.success('Update added to thread');
  };

  const handleStatusUpdate = (newStatus: LoanThreadStatus) => {
    if (!activeThread) return;
    updateStatus(activeThread.id, newStatus, undefined, user?.name);
    toast.success(`Status updated to ${newStatus}. Customer notified.`);
  };

  if (showCreateForm) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <button onClick={() => { setShowCreateForm(false); setCreateStep(1); }} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
            <ArrowLeft size={16} /> Back to Loans
          </button>
          <div className="bg-card rounded-lg card-shadow border border-border p-6">
            <h2 className="text-lg font-bold text-card-foreground mb-1">Create New Loan Application</h2>
            <p className="text-sm text-muted-foreground mb-6">Step {createStep} of 4</p>
            {/* Progress bar */}
            <div className="flex gap-1 mb-8">
              {[1,2,3,4].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= createStep ? 'bg-secondary' : 'bg-muted'}`} />
              ))}
            </div>

            {createStep === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-card-foreground">Property Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Project <span className="text-destructive">*</span></label>
                    <select value={newThread.projectId} onChange={e => setNewThread({...newThread, projectId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Tower / Block <span className="text-destructive">*</span></label>
                    <input value={newThread.tower} onChange={e => setNewThread({...newThread, tower: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" placeholder="e.g. C" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Unit Number <span className="text-destructive">*</span></label>
                    <input value={newThread.unit} onChange={e => setNewThread({...newThread, unit: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" placeholder="e.g. 1204" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Floor</label>
                    <input type="number" value={newThread.floor} onChange={e => setNewThread({...newThread, floor: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Unit Type <span className="text-destructive">*</span></label>
                    <select value={newThread.unitType} onChange={e => setNewThread({...newThread, unitType: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">
                      {['1BHK','2BHK','3BHK','4BHK','5BHK','Villa','Penthouse'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Carpet Area (sqft)</label>
                    <input type="number" value={newThread.carpetArea || ''} onChange={e => setNewThread({...newThread, carpetArea: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Total Sale Value (₹) <span className="text-destructive">*</span></label>
                    <input type="number" value={newThread.saleValue || ''} onChange={e => setNewThread({...newThread, saleValue: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Booking Amount (₹)</label>
                    <input type="number" value={newThread.bookingAmount || ''} onChange={e => setNewThread({...newThread, bookingAmount: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                </div>
              </div>
            )}

            {createStep === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-card-foreground">Customer Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Full Name <span className="text-destructive">*</span></label>
                    <input value={newThread.customerName} onChange={e => setNewThread({...newThread, customerName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Date of Birth <span className="text-destructive">*</span></label>
                    <DatePickerField value={newThread.customerDob}
                      onChange={v => setNewThread({...newThread, customerDob: v})}
                      toYear={new Date().getFullYear()} fromYear={1940} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">PAN Number <span className="text-destructive">*</span></label>
                    <input value={newThread.panNumber} onChange={e => setNewThread({...newThread, panNumber: e.target.value.toUpperCase()})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" placeholder="ABCDE1234F" maxLength={10} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Aadhaar (Last 4)</label>
                    <input value={newThread.aadhaarLast4} onChange={e => setNewThread({...newThread, aadhaarLast4: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" placeholder="XXXX XXXX 7890" maxLength={4} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Mobile <span className="text-destructive">*</span></label>
                    <div className="flex">
                      <span className="px-3 py-2 rounded-l-lg border border-r-0 border-input bg-muted text-sm text-muted-foreground">+91</span>
                      <input value={newThread.customerPhone} onChange={e => setNewThread({...newThread, customerPhone: e.target.value})} className="w-full px-3 py-2 rounded-r-lg border border-input bg-card text-sm" maxLength={10} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Email <span className="text-destructive">*</span></label>
                    <input type="email" value={newThread.customerEmail} onChange={e => setNewThread({...newThread, customerEmail: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Employment Type <span className="text-destructive">*</span></label>
                    <div className="flex flex-wrap gap-2">
                      {(['Salaried', 'Self-Employed', 'Business Owner', 'Retired', 'NRI'] as const).map(t => (
                        <button key={t} onClick={() => setNewThread({...newThread, employmentType: t})}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${newThread.employmentType === t ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Company <span className="text-destructive">*</span></label>
                    <input value={newThread.company} onChange={e => setNewThread({...newThread, company: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Monthly Income (₹) <span className="text-destructive">*</span></label>
                    <input type="number" value={newThread.monthlyIncome || ''} onChange={e => setNewThread({...newThread, monthlyIncome: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">CIBIL Score</label>
                    <input type="number" value={newThread.cibilScore || ''} onChange={e => setNewThread({...newThread, cibilScore: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" placeholder="300-900" min={300} max={900} />
                  </div>
                </div>
              </div>
            )}

            {createStep === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-card-foreground">Bank & Loan Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Select Bank <span className="text-destructive">*</span></label>
                    <select value={newThread.bank} onChange={e => setNewThread({...newThread, bank: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm">
                      {['HDFC','SBI','ICICI','Axis','Kotak','PNB','BoB','Other'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Loan Amount (₹) <span className="text-destructive">*</span></label>
                    <input type="number" value={newThread.loanAmount || ''} onChange={e => setNewThread({...newThread, loanAmount: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1 block">Preferred Tenure: {newThread.tenure} years</label>
                    <input type="range" min={5} max={30} value={newThread.tenure} onChange={e => setNewThread({...newThread, tenure: parseInt(e.target.value)})} className="w-full accent-secondary" />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>5 years</span><span>30 years</span></div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1 block">Loan Type <span className="text-destructive">*</span></label>
                    <div className="flex flex-wrap gap-2">
                      {(['Home Purchase', 'Construction', 'Plot + Construction', 'Balance Transfer'] as const).map(t => (
                        <button key={t} onClick={() => setNewThread({...newThread, loanType: t})}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${newThread.loanType === t ? 'border-secondary bg-secondary/10 text-secondary' : 'border-input text-muted-foreground'}`}>{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
                {newThread.loanAmount > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium text-foreground">Estimated EMI</p>
                    <p className="text-2xl font-bold text-secondary mt-1">
                      {formatCurrency(Math.round(newThread.loanAmount * (8.5/1200) / (1 - Math.pow(1 + 8.5/1200, -(newThread.tenure*12)))))}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">*Indicative at ~8.5% p.a.</p>
                  </div>
                )}
              </div>
            )}

            {createStep === 4 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-card-foreground">Document Checklist</h3>
                <p className="text-xs text-muted-foreground">Upload documents or submit later. Required docs must be uploaded before bank submission.</p>
                {getDocumentsForType(newThread.employmentType).map((doc, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{doc.name}</span>
                      {doc.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">Required</span>}
                    </div>
                    <button className="px-3 py-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80">
                      <Upload size={12} className="inline mr-1" /> Upload
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-8">
              {createStep > 1 ? (
                <button onClick={() => setCreateStep(createStep - 1)} className="px-4 py-2 rounded-lg text-sm font-medium border border-input text-foreground">Previous</button>
              ) : <div />}
              {createStep < 4 ? (
                <button onClick={() => setCreateStep(createStep + 1)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground">Next</button>
              ) : (
                <button onClick={handleSubmitThread} className="px-6 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground">Submit Application</button>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Thread detail view
  if (activeThread) {
    return (
      <DashboardLayout>
        <div>
          <button onClick={() => setSelectedThread(null)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
            <ArrowLeft size={16} /> Back to Loans
          </button>
          <div className="flex gap-6">
            {/* Left panel — Timeline */}
            <div className="flex-1 min-w-0">
              <div className="bg-card rounded-lg card-shadow border border-border p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-card-foreground">{activeThread.customerName}</h2>
                    <p className="text-sm text-muted-foreground">{activeThread.projectName} — Tower {activeThread.tower}, Unit {activeThread.unit}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: loanThreadStatusColors[activeThread.status] }}>{activeThread.status}</span>
                </div>
                {/* Status Stepper */}
                <div className="flex items-center gap-1 mb-4">
                  {statusSteps.map((step, i) => {
                    const currentIdx = statusSteps.indexOf(activeThread.status);
                    const isDone = i <= currentIdx;
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isDone ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {isDone ? <CheckCircle2 size={14} /> : i + 1}
                        </div>
                        {i < statusSteps.length - 1 && <div className={`h-0.5 flex-1 ${i < currentIdx ? 'bg-secondary' : 'bg-muted'}`} />}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1 text-[10px] text-muted-foreground">
                  {statusSteps.map(s => <span key={s} className="flex-1 text-center">{s}</span>)}
                </div>
              </div>

              {/* Thread Timeline */}
              <div className="bg-card rounded-lg card-shadow border border-border p-5">
                <h3 className="font-semibold text-card-foreground mb-4">Thread Timeline</h3>
                <div className="space-y-4">
                  {activeThread.events.map(event => (
                    <div key={event.id} className="flex gap-3">
                      <div className="text-lg mt-0.5">{eventTypeIcon(event.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-card-foreground">{event.sender}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{event.senderRole}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{new Date(event.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Update */}
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex gap-2 mb-2">
                    <select value={addUpdateType} onChange={e => setAddUpdateType(e.target.value)} className="px-2 py-1.5 rounded border border-input bg-card text-xs">
                      <option value="note">Add Note</option>
                      <option value="document">Upload Document</option>
                    </select>
                    {canUpdateStatus && (
                      <select onChange={e => { if (e.target.value) handleStatusUpdate(e.target.value as LoanThreadStatus); e.target.value = ''; }} className="px-2 py-1.5 rounded border border-input bg-card text-xs">
                        <option value="">Update Status...</option>
                        {statusSteps.filter(s => s !== activeThread.status).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Type your update..." className="flex-1 px-3 py-2 rounded-lg border border-input bg-card text-sm" onKeyDown={e => e.key === 'Enter' && handleAddNote()} />
                    <button onClick={handleAddNote} className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground"><Send size={16} /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right panel — Deal Summary */}
            <div className="w-80 flex-shrink-0 space-y-4">
              <div className="bg-card rounded-lg card-shadow border border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Property Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span className="font-medium text-card-foreground">{activeThread.projectName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tower / Unit</span><span className="font-medium text-card-foreground">{activeThread.tower}-{activeThread.unit}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium text-card-foreground">{activeThread.unitType}</span></div>
                  {activeThread.carpetArea && <div className="flex justify-between"><span className="text-muted-foreground">Area</span><span className="font-medium text-card-foreground">{activeThread.carpetArea} sqft</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Sale Value</span><span className="font-medium text-card-foreground">{formatCurrency(activeThread.saleValue)}</span></div>
                </div>
              </div>

              {activeThread.cpName && (
                <div className="bg-card rounded-lg card-shadow border border-border p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">CP Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium text-card-foreground">{activeThread.cpName}</span></div>
                    {activeThread.cpTier && <div className="flex justify-between"><span className="text-muted-foreground">Tier</span><span className="font-medium text-card-foreground">{activeThread.cpTier}</span></div>}
                    {activeThread.cpCommission && <div className="flex justify-between"><span className="text-muted-foreground">Commission</span><span className="font-medium text-card-foreground">{activeThread.cpCommission}%</span></div>}
                  </div>
                </div>
              )}

              <div className="bg-card rounded-lg card-shadow border border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Customer</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium text-card-foreground">{activeThread.customerName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium text-card-foreground">{activeThread.customerPhone}</span></div>
                  {activeThread.employmentType && <div className="flex justify-between"><span className="text-muted-foreground">Employment</span><span className="font-medium text-card-foreground">{activeThread.employmentType}</span></div>}
                  {activeThread.monthlyIncome && <div className="flex justify-between"><span className="text-muted-foreground">Income</span><span className="font-medium text-card-foreground">{formatCurrency(activeThread.monthlyIncome)}/mo</span></div>}
                </div>
              </div>

              <div className="bg-card rounded-lg card-shadow border border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Loan Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-medium text-card-foreground">{activeThread.bank}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium text-card-foreground">{formatCurrency(activeThread.loanAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tenure</span><span className="font-medium text-card-foreground">{activeThread.tenure} years</span></div>
                  {activeThread.interestRate && <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium text-card-foreground">{activeThread.interestRate}%</span></div>}
                  {activeThread.emi && <div className="flex justify-between"><span className="text-muted-foreground">EMI</span><span className="font-medium text-secondary font-bold">{formatCurrency(activeThread.emi)}</span></div>}
                  {activeThread.officerName && <div className="flex justify-between"><span className="text-muted-foreground">Officer</span><span className="font-medium text-card-foreground">{activeThread.officerName}</span></div>}
                </div>
              </div>

              {/* Documents Summary */}
              <div className="bg-card rounded-lg card-shadow border border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Documents</h4>
                <div className="space-y-1.5">
                  {activeThread.documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {doc.uploaded ? <CheckCircle2 size={12} className="text-secondary" /> : <AlertCircle size={12} className="text-destructive" />}
                      <span className={doc.uploaded ? 'text-card-foreground' : 'text-muted-foreground'}>{doc.name}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {activeThread.documents.filter(d => d.uploaded).length} of {activeThread.documents.length} uploaded
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // List view
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-foreground">Loan Applications</h2>
          <div className="flex items-center gap-3">
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search customer or project..." className="px-3 py-2 rounded-lg border border-input bg-card text-sm w-60" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-card text-sm">
              <option value="All">All Status</option>
              {statusSteps.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {canCreate && (
              <button onClick={() => setShowCreateForm(true)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-secondary text-secondary-foreground flex items-center gap-1.5">
                <Plus size={16} /> New Loan Application
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          {filteredThreads.map(thread => (
            <div key={thread.id} onClick={() => setSelectedThread(thread.id)} className="bg-card rounded-lg card-shadow border border-border p-4 cursor-pointer hover:border-secondary/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-sm flex-shrink-0">
                  {thread.customerName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-card-foreground">{thread.customerName}</span>
                    {thread.unreadUpdates > 0 && <span className="w-2 h-2 rounded-full bg-destructive" />}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ml-auto" style={{ backgroundColor: loanThreadStatusColors[thread.status] }}>{thread.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{thread.projectName} — Tower {thread.tower}, Unit {thread.unit}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-card-foreground">{formatCurrency(thread.loanAmount)}</span>
                    <span>•</span>
                    <span>{thread.bank}</span>
                    <span>•</span>
                    <span>{Math.ceil((Date.now() - new Date(thread.createdAt).getTime()) / 86400000)} days ago</span>
                    {thread.cpName && <><span>•</span><span>via {thread.cpName}</span></>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

function getDocumentsForType(empType: string) {
  const kyc = [
    { name: 'Aadhaar Card', uploaded: false, required: true, category: 'KYC' },
    { name: 'PAN Card', uploaded: false, required: true, category: 'KYC' },
    { name: 'Passport-size Photographs', uploaded: false, required: true, category: 'KYC' },
    { name: 'Additional ID Proof', uploaded: false, required: true, category: 'KYC' },
  ];
  const property = [
    { name: 'Allotment Letter', uploaded: false, required: true, category: 'Property' },
    { name: 'Builder-Buyer Agreement', uploaded: false, required: true, category: 'Property' },
    { name: 'NOC from Builder', uploaded: false, required: true, category: 'Property' },
    { name: 'RERA Certificate', uploaded: false, required: true, category: 'Property' },
    { name: 'Approved Floor Plan', uploaded: false, required: true, category: 'Property' },
    { name: 'Encumbrance Certificate', uploaded: false, required: true, category: 'Property' },
    { name: 'Title Deed / Sale Deed', uploaded: false, required: true, category: 'Property' },
  ];

  if (empType === 'Self-Employed' || empType === 'Business Owner') {
    return [
      ...kyc,
      { name: 'ITR with computation (3 years)', uploaded: false, required: true, category: 'Income' },
      { name: 'Balance Sheet & P&L (3 years)', uploaded: false, required: true, category: 'Income' },
      { name: 'Current Account Statement (6 months)', uploaded: false, required: true, category: 'Income' },
      { name: 'Savings Account Statement (6 months)', uploaded: false, required: true, category: 'Income' },
      { name: 'GST Certificate / Business Registration', uploaded: false, required: true, category: 'Income' },
      { name: 'Business Address Proof', uploaded: false, required: true, category: 'Income' },
      ...property,
    ];
  }
  return [
    ...kyc,
    { name: 'Salary Slips (3 months)', uploaded: false, required: true, category: 'Income' },
    { name: 'Bank Statement (6 months)', uploaded: false, required: true, category: 'Income' },
    { name: 'Form 16 (2 years)', uploaded: false, required: true, category: 'Income' },
    { name: 'ITR (2 years)', uploaded: false, required: true, category: 'Income' },
    ...property,
  ];
}

export default LoanPortal;
