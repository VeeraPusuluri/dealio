export type DealStatus = 'Enquiry' | 'Meeting Requested' | 'Meeting Confirmed' | 'Meeting Completed' | 'Negotiation' | 'Interested - Loan Required' | 'Booked' | 'Loan Applied' | 'Loan Processing' | 'Loan Sanctioned' | 'Loan Disbursed' | 'Registration Done' | 'Possession Given' | 'Closed';

export interface DealMessage {
  id: string;
  dealId: string;
  senderId: string;
  senderName: string;
  senderRole: 'builder' | 'cp' | 'customer' | 'bank' | 'nri';
  message: string;
  attachment?: { name: string; type: string };
  timestamp: string;
}

export interface DealDocument {
  id: string;
  dealId: string;
  name: string;
  category: 'KYC' | 'Agreement' | 'Payment' | 'NOC' | 'Sanction' | 'Disbursement' | 'Other';
  uploadedBy: string;
  uploadedByRole: string;
  uploadedAt: string;
  sharedWith: string[];
}

export interface DealActivity {
  id: string;
  dealId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  timestamp: string;
  details?: string;
}

export interface MeetingRequest {
  id: string;
  dealId?: string;
  cpId: string;
  cpName: string;
  builderId: string;
  builderName: string;
  projectId: string;
  projectName: string;
  customerName: string;
  customerPhone: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Follow-up Required';
  confirmedDate?: string;
  confirmedTime?: string;
  builderNotes?: string;
  createdAt: string;
}

export interface LoanCase {
  id: string;
  dealId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  projectId: string;
  projectName: string;
  unitType: string;
  loanAmount: number;
  propertyValue: number;
  employmentType: string;
  builderId: string;
  builderName: string;
  bankOfficerId?: string;
  bankOfficerName?: string;
  status: 'Active' | 'Sanctioned' | 'Disbursed' | 'Rejected';
  isNRI: boolean;
  loanType?: string;
  milestones: LoanMilestone[];
  submittedAt: string;
}

export interface LoanMilestone {
  id: string;
  stage: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  completedDate?: string;
  notes?: string;
}

export const loanMilestoneStages = [
  'Application Received',
  'Document Collection',
  'Credit Verification',
  'Property Valuation',
  'Sanction Letter Issued',
  'Agreement Signed',
  'Disbursement — Stage 1',
  'Disbursement — Final',
];

export interface Deal {
  id: string;
  builderId: string;
  builderName: string;
  cpId: string;
  cpName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  projectId: string;
  projectName: string;
  unitId?: string;
  unitType: string;
  status: DealStatus;
  dealValue?: number;
  commissionType?: 'fixed' | 'percent';
  commissionValue?: number;
  commissionStatus?: 'Pending' | 'Approved' | 'Paid';
  loanCaseId?: string;
  isNRI: boolean;
  messages: DealMessage[];
  documents: DealDocument[];
  activities: DealActivity[];
  createdAt: string;
  updatedAt: string;
}


export type ProjectPublishStatus = 'Draft' | 'Under Review' | 'Published';

export interface ShareEvent {
  id: string;
  cpId: string;
  projectId: string;
  projectName: string;
  sharedWith: string;
  sharedVia: 'WhatsApp' | 'SMS' | 'Email';
  timestamp: string;
}
