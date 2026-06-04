import { Lead } from '@/data/leads';

export interface LeadScore {
  total: number;
  pipelineScore: number;  // stage progression — primary intent signal
  budgetFit: number;
  urgency: number;
  engagement: number;     // visit willingness + meeting activity
  financial: number;      // loan readiness + income
  sourceBonus: number;
  // kept for backward-compat with old field names
  siteVisit: number;
  loanStatus: number;
  sourceQuality: number;
  label: 'Hot' | 'Warm' | 'Cool' | 'Cold';
  color: string;
  bgColor: string;
}

// ── Source quality bonus (max 5) ───────────────────────────────────────────
const SOURCE_BONUS: Record<string, number> = {
  'Personal Referral': 5, 'Referral': 5,
  'Walk-in': 4, 'Builder Event': 4, 'Self': 4,
  'WhatsApp Share': 3,
  '99acres': 2, 'MagicBricks': 2, 'Housing.com': 2, 'Portal': 2,
  'Google Ad': 1, 'Facebook': 1, 'Social': 1, 'Instagram': 1,
};

// ── Pipeline stage progression (max 30) ────────────────────────────────────
// Strongest real-world predictor — how far has the lead progressed?
const STAGE_SCORE: Record<string, number> = {
  'New Lead':                  2,
  'Profile Created':           6,
  'Meeting Requested':         11,
  'Meeting Confirmed':         17,
  'Meeting Done':              22,
  'Negotiation':               26,
  'Agreement':                 29,  // agreement signed — highest intent before booking
  'Booked':                    30,
  'Loan Application Created':  30,
  'Loan Sanctioned':           30,
  'Loan Disbursed':            30,
  'Registration Done':         30,
  'Possession Given':          30,
  'Closed':                    30,
};

export function calculateLeadScore(lead: Lead & {
  urgencyLevel?: string;
  siteVisitWilling?: string;
  loanRequired?: string;
  monthlyIncome?: number;
  projectPriceMin?: number;
  projectPriceMax?: number;
}): LeadScore {

  // ── 1. Pipeline stage (0–30) ───────────────────────────────────────────
  const pipelineScore = STAGE_SCORE[lead.stage] ?? 2;

  // ── 2. Budget fit (0–25) ──────────────────────────────────────────────
  // If project price is known, compare directly. Otherwise use budget tier.
  let budgetFit = 10;
  const budget = lead.budget ?? 0;
  if (lead.projectPriceMin || lead.projectPriceMax) {
    const pMin = lead.projectPriceMin ?? lead.projectPriceMax!;
    const pMax = lead.projectPriceMax ?? lead.projectPriceMin!;
    const mid  = (pMin + pMax) / 2;
    if      (budget >= pMax)         budgetFit = 25; // comfortably above max price
    else if (budget >= mid)          budgetFit = 20; // above mid-range
    else if (budget >= pMin)         budgetFit = 14; // within range
    else if (budget >= pMin * 0.8)   budgetFit = 8;  // slightly below min (negotiable)
    else                             budgetFit = 3;  // well below budget
  } else {
    // No project price — use budget tier as proxy
    if      (budget >= 30_000_000) budgetFit = 25; // ≥ 3 Cr
    else if (budget >= 15_000_000) budgetFit = 20; // 1.5–3 Cr
    else if (budget >= 7_500_000)  budgetFit = 15; // 75L–1.5 Cr
    else if (budget >= 3_000_000)  budgetFit = 10; // 30L–75L
    else if (budget >  0)          budgetFit = 5;  // < 30L
  }

  // ── 3. Urgency (0–20) ─────────────────────────────────────────────────
  // urgencyLevel field takes priority; daysInStage used as recency proxy.
  let urgency: number;
  if (lead.urgencyLevel) {
    urgency = { 'Very High': 20, 'High': 15, 'Medium': 9, 'Low': 4 }[lead.urgencyLevel] ?? 9;
  } else {
    if      (lead.daysInStage <= 1)  urgency = 18;
    else if (lead.daysInStage <= 3)  urgency = 14;
    else if (lead.daysInStage <= 7)  urgency = 9;
    else if (lead.daysInStage <= 14) urgency = 5;
    else                             urgency = 2;
  }

  // ── 4. Engagement / visit intent (0–15) ───────────────────────────────
  // Combines explicit willingness with evidence from stage / meetings.
  let engagement: number;
  if (lead.siteVisitWilling === 'Yes Immediate')       engagement = 15;
  else if (lead.siteVisitWilling === 'Yes Within a Week') engagement = 11;
  else if (lead.siteVisitWilling === 'Maybe')          engagement = 6;
  else if (lead.siteVisitWilling === 'No')             engagement = 0;
  else if (['Agreement', 'Booked', 'Loan Application Created', 'Loan Sanctioned', 'Loan Disbursed', 'Registration Done', 'Possession Given', 'Closed'].includes(lead.stage)) engagement = 15;
  else if (lead.stage === 'Negotiation')               engagement = 15;
  else if (lead.stage === 'Meeting Done')              engagement = 15;
  else if (lead.stage === 'Meeting Confirmed')         engagement = 11;
  else if (lead.meetingDate)                           engagement = 8;
  else                                                 engagement = 4;

  // ── 5. Financial readiness (0–10) ─────────────────────────────────────
  // Pre-approval is the strongest signal; self-funded buyers are next.
  let financial = 4;
  if      (lead.loanRequired === 'Pre-Approved') financial = 10;
  else if (lead.loanRequired === 'No')           financial = 8;  // self-funded = high intent
  else if (lead.loanRequired === 'Yes')          financial = 5;  // needs loan — outcome uncertain
  // Boost for high income (signals loan eligibility or self-fund capacity)
  if (lead.monthlyIncome) {
    if      (lead.monthlyIncome >= 300_000) financial = Math.min(10, financial + 3);
    else if (lead.monthlyIncome >= 150_000) financial = Math.min(10, financial + 2);
    else if (lead.monthlyIncome >= 75_000)  financial = Math.min(10, financial + 1);
  }

  // ── 6. Source bonus (0–5) ─────────────────────────────────────────────
  // Minor signal — referrals and walk-ins convert better than ad traffic.
  const sourceBonus = SOURCE_BONUS[lead.source] ?? 0;

  // ── Total (capped at 100) ──────────────────────────────────────────────
  // Max possible: 30 + 25 + 20 + 15 + 10 + 5 = 105 → capped at 100
  const total = Math.min(100, pipelineScore + budgetFit + urgency + engagement + financial + sourceBonus);

  // ── Label ──────────────────────────────────────────────────────────────
  let label: LeadScore['label'] = 'Cold';
  let color = 'text-muted-foreground';
  let bgColor = 'bg-muted';
  if      (total >= 75) { label = 'Hot';  color = 'text-red-700 dark:text-red-300';   bgColor = 'bg-red-100 dark:bg-red-900/30';   }
  else if (total >= 50) { label = 'Warm'; color = 'text-amber-700 dark:text-amber-300'; bgColor = 'bg-amber-100 dark:bg-amber-900/30'; }
  else if (total >= 25) { label = 'Cool'; color = 'text-blue-700 dark:text-blue-300';  bgColor = 'bg-blue-100 dark:bg-blue-900/30';  }

  return {
    total, pipelineScore, budgetFit, urgency, engagement, financial, sourceBonus,
    // backward-compat aliases
    siteVisit: engagement, loanStatus: financial, sourceQuality: sourceBonus,
    label, color, bgColor,
  };
}

export function getLeadEligibility(monthlyIncome: number) {
  const eligible = monthlyIncome * 60 * 0.85;
  let banks: { name: string; rate: string }[] = [];
  if      (eligible < 5_000_000)  banks = [{ name: 'SBI',   rate: '8.40%' }, { name: 'PNB',   rate: '8.55%' }];
  else if (eligible < 10_000_000) banks = [{ name: 'HDFC',  rate: '8.45%' }, { name: 'Axis',  rate: '8.50%' }];
  else                            banks = [{ name: 'ICICI', rate: '8.35%' }, { name: 'Kotak', rate: '8.40%' }];
  return { eligible, banks };
}
