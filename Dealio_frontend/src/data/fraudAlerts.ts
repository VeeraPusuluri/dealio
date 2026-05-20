export type FraudType = 'Duplicate Lead' | 'Commission Manipulation' | 'Multiple Bookings' | 'Fake Referral' | 'Identity Mismatch';
export type FraudStatus = 'Open' | 'Under Review' | 'Resolved' | 'False Positive';

export interface FraudAlert {
  id: string;
  type: FraudType;
  affectedUser: string;
  affectedRole: string;
  project: string;
  amountAtRisk: number;
  riskScore: number;
  dateDetected: string;
  status: FraudStatus;
  description: string;
  involvedParties: { name: string; role: string }[];
  timeline: { date: string; event: string }[];
  evidence: string[];
}

export const fraudAlerts: FraudAlert[] = [
  { id: 'FR001', type: 'Duplicate Lead', affectedUser: 'Lakshmi Reddy', affectedRole: 'cp', project: 'Mahindra Happinest', amountAtRisk: 90000, riskScore: 72, dateDetected: '2025-01-15', status: 'Open', description: 'Lead for Kavitha Rao submitted by both CP004 (Lakshmi Reddy) and CP005 (Suresh Babu) within 48 hours for the same project.', involvedParties: [{ name: 'Lakshmi Reddy', role: 'CP' }, { name: 'Suresh Babu', role: 'CP' }, { name: 'Kavitha Rao', role: 'Customer' }], timeline: [{ date: '2025-01-08', event: 'Lead L006 submitted by CP004' }, { date: '2025-01-10', event: 'Lead L010 submitted by CP005 for same customer' }, { date: '2025-01-15', event: 'Duplicate detected by system' }], evidence: ['Same customer phone number', 'Same project and unit type', 'IP addresses from different locations'] },
  { id: 'FR002', type: 'Commission Manipulation', affectedUser: 'Kiran Naidu', affectedRole: 'cp', project: 'Sobha Meridian', amountAtRisk: 176000, riskScore: 85, dateDetected: '2025-01-12', status: 'Under Review', description: 'CP007 (Kiran Naidu) modified sale value in commission claim CM006. Original sale value was ₹82L but claimed as ₹88L.', involvedParties: [{ name: 'Kiran Naidu', role: 'CP' }, { name: 'Naresh Kumar', role: 'Customer' }], timeline: [{ date: '2025-01-07', event: 'Sale registered at ₹82L' }, { date: '2025-01-08', event: 'Commission claim submitted at ₹88L' }, { date: '2025-01-12', event: 'Discrepancy flagged' }], evidence: ['Sale agreement shows ₹82,00,000', 'Commission claim shows ₹88,00,000', 'Builder confirmed ₹82L'] },
  { id: 'FR003', type: 'Fake Referral', affectedUser: 'Deepa Menon', affectedRole: 'cp', project: 'Prestige Skyline', amountAtRisk: 50000, riskScore: 45, dateDetected: '2025-01-18', status: 'Open', description: 'Referral bonus claimed for CP008 by CP003. However, CP008 registered 2 months before CP003 suggested referral date.', involvedParties: [{ name: 'Mohammed Salim', role: 'CP' }, { name: 'Deepa Menon', role: 'CP' }], timeline: [{ date: '2023-04-18', event: 'CP008 registered' }, { date: '2025-01-18', event: 'Referral bonus claimed by CP003' }], evidence: ['Registration date mismatch', 'No referral code used during signup'] },
  { id: 'FR004', type: 'Multiple Bookings', affectedUser: 'Vijay Anand', affectedRole: 'customer', project: 'Prestige Skyline', amountAtRisk: 275000, riskScore: 62, dateDetected: '2025-01-16', status: 'Resolved', description: 'Customer attempted to book same unit through two different CPs for price comparison. Resolved — one booking cancelled.', involvedParties: [{ name: 'Vijay Anand', role: 'Customer' }, { name: 'Ravi Kumar', role: 'CP' }], timeline: [{ date: '2025-01-14', event: 'Booking via CP001' }, { date: '2025-01-15', event: 'Second booking attempt via CP003' }, { date: '2025-01-16', event: 'Detected and resolved' }], evidence: ['Same Aadhaar number on both bookings', 'Same unit number A-1504'] },
  { id: 'FR005', type: 'Identity Mismatch', affectedUser: 'Suresh Babu', affectedRole: 'cp', project: 'Incor Carmel Heights', amountAtRisk: 220500, riskScore: 38, dateDetected: '2025-01-14', status: 'False Positive', description: 'PAN name mismatch for CP005. PAN shows "S. Babu Rao" vs registered name "Suresh Babu". Verified — abbreviated name on PAN.', involvedParties: [{ name: 'Suresh Babu', role: 'CP' }], timeline: [{ date: '2025-01-14', event: 'Auto-flagged by KYC system' }, { date: '2025-01-14', event: 'Manual review — confirmed same person' }], evidence: ['PAN: S. Babu Rao', 'Registration: Suresh Babu', 'Aadhaar matches registered name'] },
];

export const duplicateLeads = [
  { customer: 'Kavitha Rao', project: 'Mahindra Happinest', firstCP: 'Lakshmi Reddy', firstDate: '2025-01-08', secondCP: 'Suresh Babu', secondDate: '2025-01-10', status: 'Unresolved' as const },
  { customer: 'Meera Krishnan', project: 'Prestige Skyline', firstCP: 'Mohammed Salim', firstDate: '2025-01-18', secondCP: 'Priya Sharma', secondDate: '2025-01-19', status: 'Unresolved' as const },
];
