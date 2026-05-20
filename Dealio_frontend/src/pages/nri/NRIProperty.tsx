import DashboardLayout from '@/components/layout/DashboardLayout';
import { useNRIStore } from '@/stores/useNRIStore';
import { formatDualPrice } from '@/lib/nriUtils';
import { nriProfiles } from '@/data/nriData';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Phone, Building2 } from 'lucide-react';

const NRIProperty = () => {
  const { currency } = useNRIStore();
  const navigate = useNavigate();
  const profile = nriProfiles[0];
  const hasProperty = true; // mock: Arjun has booked

  if (!hasProperty) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <Building2 size={48} className="text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No property booked yet</h2>
          <p className="text-muted-foreground mb-4">Browse projects to find your dream home</p>
          <button onClick={() => navigate('/nri/projects')} className="px-6 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: '#F5A623' }}>Browse Projects</button>
        </div>
      </DashboardLayout>
    );
  }

  const payments = [
    { stage: 'Booking (10%)', amount: 2200000, status: 'Paid', date: 'Jan 2, 2025' },
    { stage: 'Foundation (20%)', amount: 4400000, status: 'Paid', date: 'Feb 15, 2025' },
    { stage: 'Structure (25%)', amount: 5500000, status: 'Due', date: 'Apr 30, 2025' },
    { stage: 'Pre-handover (25%)', amount: 5500000, status: 'Upcoming', date: 'Jul 2025' },
    { stage: 'On Possession (20%)', amount: 4400000, status: 'Upcoming', date: 'Sep 2025' },
  ];

  const paid = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const total = 22000000;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F2035 0%, #1B3A5C 100%)' }}>
          <div className="p-6 text-white">
            <h2 className="text-xl font-bold">My Home Avatar — 4BHK</h2>
            <p className="text-sm opacity-70 mt-1">Tower C, Unit 1204 · Tellapur, Hyderabad</p>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <span>{formatDualPrice(total, currency)}</span>
              <span>2,400 sqft</span>
              <span>Possession: Sep 2025</span>
              <span>Booked: Dec 28, 2024</span>
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="bg-card rounded-xl p-5 border">
          <h3 className="font-semibold mb-3">Payment Progress</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-muted rounded-full h-3">
              <div className="h-3 rounded-full" style={{ width: `${(paid / total) * 100}%`, backgroundColor: '#F5A623' }} />
            </div>
            <span className="text-sm font-medium">{Math.round((paid / total) * 100)}%</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">{formatDualPrice(paid, currency)} paid of {formatDualPrice(total, currency)}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-xs"><th className="p-2 text-left">Stage</th><th className="p-2 text-left">Amount</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Date</th></tr></thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2 font-medium">{p.stage}</td>
                    <td className="p-2">{formatDualPrice(p.amount, currency)}</td>
                    <td className="p-2">
                      <Badge className={p.status === 'Paid' ? 'bg-green-100 text-green-800' : p.status === 'Due' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-muted-foreground'}>
                        {p.status === 'Paid' ? '✅ Paid' : p.status === 'Due' ? '⏰ Due' : '⏳ Upcoming'}
                      </Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pay Next */}
        <div className="bg-card rounded-xl p-5 border" style={{ borderColor: '#F5A62340' }}>
          <h3 className="font-semibold mb-2">Pay Next Instalment</h3>
          <p className="text-sm text-muted-foreground">Transfer {formatDualPrice(5500000, currency)} via NRE account to:</p>
          <div className="mt-2 p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <p><strong>HDFC Bank</strong> — Prestige Group Escrow Account</p>
            <p>A/c: XXXX XXXX 1234 · IFSC: HDFC0001234</p>
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-card rounded-xl p-5 border">
          <h3 className="font-semibold mb-3">My Contacts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Ravi Kumar', role: 'Assigned CP', phone: '+91 98765 43210' },
              { name: 'Builder Sales', role: 'My Home Group', phone: '+91 40 1234 5678' },
              { name: 'Ramesh Babu', role: 'Bank Officer — HDFC', phone: '+91 98000 01234' },
              { name: 'Adv. Priya Sharma', role: 'Legal Advisor', phone: '+91 98765 00000' },
            ].map(c => (
              <div key={c.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#1B3A5C' }}>
                  {c.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.role}</p>
                </div>
                <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" className="p-1.5 rounded-full hover:bg-muted"><MessageCircle size={16} className="text-green-500" /></a>
                <a href={`tel:${c.phone}`} className="p-1.5 rounded-full hover:bg-muted"><Phone size={16} className="text-muted-foreground" /></a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NRIProperty;
