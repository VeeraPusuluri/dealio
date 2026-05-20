import { MilestoneStage } from '@/stores/useCustomerMilestoneStore';

const milestoneChipColors: Record<MilestoneStage, { bg: string; text: string }> = {
  'Enquiry': { bg: 'bg-muted', text: 'text-muted-foreground' },
  'Site Visit Scheduled': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  'Site Visit Done': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
  'Negotiation': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  'Booked': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  'Loan Application Created': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300' },
  'Loan Sanctioned': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300' },
  'Loan Disbursed': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  'Registration Done': { bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-300' },
  'Possession Given': { bg: 'bg-green-200 dark:bg-green-900/40', text: 'text-green-800 dark:text-green-200' },
  'Interior Referred': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
  'Interior In Progress': { bg: 'bg-orange-200 dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-200' },
  'Interior Completed': { bg: 'bg-orange-300 dark:bg-orange-900/50', text: 'text-orange-900 dark:text-orange-100' },
};

interface MilestoneChipProps {
  milestone: string;
  size?: 'sm' | 'md';
}

const MilestoneChip = ({ milestone, size = 'sm' }: MilestoneChipProps) => {
  const colors = milestoneChipColors[milestone as MilestoneStage] || { bg: 'bg-muted', text: 'text-muted-foreground' };
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`${colors.bg} ${colors.text} ${sizeClasses} rounded-full font-medium whitespace-nowrap`}>
      {milestone}
    </span>
  );
};

export default MilestoneChip;
