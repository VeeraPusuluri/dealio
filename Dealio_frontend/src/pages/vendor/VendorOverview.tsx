import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import { services } from '@/data/services';
import { Users, FileText, Briefcase, DollarSign, CheckCircle } from 'lucide-react';

const VendorOverview = () => (
  <DashboardLayout>
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-lg font-bold text-foreground">DesignCraft Interiors</h2>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-available/15 text-available flex items-center gap-1"><CheckCircle size={10} /> Verified</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Leads This Month" value={24} icon={Users} color="#7B5E3A" />
        <StatCard title="Quotes Sent" value={18} icon={FileText} color="#3B82F6" />
        <StatCard title="Jobs Won" value={11} icon={Briefcase} color="#16A34A" />
        <StatCard title="Revenue via Platform" value="₹8,40,000" icon={DollarSign} color="#E87722" />
      </div>
      <div className="bg-card rounded-lg p-5 card-shadow border border-border">
        <h3 className="font-semibold text-card-foreground mb-3">Recent Leads</h3>
        {[
          { customer: 'Rahul Singh', project: 'My Home Avatar', service: 'Interior Design', source: 'CP Referral', date: '2025-01-18' },
          { customer: 'Sneha Patel', project: 'Sobha Meridian', service: 'Interior Design', source: 'Community', date: '2025-01-16' },
          { customer: 'Arjun Reddy', project: 'My Home Avatar', service: 'Full Home', source: 'Direct', date: '2025-01-14' },
        ].map((l, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div><p className="text-sm font-medium text-card-foreground">{l.customer}</p><p className="text-xs text-muted-foreground">{l.project} · {l.service}</p></div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-pill ${l.source === 'CP Referral' ? 'bg-accent/15 text-accent' : l.source === 'Community' ? 'bg-secondary/15 text-secondary' : 'bg-platinum/15 text-platinum'}`}>{l.source}</span>
          </div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);
export default VendorOverview;
