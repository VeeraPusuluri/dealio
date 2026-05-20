import { Lead } from '@/data/leads';

export interface LeadScore {
  total: number;
  budgetFit: number;
  urgency: number;
  siteVisit: number;
  loanStatus: number;
  sourceQuality: number;
  label: 'Hot' | 'Warm' | 'Cool' | 'Cold';
  color: string;
  bgColor: string;
}

const sourceScores: Record<string, number> = {
  'Personal Referral': 10, 'Referral': 10, 'Walk-in': 9, 'WhatsApp Share': 7,
  '99acres': 5, 'MagicBricks': 5, 'Housing.com': 5, 'Google Ad': 4,
  'Facebook': 3, 'Social': 3, 'Instagram': 3, 'Self': 7, 'Portal': 5, 'Builder Event': 6,
};

export function calculateLeadScore(lead: Lead & {
  urgencyLevel?: string;
  siteVisitWilling?: string;
  loanRequired?: string;
  monthlyIncome?: number;
}): LeadScore {
  // Budget fit (0-30) - simplified: use budget vs average project price
  let budgetFit = 20; // default mid

  // Urgency (0-25)
  let urgency = 10;
  if (lead.urgencyLevel === 'Very High') urgency = 25;
  else if (lead.urgencyLevel === 'High') urgency = 18;
  else if (lead.urgencyLevel === 'Medium') urgency = 10;
  else if (lead.urgencyLevel === 'Low') urgency = 5;
  else if (lead.daysInStage < 3) urgency = 18;
  else if (lead.daysInStage < 7) urgency = 10;
  else urgency = 5;

  // Site visit willingness (0-20)
  let siteVisit = 7;
  if (lead.siteVisitWilling === 'Yes Immediate') siteVisit = 20;
  else if (lead.siteVisitWilling === 'Yes Within a Week') siteVisit = 14;
  else if (lead.siteVisitWilling === 'Maybe') siteVisit = 7;
  else if (lead.siteVisitWilling === 'No') siteVisit = 0;
  else if (lead.meetingDate) siteVisit = 14;
  else if (lead.stage === 'Meeting Done') siteVisit = 20;

  // Loan status (0-15)
  let loanStatus = 8;
  if (lead.loanRequired === 'Pre-Approved') loanStatus = 15;
  else if (lead.loanRequired === 'No') loanStatus = 12;
  else if (lead.loanRequired === 'Yes') loanStatus = 8;
  else if (lead.budget > 15000000) loanStatus = 10;

  // Source quality (0-10)
  const sourceQuality = sourceScores[lead.source] || 2;

  const total = Math.min(100, budgetFit + urgency + siteVisit + loanStatus + sourceQuality);

  let label: LeadScore['label'] = 'Cold';
  let color = 'text-muted-foreground';
  let bgColor = 'bg-muted';
  if (total >= 75) { label = 'Hot'; color = 'text-red-700 dark:text-red-300'; bgColor = 'bg-red-100 dark:bg-red-900/30'; }
  else if (total >= 50) { label = 'Warm'; color = 'text-amber-700 dark:text-amber-300'; bgColor = 'bg-amber-100 dark:bg-amber-900/30'; }
  else if (total >= 25) { label = 'Cool'; color = 'text-blue-700 dark:text-blue-300'; bgColor = 'bg-blue-100 dark:bg-blue-900/30'; }

  return { total, budgetFit, urgency, siteVisit, loanStatus, sourceQuality, label, color, bgColor };
}

export function getLeadEligibility(monthlyIncome: number) {
  const eligible = monthlyIncome * 60 * 0.85;
  let banks: { name: string; rate: string }[] = [];
  if (eligible < 5000000) banks = [{ name: 'SBI', rate: '8.40%' }, { name: 'PNB', rate: '8.55%' }];
  else if (eligible < 10000000) banks = [{ name: 'HDFC', rate: '8.45%' }, { name: 'Axis', rate: '8.50%' }];
  else banks = [{ name: 'ICICI', rate: '8.35%' }, { name: 'Kotak', rate: '8.40%' }];
  return { eligible, banks };
}
