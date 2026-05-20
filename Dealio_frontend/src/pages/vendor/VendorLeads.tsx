import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { vendorLeads, VendorLead, VendorLeadStatus } from '@/data/vendorLeads';
import { formatDate } from '@/lib/format';
import { X, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<VendorLeadStatus, string> = { New: '#3B82F6', Accepted: '#0A7E8C', 'In Progress': '#F59E0B', Completed: '#16A34A', Rejected: '#DC2626' };
const sourceColors: Record<string, string> = { 'CP Referral': '#E87722', Community: '#6B3FA0', Direct: '#16A34A' };
const tabs: (VendorLeadStatus | 'All')[] = ['All', 'New', 'Accepted', 'In Progress', 'Completed', 'Rejected'];

const VendorLeads = () => {
  const [leads, setLeads] = useState<VendorLead[]>(vendorLeads);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [drawerLead, setDrawerLead] = useState<VendorLead | null>(null);

  const filtered = activeTab === 'All' ? leads : leads.filter(l => l.status === activeTab);

  const handleAccept = (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'Accepted' as VendorLeadStatus } : l));
    toast.success('Lead accepted');
  };

  const handleDecline = (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: 'Rejected' as VendorLeadStatus } : l));
    toast.success('Lead declined');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t ? 'bg-[#78716C] text-white' : 'bg-muted text-muted-foreground hover:text-card-foreground'}`}>
              {t} {t !== 'All' && `(${leads.filter(l => l.status === t).length})`}
            </button>
          ))}
        </div>

        {/* Lead Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(lead => (
            <div key={lead.id} className="bg-card rounded-lg p-5 card-shadow border border-border space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-card-foreground">{lead.customerName}</h3>
                  <p className="text-xs text-muted-foreground">{lead.project} • {lead.unit}</p>
                </div>
                <StatusBadge status={lead.source} color={sourceColors[lead.source]} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Received: {formatDate(lead.dateReceived)}</span>
                {lead.budgetRange && <span>Budget: {lead.budgetRange}</span>}
              </div>
              <StatusBadge status={lead.status} color={statusColors[lead.status]} />
              <div className="flex gap-2 pt-2">
                {lead.status === 'New' && (
                  <>
                    <button onClick={() => handleAccept(lead.id)} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#0D9488] text-white hover:opacity-90">Accept Lead</button>
                    <button onClick={() => handleDecline(lead.id)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted">Decline</button>
                  </>
                )}
                {lead.status === 'Accepted' && (
                  <button onClick={() => toast.success('Opening quote builder...')} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#0D9488] text-white hover:opacity-90">Send Quote</button>
                )}
                {(lead.status === 'Accepted' || lead.status === 'In Progress') && (
                  <button onClick={() => setDrawerLead(lead)} className="px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:opacity-90">View Details</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Detail Drawer */}
      {drawerLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerLead(null)} />
          <div className="relative w-full max-w-md bg-card h-full overflow-y-auto animate-slide-up shadow-xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-card-foreground">Lead Details</h2>
                <button onClick={() => setDrawerLead(null)} className="p-1 hover:bg-muted rounded"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground">Customer</p><p className="font-medium text-card-foreground">{drawerLead.customerName}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium text-card-foreground">{drawerLead.phone}</p></div>
                <div><p className="text-muted-foreground">Project</p><p className="font-medium text-card-foreground">{drawerLead.project}</p></div>
                <div><p className="text-muted-foreground">Unit</p><p className="font-medium text-card-foreground">{drawerLead.unit}</p></div>
                <div><p className="text-muted-foreground">Budget</p><p className="font-medium text-card-foreground">{drawerLead.budgetRange || 'Not specified'}</p></div>
                <div><p className="text-muted-foreground">Source</p><StatusBadge status={drawerLead.source} color={sourceColors[drawerLead.source]} /></div>
              </div>
              {drawerLead.scopeOfWork && (
                <div>
                  <p className="text-sm font-medium text-card-foreground mb-1">Scope of Work</p>
                  <p className="text-sm text-muted-foreground">{drawerLead.scopeOfWork}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium flex items-center justify-center gap-2"><Phone size={14} /> Call</button>
                <button className="flex-1 px-4 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium flex items-center justify-center gap-2"><MessageCircle size={14} /> WhatsApp</button>
              </div>
              <h4 className="font-semibold text-card-foreground">Communication Log</h4>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-muted rounded-lg"><span className="text-xs text-muted-foreground">Jan 16, 2025</span><p className="text-card-foreground">Initial contact — discussed requirements</p></div>
                <div className="p-3 bg-muted rounded-lg"><span className="text-xs text-muted-foreground">Jan 18, 2025</span><p className="text-card-foreground">Sent catalogue via WhatsApp</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default VendorLeads;
