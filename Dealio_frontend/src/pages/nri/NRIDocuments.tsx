import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { nriDocuments } from '@/data/nriData';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, Upload, Eye } from 'lucide-react';
import { toast } from 'sonner';

const tabs = ['All', 'Identity', 'Income', 'Financial', 'Address', 'Legal', 'Tax'];

const NRIDocuments = () => {
  const [activeTab, setActiveTab] = useState('All');
  const verified = nriDocuments.filter(d => d.status === 'Verified').length;
  const total = nriDocuments.length;

  const filtered = activeTab === 'All' ? nriDocuments : nriDocuments.filter(d => d.type === activeTab);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Progress */}
        <div className="bg-card rounded-xl p-5 border flex items-center gap-6">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F5A623" strokeWidth="3"
                strokeDasharray={`${(verified / total) * 100}, 100`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{verified}/{total}</span>
          </div>
          <div>
            <h3 className="font-semibold">{Math.round((verified / total) * 100)}% Documents Complete</h3>
            <p className="text-sm text-muted-foreground mt-1">Your loan application is 95% ready — upload {total - verified} pending document{total - verified > 1 ? 's' : ''} to proceed.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${activeTab === t ? 'border-[#F5A623] bg-[#F5A623]/10 text-[#F5A623]' : 'border-border text-muted-foreground'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50 text-muted-foreground text-xs">
              <th className="p-3 text-left">Document</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Uploaded</th><th className="p-3 text-left">Action</th>
            </tr></thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{doc.name}</td>
                  <td className="p-3 text-muted-foreground">{doc.type}</td>
                  <td className="p-3">
                    {doc.status === 'Verified' ? (
                      <Badge className="bg-green-100 text-green-800 text-xs"><CheckCircle2 size={12} className="mr-1" />Verified</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 text-xs"><AlertCircle size={12} className="mr-1" />Upload Required</Badge>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{doc.uploadedDate || '—'}</td>
                  <td className="p-3">
                    {doc.status === 'Verified' ? (
                      <button className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted"><Eye size={12} className="inline mr-1" />View</button>
                    ) : (
                      <button onClick={() => toast.success(`${doc.name} uploaded. Under review.`)}
                        className="text-xs px-3 py-1 rounded text-white font-medium" style={{ backgroundColor: '#F5A623' }}>
                        <Upload size={12} className="inline mr-1" />Upload
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NRIDocuments;
