import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { services, ServiceVendor } from '@/data/services';
import { Star, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

const categories = ['Interior Design', 'Civil Work', 'Painting', 'False Ceiling', 'Flooring', 'Electrical', 'Plumbing', 'Modular Kitchen', 'Furniture'];

interface Listing extends ServiceVendor {
  active: boolean;
  turnaround?: string;
}

const VendorListings = () => {
  const [listings, setListings] = useState<Listing[]>(services.map(s => ({ ...s, active: true, turnaround: '4-6 weeks' })));
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: categories[0], name: '', description: '', priceRange: '', turnaround: '4-6 weeks', cities: ['Hyderabad'] });

  const handleSave = () => {
    if (!form.name) { toast.error('Please enter service title'); return; }
    if (editId) {
      setListings(prev => prev.map(l => l.id === editId ? { ...l, name: form.name, category: form.category, description: form.description, priceRange: form.priceRange, turnaround: form.turnaround } : l));
      toast.success('Listing updated');
    } else {
      const newListing: Listing = { id: `SV${String(listings.length + 1).padStart(3, '0')}`, ...form, rating: 0, verified: false, leadFee: 0, portfolioImages: [], active: true, cities: form.cities };
      setListings(prev => [...prev, newListing]);
      toast.success('Listing created');
    }
    setShowModal(false);
    setEditId(null);
    setForm({ category: categories[0], name: '', description: '', priceRange: '', turnaround: '4-6 weeks', cities: ['Hyderabad'] });
  };

  const toggleActive = (id: string) => setListings(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l));
  const deleteListing = (id: string) => { setListings(prev => prev.filter(l => l.id !== id)); toast.success('Listing deleted'); };

  const openEdit = (listing: Listing) => {
    setEditId(listing.id);
    setForm({ category: listing.category, name: listing.name, description: listing.description, priceRange: listing.priceRange, turnaround: listing.turnaround || '', cities: listing.cities });
    setShowModal(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">My Service Listings</h2>
          <button onClick={() => { setEditId(null); setShowModal(true); }} className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#0D9488] text-white hover:opacity-90 flex items-center gap-2">
            <Plus size={16} /> Add New Service
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(l => (
            <div key={l.id} className={`bg-card rounded-lg p-5 card-shadow border border-border space-y-3 ${!l.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{l.category}</p>
                  <h3 className="font-semibold text-card-foreground">{l.name}</h3>
                </div>
                <button onClick={() => toggleActive(l.id)}>
                  {l.active ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} className="text-muted-foreground" />}
                </button>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{l.description}</p>
              <p className="text-sm font-medium text-card-foreground">{l.priceRange}</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} className={i < Math.floor(l.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'} />)}
                <span className="text-xs text-muted-foreground ml-1">{l.rating}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(l)} className="flex-1 px-3 py-1.5 rounded text-xs font-medium bg-muted flex items-center justify-center gap-1"><Edit size={12} /> Edit</button>
                <button onClick={() => deleteListing(l.id)} className="px-3 py-1.5 rounded text-xs font-medium bg-red-500/10 text-red-500 flex items-center justify-center gap-1"><Trash2 size={12} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl animate-slide-up space-y-4">
            <h3 className="text-lg font-bold text-card-foreground">{editId ? 'Edit Service' : 'Add New Service'}</h3>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-muted text-sm outline-none text-foreground">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Service Title" className="w-full px-3 py-2 rounded-lg bg-muted text-sm outline-none text-foreground" />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="w-full px-3 py-2 rounded-lg bg-muted text-sm outline-none text-foreground min-h-[80px]" />
            <input value={form.priceRange} onChange={e => setForm(f => ({ ...f, priceRange: e.target.value }))} placeholder="Price Range (e.g. ₹800–1,800/sqft)" className="w-full px-3 py-2 rounded-lg bg-muted text-sm outline-none text-foreground" />
            <input value={form.turnaround} onChange={e => setForm(f => ({ ...f, turnaround: e.target.value }))} placeholder="Turnaround Time" className="w-full px-3 py-2 rounded-lg bg-muted text-sm outline-none text-foreground" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg bg-[#0D9488] text-white text-sm font-semibold hover:opacity-90">Save Listing</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default VendorListings;
