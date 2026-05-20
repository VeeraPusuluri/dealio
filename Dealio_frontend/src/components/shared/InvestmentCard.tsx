import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const categoryColors: Record<string, string> = {
  Banking: 'bg-blue-100 text-blue-800',
  Infrastructure: 'bg-teal-100 text-teal-800',
  'Real Estate': 'bg-indigo-100 text-indigo-800',
  Energy: 'bg-green-100 text-green-800',
  Healthcare: 'bg-purple-100 text-purple-800',
};

const riskColors: Record<string, string> = {
  'Very Low': 'text-green-600',
  Low: 'text-teal-600',
  'Low-Medium': 'text-cyan-600',
  Medium: 'text-amber-600',
  'Medium-High': 'text-orange-600',
  High: 'text-red-600',
};

interface Opportunity {
  id: string; name: string; category: string; returnMin: number; returnMax: number;
  lockInYears: number; minAmount: number; risk: string; repatriable: boolean; taxFree: boolean;
  description: string; howItWorks: string[];
}

interface Props {
  opportunity: Opportunity;
  showCompare?: boolean;
  isCompared?: boolean;
  onCompareToggle?: (id: string) => void;
}

const InvestmentCard = ({ opportunity: o, showCompare, isCompared, onCompareToggle }: Props) => {
  const [showDetail, setShowDetail] = useState(false);

  const formatMin = o.minAmount >= 100000
    ? `₹${(o.minAmount / 100000).toFixed(o.minAmount % 100000 === 0 ? 0 : 1)}L`
    : `₹${o.minAmount.toLocaleString('en-IN')}`;

  return (
    <>
      <div className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
        <Badge className={`text-[10px] ${categoryColors[o.category] || 'bg-gray-100 text-gray-800'}`}>{o.category}</Badge>
        <h4 className="font-semibold text-card-foreground mt-2">{o.name}</h4>
        <p className="text-2xl font-bold text-teal-600 mt-1">{o.returnMin}–{o.returnMax}% <span className="text-xs font-normal text-muted-foreground">p.a.</span></p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Lock-in: {o.lockInYears} yrs</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Min: {formatMin}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium ${riskColors[o.risk] || ''}`}>{o.risk}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{o.description}</p>
        <div className="flex items-center justify-between mt-3">
          {showCompare && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={isCompared} onChange={() => onCompareToggle?.(o.id)} className="rounded accent-teal-600" />
              Compare
            </label>
          )}
          <button onClick={() => setShowDetail(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium text-white bg-[#0F2035] hover:bg-[#1B3A5C] ml-auto">Know More</button>
        </div>
      </div>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{o.name}</DialogTitle></DialogHeader>
          <Badge className={`w-fit text-[10px] ${categoryColors[o.category] || ''}`}>{o.category}</Badge>
          <p className="text-sm text-muted-foreground mt-2">{o.description}</p>
          <div className="mt-3">
            <p className="text-sm font-semibold mb-2">How it works:</p>
            <ul className="space-y-1.5">{o.howItWorks.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-teal-600">•</span>{s}</li>)}</ul>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 rounded bg-muted"><p className="text-xs text-muted-foreground">Returns</p><p className="font-semibold">{o.returnMin}–{o.returnMax}%</p></div>
            <div className="p-2 rounded bg-muted"><p className="text-xs text-muted-foreground">Risk</p><p className={`font-semibold ${riskColors[o.risk]}`}>{o.risk}</p></div>
            <div className="p-2 rounded bg-muted"><p className="text-xs text-muted-foreground">Tax-free</p><p className="font-semibold">{o.taxFree ? 'Yes' : 'No'}</p></div>
            <div className="p-2 rounded bg-muted"><p className="text-xs text-muted-foreground">Repatriable</p><p className="font-semibold">{o.repatriable ? 'Yes' : 'No'}</p></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 italic">Dealio connects you with vetted operators. You invest, they manage.</p>
          <button onClick={() => { toast.success('Our advisor will contact you within 24 hours'); setShowDetail(false); }}
            className="w-full mt-3 py-2.5 rounded-lg text-white font-medium text-sm" style={{ backgroundColor: '#F5A623' }}>Express Interest</button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvestmentCard;
