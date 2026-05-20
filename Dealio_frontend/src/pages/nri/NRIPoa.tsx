import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { nriPoaData } from '@/data/nriData';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Info, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

const NRIPoa = () => {
  const poa = nriPoaData;
  const [showForm, setShowForm] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Info Banner */}
        {showGuide && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">What is a Power of Attorney?</p>
                  <p className="mt-1 text-xs opacity-80">Since you are outside India, you can authorise a trusted person to sign documents and complete your property registration on your behalf. This must be executed at the Indian Embassy/High Commission in your country or notarized and apostilled locally.</p>
                </div>
              </div>
              <button onClick={() => setShowGuide(false)} className="text-blue-400 text-xs">✕</button>
            </div>
          </div>
        )}

        {/* Current POA Status */}
        <div className="bg-card rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={20} className="text-green-500" />
            <h3 className="font-bold text-lg">POA Verified</h3>
            <Badge className="bg-green-100 text-green-800 ml-auto">Active</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">NRI (Grantor)</p><p className="font-medium">{poa.nriName}, {poa.nriCountry}</p></div>
            <div><p className="text-xs text-muted-foreground">Nominee (Grantee)</p><p className="font-medium">{poa.nomineeName} — {poa.nomineeRelation}</p></div>
            <div><p className="text-xs text-muted-foreground">POA Type</p><p className="font-medium">{poa.poaType} — My Home Avatar</p></div>
            <div><p className="text-xs text-muted-foreground">Executed</p><p className="font-medium">{poa.executedDate}</p></div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Scope Granted</p>
            <div className="flex flex-wrap gap-2">
              {poa.scope.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Embassy Attestation</p><Badge className="bg-green-100 text-green-800 text-xs">✅ Completed</Badge></div>
            <div><p className="text-xs text-muted-foreground">Platform Verified</p><Badge className="bg-green-100 text-green-800 text-xs">✅ Jan 10, 2025</Badge></div>
          </div>

          <div className="flex gap-2 mt-4">
            <button className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted flex items-center gap-1"><FileText size={14} /> View POA Document</button>
            <button className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted flex items-center gap-1"><FileText size={14} /> View Apostille</button>
          </div>
        </div>

        {/* POA Guide Steps */}
        <div className="bg-card rounded-xl p-5 border">
          <h3 className="font-semibold mb-4">How to Get POA</h3>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Prepare POA Document', desc: 'Download our template and fill in details' },
              { step: 2, title: 'Get Embassy Attestation', desc: 'Visit Indian Embassy in your country for attestation' },
              { step: 3, title: 'Upload & Verify', desc: 'Upload here and our legal team verifies within 24-48 hours' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: '#F5A623' }}>{s.step}</div>
                <div>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 px-4 py-2 rounded-lg border text-sm font-medium" style={{ color: '#F5A623', borderColor: '#F5A623' }}>
            Download POA Template
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NRIPoa;
