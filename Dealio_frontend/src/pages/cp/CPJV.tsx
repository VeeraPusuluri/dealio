import DashboardLayout from '@/components/layout/DashboardLayout';

const CPJV = () => (
  <DashboardLayout>
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">JV Opportunities</h2>
      <div className="bg-card rounded-lg card-shadow border border-border p-8 text-center text-muted-foreground">
        <p className="text-sm">Joint venture listings are not available at this time.</p>
      </div>
    </div>
  </DashboardLayout>
);

export default CPJV;