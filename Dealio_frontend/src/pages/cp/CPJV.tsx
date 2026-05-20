import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusBadge from '@/components/shared/StatusBadge';
import { landListings } from '@/data/landListings';
import { MapPin } from 'lucide-react';

const CPJV = () => (
  <DashboardLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">JV Land Listings</h2>
        <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-accent-foreground">List Land for JV</button>
      </div>
      <div className="bg-card rounded-lg card-shadow border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border">
            <th className="px-4 py-3 font-medium">Location</th><th className="px-4 py-3 font-medium">Area</th>
            <th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Builders Interested</th>
          </tr></thead>
          <tbody>{landListings.map(l => (
            <tr key={l.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-card-foreground flex items-center gap-1.5"><MapPin size={12} className="text-muted-foreground" />{l.location}, {l.city}</td>
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

export default CPJV;
