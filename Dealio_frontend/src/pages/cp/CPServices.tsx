import DashboardLayout from '@/components/layout/DashboardLayout';
import { services } from '@/data/services';
import { Star, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const CPServices = () => (
  <DashboardLayout>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {services.map(s => (
        <div key={s.id} className="bg-card rounded-lg p-5 card-shadow border border-border">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-card-foreground">{s.name}</h3>
              <span className="text-xs px-2 py-0.5 rounded-pill bg-secondary/15 text-secondary font-medium">{s.category}</span>
            </div>
            {s.verified && <CheckCircle size={16} className="text-available" />}
          </div>
          <p className="text-xs text-muted-foreground mb-3">{s.description}</p>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={12} className={i < Math.floor(s.rating) ? 'text-booked fill-booked' : 'text-muted-foreground'} />
            ))}
            <span className="text-xs text-muted-foreground ml-1">{s.rating}</span>
          </div>
          <p className="text-sm font-medium text-card-foreground mb-3">{s.priceRange}</p>
          <button onClick={() => toast.success(`Referral sent! You'll earn ₹${s.leadFee.toLocaleString('en-IN')} on acceptance.`)} className="w-full py-2 rounded-lg text-xs font-semibold bg-accent text-accent-foreground hover:opacity-90">
            Refer to Customer · Earn ₹{s.leadFee.toLocaleString('en-IN')}
          </button>
        </div>
      ))}
    </div>
  </DashboardLayout>
);

export default CPServices;
