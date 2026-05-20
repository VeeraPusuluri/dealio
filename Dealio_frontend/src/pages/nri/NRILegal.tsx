import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const sections = [
  {
    title: 'FEMA Rules (Foreign Exchange Management Act)',
    icon: '🏛️',
    content: [
      'NRIs can buy residential and commercial property in India.',
      'Agricultural land, farmhouse, and plantation property cannot be purchased by NRIs.',
      'Payments must be made through NRE/NRO/FCNR accounts or inward remittance.',
      'NRE Account: Fully repatriable. Tax-free interest. Used for fresh remittances.',
      'NRO Account: Partially repatriable (up to $1M/year). For Indian income.',
      'FCNR Account: Foreign Currency Non-Resident. Deposits in foreign currency.',
    ],
  },
  {
    title: 'RERA Protection',
    icon: '🛡️',
    content: [
      'All projects must be RERA registered before advertising or selling.',
      'Verify RERA registration on your state RERA website.',
      'Builder must deliver as per agreed timeline or pay compensation.',
      'Refund rights: If builder defaults, full refund with interest is mandated.',
      'Carpet area must be clearly mentioned — no ambiguity on super built-up.',
    ],
  },
  {
    title: 'TDS for NRI Buyers',
    icon: '💰',
    content: [
      'When NRI sells property: TDS at 20% on LTCG (held >2 years) or 30% on STCG.',
      'Post July 2024: LTCG rate reduced to 12.5% without indexation.',
      'Apply for Form 13 (Lower TDS Certificate) to reduce TDS burden.',
      'Rental income TDS: 31.2% deducted at source by tenant.',
      'Buyer must deduct TDS and deposit via Form 26QB.',
    ],
  },
  {
    title: 'Repatriation of Funds',
    icon: '💱',
    content: [
      'NRO account: Repatriate up to $1 million per financial year.',
      'NRE account: Fully repatriable without limits.',
      'Forms 15CA and 15CB required for outward remittance.',
      'CA certification mandatory for amounts exceeding ₹5 lakh.',
    ],
  },
  {
    title: 'Home Loan for NRIs',
    icon: '🏦',
    content: [
      'NRIs are eligible for home loans from Indian banks.',
      'Loan tenure: Up to 20-25 years, typically ending before age 60-65.',
      'Interest rates: Generally 0.25-0.5% higher than resident rates.',
      'Repayment via NRE/NRO account or direct remittance.',
      'Tax deductions: Section 24b (₹2L interest) and Section 80C (₹1.5L principal).',
      'Joint loans with resident co-applicant allowed.',
    ],
  },
  {
    title: 'Power of Attorney',
    icon: '⚖️',
    content: [
      'General POA: Covers all matters. Specific POA: For a single transaction.',
      'Execute at Indian Embassy/High Commission abroad.',
      'For countries in Hague Convention: Apostille required instead of embassy attestation.',
      'POA validity: Usually valid until revoked or specific transaction completes.',
      'Revocation: Must be formally communicated and registered.',
    ],
  },
  {
    title: 'Property Registration',
    icon: '📋',
    content: [
      'POA nominee can register property on NRI\'s behalf.',
      'Registration within 4 months of execution of sale deed.',
      'Stamp duty: Varies by state (5-7% typically in Telangana).',
      'Documents needed: Sale deed, tax receipts, encumbrance certificate, ID proofs.',
    ],
  },
];

const NRILegal = () => {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">NRI Property Investment — Legal Guide</h2>
            <p className="text-xs text-muted-foreground mt-1">Last updated: Jan 2025</p>
          </div>
        </div>

        <div className="space-y-3">
          {sections.map((section, i) => (
            <div key={i} className="bg-card rounded-xl border overflow-hidden">
              <button onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{section.icon}</span>
                  <span className="font-semibold text-sm">{section.title}</span>
                </div>
                {expanded === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {expanded === i && (
                <div className="px-4 pb-4 space-y-2">
                  {section.content.map((point, j) => (
                    <p key={j} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-muted-foreground/40">•</span>
                      {point}
                    </p>
                  ))}
                  <button onClick={() => toast.info('Our NRI legal advisor will contact you via WhatsApp within 4 business hours.')}
                    className="mt-3 text-xs font-medium flex items-center gap-1" style={{ color: '#F5A623' }}>
                    <MessageCircle size={12} /> Ask CPConnect's Legal Expert
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Floating CTA */}
        <div className="fixed bottom-6 right-6 z-40">
          <button onClick={() => toast.info('Our NRI legal advisor will WhatsApp you within 4 business hours.')}
            className="flex items-center gap-2 px-4 py-3 rounded-full text-white text-sm font-semibold shadow-lg" style={{ backgroundColor: '#F5A623' }}>
            <MessageCircle size={16} /> Talk to Legal Expert
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NRILegal;
