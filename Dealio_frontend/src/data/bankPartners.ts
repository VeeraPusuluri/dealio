export interface BankPartner {
  id: string;
  name: string;
  interestRateRange: [number, number];
  totalReferrals: number;
  sanctioned: number;
  disbursed: number;
  totalVolume: number;
  feePerLoan: number;
  pendingFees: number;
}

export const bankPartners: BankPartner[] = [
  { id: 'BK001', name: 'HDFC Bank', interestRateRange: [8.40, 9.20], totalReferrals: 28, sanctioned: 22, disbursed: 18, totalVolume: 124000000, feePerLoan: 5000, pendingFees: 30000 },
  { id: 'BK002', name: 'SBI', interestRateRange: [8.25, 8.75], totalReferrals: 15, sanctioned: 11, disbursed: 8, totalVolume: 52000000, feePerLoan: 4500, pendingFees: 18000 },
  { id: 'BK003', name: 'ICICI Bank', interestRateRange: [8.55, 9.40], totalReferrals: 19, sanctioned: 14, disbursed: 10, totalVolume: 78000000, feePerLoan: 5000, pendingFees: 25000 },
];
