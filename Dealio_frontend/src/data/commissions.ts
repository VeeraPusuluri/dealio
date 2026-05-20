export type CommissionStatus = 'Pending' | 'Processing' | 'Released';

export interface Commission {
  id: string;
  cpId: string;
  cpName: string;
  projectId: string;
  projectName: string;
  unit: string;
  customerName: string;
  saleValue: number;
  commissionPercent: number;
  amount: number;
  status: CommissionStatus;
  expectedDate: string;
  releasedDate?: string;
  referralBonus?: number;
}

export const commissionStatusColors: Record<CommissionStatus, string> = {
  Pending: '#F59E0B',
  Processing: '#3B82F6',
  Released: '#16A34A',
};

