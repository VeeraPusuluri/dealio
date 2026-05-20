import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { landListings } from '@/data/landListings';
import { MapPin, Users, Clock, AlertCircle } from 'lucide-react';

const LandOwnerOverview = () => {
  const active = landListings.filter(l => l.status === 'Active').length;
  const review = landListings.filter(l => l.status === 'Under Review').length;
  const totalInterest = landListings.reduce((s, l) => s + l.buildersInterested, 0);
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Listed" value={landListings.length} icon={MapPin} color="#C0392B" />
          <StatCard title="Active" value={active} icon={MapPin} color="#16A34A" />
          <StatCard title="Under Review" value={review} icon={Clock} color="#F59E0B" />
          <StatCard title="Builders Interested" value={totalInterest} icon={Users} color="#0A7E8C" />
        </div>
        {totalInterest > 0 && (
          <div className="bg-accent/10 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-accent" />
            <p className="text-sm text-card-foreground">{totalInterest} builders interested in your listings. Check Builder Interests for details.</p>
          </div>
        )}
        <div className="bg-card rounded-lg card-shadow border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="px-4 py-3 font-medium">Location</th><th className="px-4 py-3 font-medium">Area</th>
              <th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Interest</th>
            </tr></thead>
            <tbody>{landListings.map(l => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-card-foreground">{l.location}, {l.city}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.area} {l.areaUnit}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.dealPreference}</td>
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                <td className="px-4 py-3 text-right font-semibold text-card-foreground">{l.buildersInterested}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};
export default LandOwnerOverview;
