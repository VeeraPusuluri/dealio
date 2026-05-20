import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { landListings, builderInterests, BuilderInterest } from '@/data/landListings';
import { formatDate } from '@/lib/format';
import { X, MessageSquare, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const interestStatusColors: Record<string, string> = { Interested: '#3B82F6', 'NDA Signed': '#8B5CF6', 'EOI Received': '#0A7E8C', Negotiating: '#F59E0B' };

const LandOwnerInterests = () => {
  const [interests, setInterests] = useState(builderInterests);
  const [landFilter, setLandFilter] = useState('All');
  const [offerFilter, setOfferFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'highest'>('recent');
  const [proposalModal, setProposalModal] = useState<BuilderInterest | null>(null);

  const filtered = interests.filter(i => {
    if (landFilter !== 'All' && i.landId !== landFilter) return false;
    return true;
  });

  const handleShortlist = (id: string) => {
    setInterests(prev => prev.map(i => i.id === id ? { ...i, status: 'NDA Signed' as const } : i));
    toast.success('Builder shortlisted');
  };

  const handleDecline = (id: string) => {
    setInterests(prev => prev.filter(i => i.id !== id));
    toast.success('Interest declined');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <select value={landFilter} onChange={e => setLandFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground outline-none">
            <option value="All">All Listings</option>
            {landListings.map(l => <option key={l.id} value={l.id}>{l.location} ({l.area} {l.areaUnit})</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-3 py-2 rounded-lg bg-muted text-sm text-foreground outline-none">
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Offer</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(interest => {
            const land = landListings.find(l => l.id === interest.landId);
            return (
              <div key={interest.id} className="bg-card rounded-lg p-5 card-shadow border border-border space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#C0392B] flex items-center justify-center text-white font-bold text-lg">
                      {interest.builderName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{interest.builderName}</h3>
                      <p className="text-xs text-muted-foreground">{interest.company}</p>
                    </div>
                  </div>
                  <StatusBadge status={interest.status} color={interestStatusColors[interest.status]} />
                </div>
                {land && <p className="text-xs text-muted-foreground">For: {land.location} — {land.area} {land.areaUnit}</p>}
                {interest.proposedTerms && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Proposed Terms</p>
                    <p className="text-sm text-card-foreground">{interest.proposedTerms}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Interest expressed: {formatDate(interest.dateExpressed)}</p>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setProposalModal(interest)} className="px-3 py-2 rounded-lg text-xs font-medium bg-muted hover:opacity-90">View Full Proposal</button>
                  <button onClick={() => handleShortlist(interest.id)} className="px-3 py-2 rounded-lg text-xs font-medium bg-green-600 text-white hover:opacity-90">Shortlist</button>
                  <button onClick={() => handleDecline(interest.id)} className="px-3 py-2 rounded-lg text-xs font-medium border border-border hover:bg-muted">Decline</button>
                  <button onClick={() => toast.success('Opening chat...')} className="px-3 py-2 rounded-lg text-xs font-medium bg-[#C0392B] text-white hover:opacity-90 flex items-center gap-1">
                    <MessageSquare size={12} /> Open Chat
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {proposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setProposalModal(null)} />
          <div className="relative bg-card rounded-xl p-6 w-full max-w-md shadow-xl animate-slide-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-card-foreground">Full Proposal</h3>
              <button onClick={() => setProposalModal(null)} className="p-1 hover:bg-muted rounded"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground">Company</p><p className="font-medium text-card-foreground">{proposalModal.company}</p></div>
              <div><p className="text-muted-foreground">Builder</p><p className="font-medium text-card-foreground">{proposalModal.builderName}</p></div>
              <div><p className="text-muted-foreground">Status</p><StatusBadge status={proposalModal.status} color={interestStatusColors[proposalModal.status]} /></div>
              <div><p className="text-muted-foreground">Date</p><p className="font-medium text-card-foreground">{formatDate(proposalModal.dateExpressed)}</p></div>
            </div>
            {proposalModal.proposedTerms && <div className="bg-muted rounded-lg p-4"><p className="text-sm text-card-foreground">{proposalModal.proposedTerms}</p></div>}
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">RERA Registered: <span className="text-card-foreground">Yes</span></p>
              <p className="text-muted-foreground">Projects Delivered: <span className="text-card-foreground">12+</span></p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setProposalModal(null); toast.success('Accepted for discussion'); }} className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2"><CheckCircle size={16} /> Accept for Discussion</button>
              <button onClick={() => { setProposalModal(null); handleDecline(proposalModal.id); }} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2"><XCircle size={16} /> Reject</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LandOwnerInterests;
