export type Tier = 'Platinum' | 'Gold' | 'Silver';

export interface ChannelPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  tier: Tier;
  totalDeals: number;
  dealsThisMonth: number;
  totalEarnings: number;
  pendingCommission: number;
  referredBy?: string;
  referrals: string[];
  joinedDate: string;
  avatar?: string;
  influencerScore: number;
  sharesThisMonth: number;
  leadsFromSocial: number;
}

export const tierColors: Record<Tier, string> = {
  Platinum: '#8B5CF6',
  Gold: '#F59E0B',
  Silver: '#6B7280',
};

export const channelPartners: ChannelPartner[] = [
  { id: 'CP001', name: 'Ravi Kumar', email: 'ravi@cpconnect.in', phone: '9800012345', city: 'Hyderabad', tier: 'Platinum', totalDeals: 48, dealsThisMonth: 6, totalEarnings: 1240000, pendingCommission: 275000, referrals: ['CP002', 'CP007'], joinedDate: '2022-03-15', influencerScore: 92, sharesThisMonth: 34, leadsFromSocial: 8 },
  { id: 'CP002', name: 'Priya Sharma', email: 'priya@cpconnect.in', phone: '9800023456', city: 'Hyderabad', tier: 'Gold', totalDeals: 28, dealsThisMonth: 3, totalEarnings: 680000, pendingCommission: 142000, referredBy: 'CP001', referrals: ['CP004'], joinedDate: '2022-08-10', influencerScore: 78, sharesThisMonth: 22, leadsFromSocial: 5 },
  { id: 'CP003', name: 'Mohammed Salim', email: 'salim@cpconnect.in', phone: '9800034567', city: 'Secunderabad', tier: 'Gold', totalDeals: 35, dealsThisMonth: 4, totalEarnings: 920000, pendingCommission: 185000, referrals: ['CP006', 'CP008'], joinedDate: '2022-01-20', influencerScore: 81, sharesThisMonth: 18, leadsFromSocial: 4 },
  { id: 'CP004', name: 'Lakshmi Reddy', email: 'lakshmi@cpconnect.in', phone: '9800045678', city: 'Hyderabad', tier: 'Silver', totalDeals: 14, dealsThisMonth: 1, totalEarnings: 310000, pendingCommission: 68000, referredBy: 'CP002', referrals: [], joinedDate: '2023-02-28', influencerScore: 55, sharesThisMonth: 8, leadsFromSocial: 2 },
  { id: 'CP005', name: 'Suresh Babu', email: 'suresh@cpconnect.in', phone: '9800056789', city: 'Hyderabad', tier: 'Platinum', totalDeals: 62, dealsThisMonth: 5, totalEarnings: 1850000, pendingCommission: 320000, referrals: [], joinedDate: '2021-11-05', influencerScore: 95, sharesThisMonth: 45, leadsFromSocial: 12 },
  { id: 'CP006', name: 'Anita Joshi', email: 'anita@cpconnect.in', phone: '9800067890', city: 'Pune', tier: 'Silver', totalDeals: 9, dealsThisMonth: 1, totalEarnings: 195000, pendingCommission: 42000, referredBy: 'CP003', referrals: [], joinedDate: '2023-06-12', influencerScore: 42, sharesThisMonth: 5, leadsFromSocial: 1 },
  { id: 'CP007', name: 'Kiran Naidu', email: 'kiran@cpconnect.in', phone: '9800078901', city: 'Hyderabad', tier: 'Gold', totalDeals: 22, dealsThisMonth: 2, totalEarnings: 540000, pendingCommission: 98000, referredBy: 'CP001', referrals: [], joinedDate: '2022-12-01', influencerScore: 71, sharesThisMonth: 15, leadsFromSocial: 3 },
  { id: 'CP008', name: 'Deepa Menon', email: 'deepa@cpconnect.in', phone: '9800089012', city: 'Bengaluru', tier: 'Silver', totalDeals: 11, dealsThisMonth: 1, totalEarnings: 248000, pendingCommission: 55000, referredBy: 'CP003', referrals: [], joinedDate: '2023-04-18', influencerScore: 48, sharesThisMonth: 6, leadsFromSocial: 2 },
];
