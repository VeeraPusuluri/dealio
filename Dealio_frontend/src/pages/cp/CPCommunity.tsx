import DashboardLayout from '@/components/layout/DashboardLayout';
import { communities } from '@/data/communityData';
import { Users, Upload } from 'lucide-react';

const CPCommunity = () => {
  const community = communities[0];
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-card rounded-lg p-5 card-shadow border border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-card-foreground">{community.name}</h3>
              <p className="text-sm text-muted-foreground">{community.projectName}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={16} /> {community.optedInMembers}/{community.totalFlats} members
            </div>
          </div>
          <div className="space-y-3">
            {community.notices.map(n => (
              <div key={n.id} className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-pill ${n.type === 'Deal' ? 'bg-secondary/20 text-secondary' : n.type === 'Event' ? 'bg-platinum/20 text-platinum' : 'bg-booked/20 text-booked'}`}>{n.type}</span>
                  <span className="text-[10px] text-muted-foreground">{n.date}</span>
                </div>
                <p className="font-medium text-sm text-card-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-lg p-5 card-shadow border border-border">
          <h3 className="font-semibold text-card-foreground mb-3">Upload Community</h3>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Drop CSV of residents here</p>
          </div>
        </div>
        <div className="bg-card rounded-lg p-5 card-shadow border border-border">
          <h3 className="font-semibold text-card-foreground mb-3">Group Deals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {community.groupDeals.map(d => (
              <div key={d.id} className="bg-muted rounded-lg p-4">
                <p className="font-semibold text-sm text-card-foreground">{d.vendorName}</p>
                <p className="text-xs text-muted-foreground mt-1">{d.offer}</p>
                <p className="text-xs text-muted-foreground">Min {d.minFlats} flats · Deadline: {d.deadline}</p>
                <p className="text-xs font-medium text-accent mt-2">{d.interested} interested</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPCommunity;
