import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Shield, Scroll, LayoutPanelLeft, Upload } from 'lucide-react';

const documents = [
  { name: 'RERA Certificate - P001', type: 'RERA', date: '2024-12-01', size: '2.4 MB', status: 'Verified', icon: Shield },
  { name: 'Title Deed - Prestige Skyline', type: 'Legal', date: '2024-11-15', size: '5.1 MB', status: 'Verified', icon: Scroll },
  { name: 'Floor Plan Tower A', type: 'Blueprint', date: '2024-12-10', size: '8.2 MB', status: 'Verified', icon: LayoutPanelLeft },
  { name: 'Brochure - Prestige Skyline', type: 'Brochure', date: '2025-01-05', size: '12.6 MB', status: 'Pending', icon: FileText },
  { name: 'Legal Opinion', type: 'Legal', date: '2024-11-20', size: '1.8 MB', status: 'Verified', icon: Scroll },
];

const BuilderDocuments = () => (
  <DashboardLayout>
    <div className="space-y-5">
      <div className="la-banner px-5 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Document Vault</h2>
        <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
          <Upload size={14} /> Upload Document
        </button>
      </div>
      <div className="la-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/60">
              <th className="px-5 py-3.5 font-medium">Document</th>
              <th className="px-5 py-3.5 font-medium">Type</th>
              <th className="px-5 py-3.5 font-medium">Date</th>
              <th className="px-5 py-3.5 font-medium">Size</th>
              <th className="px-5 py-3.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, i) => {
              const Icon = doc.icon;
              return (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Icon size={15} className="text-slate-500" />
                      </div>
                      <span className="text-slate-700 font-medium">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{doc.type}</td>
                  <td className="px-5 py-3.5 text-slate-400">{doc.date}</td>
                  <td className="px-5 py-3.5 text-slate-400">{doc.size}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${doc.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {doc.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </DashboardLayout>
);

export default BuilderDocuments;