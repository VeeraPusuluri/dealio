interface StatusBadgeProps {
  status: string;
  color?: string;
  size?: 'sm' | 'md';
}

const statusColorMap: Record<string, string> = {
  Active: '#16A34A', 'Closing Soon': '#F59E0B', 'New Launch': '#0A7E8C',
  Platinum: '#8B5CF6', Gold: '#F59E0B', Silver: '#6B7280',
  Available: '#16A34A', Booked: '#F59E0B', Sold: '#DC2626', Hold: '#9CA3AF',
  Pending: '#F59E0B', Processing: '#3B82F6', Released: '#16A34A', Paid: '#16A34A',
  Applied: '#3B82F6', 'Documents Pending': '#DC2626', Sanctioned: '#0A7E8C', Disbursed: '#16A34A',
  Open: '#DC2626', Investigating: '#F59E0B', Resolved: '#16A34A',
  Interested: '#3B82F6', 'NDA Signed': '#8B5CF6', 'EOI Received': '#0A7E8C', Negotiating: '#F59E0B',
  'Under Review': '#F59E0B', Closed: '#16A34A',
  Verified: '#16A34A',
};

const StatusBadge = ({ status, color, size = 'sm' }: StatusBadgeProps) => {
  const bgColor = color || statusColorMap[status] || '#6B7280';
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-pill ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}
      style={{ backgroundColor: bgColor + '18', color: bgColor }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
