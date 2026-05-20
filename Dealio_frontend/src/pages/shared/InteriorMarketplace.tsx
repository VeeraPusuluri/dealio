import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Star, Send, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Vendor { id: string; name: string; specialisation: string[]; startingPrice: number; rating: number; city: string; portfolio: string[]; }

const vendors: Vendor[] = [
  { id: 'V001', name: 'DesignCraft Interiors', specialisation: ['Full Home', 'Modular Kitchen', 'Vastu-compliant'], startingPrice: 500000, rating: 4.6, city: 'Hyderabad', portfolio: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200'] },
  { id: 'V002', name: 'Urban Nest Design', specialisation: ['Turnkey', 'Modern Minimalist'], startingPrice: 800000, rating: 4.8, city: 'Hyderabad', portfolio: ['https://images.unsplash.com/photo-1615529182904-14819c35db37?w=200', 'https://images.unsplash.com/photo-1600210492493-0946911f159a?w=200'] },
  { id: 'V003', name: 'HomeLane Studio', specialisation: ['Modular Kitchen', 'Wardrobe', 'Budget'], startingPrice: 300000, rating: 4.3, city: 'Hyderabad', portfolio: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200'] },
  { id: 'V004', name: 'Livspace Hyderabad', specialisation: ['Full Home', 'Turnkey', 'Premium'], startingPrice: 1200000, rating: 4.7, city: 'Hyderabad', portfolio: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=200', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=200'] },
];

const InteriorMarketplace = () => {
  const [search, setSearch] = useState('');
  const [filterSpec, setFilterSpec] = useState('');
  const [enquiryVendor, setEnquiryVendor] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const allSpecs = [...new Set(vendors.flatMap(v => v.specialisation))];
  const filtered = vendors.filter(v => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSpec && !v.specialisation.includes(filterSpec)) return false;
    return true;
  });

  const sendEnquiry = () => {
    toast.success('Enquiry sent! Vendor will contact you within 24 hours.');
    setEnquiryVendor(null); setMessage('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-card-foreground">Interior Design Vendors</h2>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground" />
          </div>
          <select value={filterSpec} onChange={e => setFilterSpec(e.target.value)} className="px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground">
            <option value="">All Specialisations</option>
            {allSpecs.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(v => (
            <div key={v.id} className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="flex gap-1 p-3 overflow-x-auto">
                {v.portfolio.map((img, i) => <img key={i} src={img} alt="" className="w-24 h-20 rounded-lg object-cover flex-shrink-0" />)}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground">{v.name}</h3>
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5"><Star size={12} fill="currentColor" /> {v.rating}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {v.specialisation.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{s}</span>)}
                </div>
                <p className="text-sm text-card-foreground mt-2">Starting ₹{(v.startingPrice / 100000).toFixed(0)}L · {v.city}</p>
                <button onClick={() => setEnquiryVendor(v.id)} className="mt-3 w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 flex items-center justify-center gap-2"><Send size={14} /> Send Enquiry</button>
              </div>

              {enquiryVendor === v.id && (
                <div className="border-t border-border p-4 space-y-2">
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Hi, I'm interested in interior design for my apartment..." className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground resize-none placeholder:text-muted-foreground" />
                  <div className="flex gap-2">
                    <button onClick={sendEnquiry} className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700">Submit</button>
                    <button onClick={() => setEnquiryVendor(null)} className="px-4 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-semibold">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InteriorMarketplace;
