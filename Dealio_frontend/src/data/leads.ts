export type LeadStage = 'New Lead' | 'Meeting Requested' | 'Meeting Confirmed' | 'Meeting Done' | 'Negotiation' | 'Booked' | 'Closed';

export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  projectId: string;
  projectName: string;
  unitType: string;
  cpId: string;
  cpName: string;
  budget: number;
  stage: LeadStage;
  meetingDate?: string;
  meetingTime?: string;
  visitType?: string;
  notes: string;
  source: string;
  createdAt: string;
  daysInStage: number;
}

export const leadStageColors: Record<LeadStage, string> = {
  'New Lead': '#0EA5E9',
  'Meeting Requested': '#6366F1',
  'Meeting Confirmed': '#8B5CF6',
  'Meeting Done': '#EC4899',
  'Negotiation': '#F59E0B',
  'Booked': '#10B981',
  'Closed': '#16A34A',
};

