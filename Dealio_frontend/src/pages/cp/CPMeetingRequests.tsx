import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useDealStore } from '@/stores/useDealStore';
import { projects } from '@/data/projects';
import { formatCurrency } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Share2, Phone, MessageSquare, Calendar, MapPin, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = ['Select City', 'Select Project', 'Customer Details'] as const;

const CPMeetingRequests = () => {
  const { meetingRequests, createMeetingRequest, shareEvents, addShareEvent } = useDealStore();
  const cpMeetings = meetingRequests.filter((m) => m.cpId === 'CP001');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [shareContact, setShareContact] = useState('');
  const [step, setStep] = useState(1);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [form, setForm] = useState({
    customerName: '', customerPhone: '',
    preferredDate: '', preferredTime: '', notes: '',
  });

  const cities = useMemo(() => [...new Set(projects.map((p) => p.city))].sort(), []);
  const cityProjects = useMemo(
    () => projects.filter((p) => p.city === selectedCity),
    [selectedCity],
  );

  const openForm = (projectId?: string) => {
    setStep(projectId ? 3 : 1);
    setSelectedCity(projectId ? (projects.find((p) => p.id === projectId)?.city ?? '') : '');
    setSelectedProjectId(projectId ?? '');
    setForm({ customerName: '', customerPhone: '', preferredDate: '', preferredTime: '', notes: '' });
    setShowRequestForm(true);
  };

  const closeForm = () => {
    setShowRequestForm(false);
    setStep(1);
    setSelectedCity('');
    setSelectedProjectId('');
  };

  const handleSubmitRequest = () => {
    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project || !form.customerName || !form.customerPhone) {
      toast.error('Please fill all required fields');
      return;
    }
    createMeetingRequest({
      cpId: 'CP001', cpName: 'Ravi Kumar', builderId: 'B001', builderName: project.builder,
      projectId: selectedProjectId, projectName: project.name,
      customerName: form.customerName, customerPhone: form.customerPhone,
      preferredDate: form.preferredDate, preferredTime: form.preferredTime, notes: form.notes,
    });
    toast.success('Meeting request sent to builder');
    closeForm();
  };

  const handleWhatsAppShare = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const trackingLink = `https://dealio.app/p/${projectId}?utm_source=cp&utm_cp_id=CP001`;
    const message = `Hi! I'd like to share this property with you: ${project.name} in ${project.location}. ${project.bhkTypes.join('/')} starting ${formatCurrency(project.priceRange[0])}. ${trackingLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    addShareEvent({ cpId: 'CP001', projectId, projectName: project.name, sharedWith: shareContact || 'Unknown', sharedVia: 'WhatsApp' });
    toast.success('Shared via WhatsApp');
    setShowShareModal(null);
    setShareContact('');
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'Pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'Confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Follow-up Required': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-card-foreground">Meeting Requests & Project Sharing</h2>
          <Button onClick={() => openForm()}>
            <Calendar size={16} className="mr-2" />Request Meeting
          </Button>
        </div>

        {/* Share Events Log */}
        <div className="bg-card rounded-lg p-5 card-shadow border border-border">
          <h3 className="font-semibold text-card-foreground mb-3">Recent Shares</h3>
          <div className="space-y-2">
            {shareEvents.filter((s) => s.cpId === 'CP001').slice(0, 5).map((se) => (
              <div key={se.id} className="flex items-center gap-3 text-sm">
                <Share2 size={14} className="text-green-600" />
                <span className="text-card-foreground">{se.projectName}</span>
                <span className="text-muted-foreground">→ {se.sharedWith} via {se.sharedVia}</span>
                <span className="text-xs text-muted-foreground ml-auto">{new Date(se.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Cards with Share */}
        <div>
          <h3 className="font-semibold text-card-foreground mb-3">Published Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="bg-card rounded-lg card-shadow border border-border overflow-hidden">
                <img src={p.image} alt={p.name} className="w-full h-32 object-cover" />
                <div className="p-4">
                  <h4 className="font-semibold text-card-foreground">{p.name}</h4>
                  <p className="text-xs text-muted-foreground">{p.builder} · {p.location}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <Badge variant="outline">{p.available} units</Badge>
                    <Badge className="bg-accent/10 text-accent">{p.commissionPercent}%</Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowShareModal(p.id)}>
                      <Share2 size={12} className="mr-1" />Share
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openForm(p.id)}>
                      <Calendar size={12} className="mr-1" />Meet
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My Meeting Requests */}
        <div>
          <h3 className="font-semibold text-card-foreground mb-3">My Meeting Requests</h3>
          <div className="grid gap-3">
            {cpMeetings.map((mr) => (
              <div key={mr.id} className="bg-card rounded-lg p-4 card-shadow border border-border flex items-center justify-between">
                <div>
                  <p className="font-medium text-card-foreground">{mr.customerName} · {mr.projectName}</p>
                  <p className="text-xs text-muted-foreground">{mr.confirmedDate || mr.preferredDate} · {mr.confirmedTime || mr.preferredTime}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(mr.status)}`}>{mr.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={!!showShareModal} onOpenChange={() => setShowShareModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Share Project</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input value={shareContact} onChange={(e) => setShareContact(e.target.value)} placeholder="Customer name (for tracking)" />
            <Button className="w-full" onClick={() => showShareModal && handleWhatsAppShare(showShareModal)}>
              <MessageSquare size={16} className="mr-2" />Share via WhatsApp
            </Button>
            <Button variant="outline" className="w-full" onClick={() => {
              const project = projects.find((p) => p.id === showShareModal);
              if (project) {
                addShareEvent({ cpId: 'CP001', projectId: project.id, projectName: project.name, sharedWith: shareContact || 'Unknown', sharedVia: 'SMS' });
                toast.success('SMS template copied');
                setShowShareModal(null);
              }
            }}>
              <Phone size={16} className="mr-2" />Copy SMS Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meeting Request Form — multi-step */}
      <Dialog open={showRequestForm} onOpenChange={closeForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Meeting with Builder</DialogTitle>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 ${step > i + 1 ? 'bg-primary text-primary-foreground' : step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {i + 1}
                </div>
                <span className={`text-xs truncate ${step === i + 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{label}</span>
                {i < STEPS.length - 1 && <ChevronRight size={12} className="text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>

          {/* Step 1: City */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose the city where you want to schedule a site visit.</p>
              <div className="grid grid-cols-2 gap-3">
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => { setSelectedCity(city); setSelectedProjectId(''); }}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${selectedCity === city ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50 text-card-foreground'}`}
                  >
                    <MapPin size={14} />
                    {city}
                  </button>
                ))}
              </div>
              <Button className="w-full" disabled={!selectedCity} onClick={() => setStep(2)}>
                Next <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          )}

          {/* Step 2: Projects in selected city */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Projects available in <span className="font-semibold text-card-foreground">{selectedCity}</span>
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {cityProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No projects found in {selectedCity}.</p>
                ) : cityProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedProjectId === p.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <p className="font-medium text-sm text-card-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.builder} · {p.location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{p.bhkTypes.join(' / ')}</Badge>
                      <span className="text-xs text-muted-foreground">{formatCurrency(p.priceRange[0])}+</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft size={14} className="mr-1" /> Back
                </Button>
                <Button className="flex-1" disabled={!selectedProjectId} onClick={() => setStep(3)}>
                  Next <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Customer details */}
          {step === 3 && (
            <div className="space-y-3">
              {selectedProjectId && (
                <div className="p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  Project: <span className="font-medium text-card-foreground">{projects.find((p) => p.id === selectedProjectId)?.name}</span>
                </div>
              )}
              <Input placeholder="Customer Name *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
              <Input placeholder="Customer Phone *" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
              <Input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} />
              <Input placeholder="Preferred Time (e.g. 10:00 AM)" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} />
              <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft size={14} className="mr-1" /> Back
                </Button>
                <Button className="flex-1" onClick={handleSubmitRequest}>Submit Request</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CPMeetingRequests;
