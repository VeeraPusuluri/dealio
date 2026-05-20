import { LeadScore } from '@/lib/leadScoring';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LeadScoreBadgeProps {
  score: LeadScore;
  showTooltip?: boolean;
}

const LeadScoreBadge = ({ score, showTooltip = true }: LeadScoreBadgeProps) => {
  const badge = (
    <span className={`${score.bgColor} ${score.color} text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1`}>
      {score.total} · {score.label}
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs space-y-1">
        <p className="font-semibold">Score Breakdown</p>
        <p>Budget Fit: {score.budgetFit}/30</p>
        <p>Urgency: {score.urgency}/25</p>
        <p>Site Visit: {score.siteVisit}/20</p>
        <p>Loan Status: {score.loanStatus}/15</p>
        <p>Source Quality: {score.sourceQuality}/10</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default LeadScoreBadge;
