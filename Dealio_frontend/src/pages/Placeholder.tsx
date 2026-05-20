import DashboardLayout from '@/components/layout/DashboardLayout';
const Placeholder = ({ title }: { title: string }) => (
  <DashboardLayout>
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-2">This page is ready for detailed implementation.</p>
      </div>
    </div>
  </DashboardLayout>
);
export default Placeholder;
