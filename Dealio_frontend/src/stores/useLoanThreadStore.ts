import { create } from 'zustand';

export type LoanThreadStatus = 'Applied' | 'Documents Submitted' | 'Under Review' | 'Sanctioned' | 'Disbursed' | 'Rejected';

export const loanThreadStatusColors: Record<LoanThreadStatus, string> = {
  'Applied': '#3B82F6',
  'Documents Submitted': '#6366F1',
  'Under Review': '#F59E0B',
  'Sanctioned': '#0A7E8C',
  'Disbursed': '#16A34A',
  'Rejected': '#DC2626',
};

export interface LoanThreadEvent {
  id: string;
  type: 'property' | 'cp_joined' | 'customer_profile' | 'loan_initiated' | 'document' | 'status_update' | 'note';
  sender: string;
  senderRole: 'builder' | 'cp' | 'customer' | 'bank' | 'system';
  content: string;
  timestamp: string;
  attachment?: string;
}

export interface LoanThread {
  id: string;
  // Property
  projectId: string;
  projectName: string;
  tower: string;
  unit: string;
  floor: number;
  unitType: string;
  carpetArea?: number;
  saleValue: number;
  bookingAmount?: number;
  possessionDate?: string;
  // Customer
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerDob?: string;
  panNumber?: string;
  aadhaarLast4?: string;
  employmentType?: 'Salaried' | 'Self-Employed' | 'Business Owner' | 'Retired' | 'NRI';
  company?: string;
  monthlyIncome?: number;
  experience?: number;
  existingEmis?: number;
  cibilScore?: number;
  // CP
  cpId?: string;
  cpName?: string;
  cpTier?: string;
  cpCommission?: number;
  // Builder
  builderId?: string;
  builderName?: string;
  // Bank & Loan
  bank: string;
  loanAmount: number;
  tenure: number;
  loanType: 'Home Purchase' | 'Construction' | 'Plot + Construction' | 'Balance Transfer';
  interestRate?: number;
  emi?: number;
  officerName?: string;
  officerPhone?: string;
  // Status
  status: LoanThreadStatus;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  unreadUpdates: number;
  // Documents
  documents: { name: string; uploaded: boolean; required: boolean; category: string }[];
  // Timeline
  events: LoanThreadEvent[];
}

const initialLoanThreads: LoanThread[] = [
  {
    id: 'LT001',
    projectId: 'P003', projectName: 'My Home Avatar', tower: 'C', unit: '1204', floor: 12, unitType: '4BHK',
    carpetArea: 2800, saleValue: 22000000, bookingAmount: 2200000, possessionDate: 'Sep 2025',
    customerId: 'C001', customerName: 'Rahul Singh', customerPhone: '9800111222', customerEmail: 'rahul@email.com',
    customerDob: '1990-05-15', panNumber: 'ABCDE1234F', aadhaarLast4: '7890',
    employmentType: 'Salaried', company: 'TCS', monthlyIncome: 180000, experience: 8, cibilScore: 785,
    cpId: 'CP001', cpName: 'Ravi Kumar', cpTier: 'Platinum', cpCommission: 3,
    builderId: 'B001', builderName: 'My Home Group',
    bank: 'HDFC', loanAmount: 16500000, tenure: 20, loanType: 'Home Purchase',
    interestRate: 8.65, emi: 138500, officerName: 'Ramesh Babu', officerPhone: '9800001234',
    status: 'Disbursed', createdBy: 'Ravi Kumar', createdByRole: 'cp', createdAt: '2024-12-22',
    unreadUpdates: 0,
    documents: [
      { name: 'Aadhaar Card', uploaded: true, required: true, category: 'KYC' },
      { name: 'PAN Card', uploaded: true, required: true, category: 'KYC' },
      { name: 'Salary Slips (3 months)', uploaded: true, required: true, category: 'Income' },
      { name: 'Bank Statement (6 months)', uploaded: true, required: true, category: 'Income' },
      { name: 'Form 16 (2 years)', uploaded: true, required: true, category: 'Income' },
      { name: 'ITR (2 years)', uploaded: true, required: true, category: 'Income' },
      { name: 'Allotment Letter', uploaded: true, required: true, category: 'Property' },
      { name: 'Builder-Buyer Agreement', uploaded: true, required: true, category: 'Property' },
      { name: 'NOC from Builder', uploaded: true, required: true, category: 'Property' },
      { name: 'RERA Certificate', uploaded: true, required: true, category: 'Property' },
    ],
    events: [
      { id: 'LE001', type: 'property', sender: 'My Home Group', senderRole: 'builder', content: 'Project: My Home Avatar, Tower C, Unit 1204, 2800 sqft, ₹2,20,00,000', timestamp: '2024-12-22T09:00:00' },
      { id: 'LE002', type: 'cp_joined', sender: 'Ravi Kumar', senderRole: 'cp', content: 'CP joined thread — Platinum tier, 3% commission', timestamp: '2024-12-22T09:05:00' },
      { id: 'LE003', type: 'customer_profile', sender: 'Ravi Kumar', senderRole: 'cp', content: 'Customer: Rahul Singh, Salaried at TCS, ₹1.8L/month, CIBIL 785', timestamp: '2024-12-22T09:10:00' },
      { id: 'LE004', type: 'loan_initiated', sender: 'System', senderRole: 'system', content: 'Loan application initiated — HDFC Bank, ₹1,65,00,000, 20 year tenure', timestamp: '2024-12-22T10:00:00' },
      { id: 'LE005', type: 'document', sender: 'Rahul Singh', senderRole: 'customer', content: 'Uploaded: Aadhaar Card, PAN Card', timestamp: '2024-12-23T11:00:00' },
      { id: 'LE006', type: 'document', sender: 'Rahul Singh', senderRole: 'customer', content: 'Uploaded: Salary Slips, Bank Statements, Form 16', timestamp: '2024-12-24T14:00:00' },
      { id: 'LE007', type: 'status_update', sender: 'Ramesh Babu', senderRole: 'bank', content: 'Status: Applied → Under Review', timestamp: '2024-12-26T10:00:00' },
      { id: 'LE008', type: 'note', sender: 'Ramesh Babu', senderRole: 'bank', content: 'All documents verified. Proceeding to sanction committee.', timestamp: '2024-12-30T16:00:00' },
      { id: 'LE009', type: 'status_update', sender: 'Ramesh Babu', senderRole: 'bank', content: 'Status: Under Review → Sanctioned. Rate: 8.65%, EMI: ₹1,38,500', timestamp: '2025-01-02T11:00:00' },
      { id: 'LE010', type: 'status_update', sender: 'Ramesh Babu', senderRole: 'bank', content: 'Status: Sanctioned → Disbursed. Amount credited to builder account.', timestamp: '2025-01-10T15:00:00' },
    ],
  },
  {
    id: 'LT002',
    projectId: 'P006', projectName: 'Mahindra Happinest', tower: 'E', unit: '204', floor: 2, unitType: '2BHK',
    carpetArea: 950, saleValue: 4500000, bookingAmount: 450000,
    customerId: 'C005', customerName: 'Kavitha Rao', customerPhone: '9800222333', customerEmail: 'kavitha@email.com',
    employmentType: 'Salaried', company: 'Infosys', monthlyIncome: 85000,
    cpId: 'CP004', cpName: 'Lakshmi Reddy', cpTier: 'Silver', cpCommission: 2,
    bank: 'SBI', loanAmount: 3800000, tenure: 15, loanType: 'Home Purchase',
    interestRate: 8.25, emi: 36800, officerName: 'Sunita Devi', officerPhone: '9800002345',
    status: 'Sanctioned', createdBy: 'Lakshmi Reddy', createdByRole: 'cp', createdAt: '2025-01-05',
    unreadUpdates: 1,
    documents: [
      { name: 'Aadhaar Card', uploaded: true, required: true, category: 'KYC' },
      { name: 'PAN Card', uploaded: true, required: true, category: 'KYC' },
      { name: 'Salary Slips (3 months)', uploaded: true, required: true, category: 'Income' },
      { name: 'Bank Statement (6 months)', uploaded: true, required: true, category: 'Income' },
      { name: 'Form 16 (2 years)', uploaded: true, required: true, category: 'Income' },
      { name: 'Allotment Letter', uploaded: false, required: true, category: 'Property' },
    ],
    events: [
      { id: 'LE020', type: 'loan_initiated', sender: 'System', senderRole: 'system', content: 'Loan application initiated — SBI, ₹38,00,000', timestamp: '2025-01-05T10:00:00' },
      { id: 'LE021', type: 'status_update', sender: 'Sunita Devi', senderRole: 'bank', content: 'Status: Applied → Sanctioned. Rate 8.25%', timestamp: '2025-01-16T14:00:00' },
    ],
  },
  {
    id: 'LT003',
    projectId: 'P002', projectName: 'Sobha Meridian', tower: 'A', unit: '505', floor: 5, unitType: '3BHK',
    saleValue: 8800000,
    customerId: 'C006', customerName: 'Naresh Kumar', customerPhone: '9876543216', customerEmail: 'naresh@email.com',
    employmentType: 'Self-Employed', company: 'Kumar Enterprises', monthlyIncome: 250000,
    cpId: 'CP007', cpName: 'Kiran Naidu', cpTier: 'Gold',
    bank: 'ICICI', loanAmount: 5500000, tenure: 20, loanType: 'Home Purchase',
    interestRate: 8.9, emi: 51200, officerName: 'Vikram Jain', officerPhone: '9800003456',
    status: 'Under Review', createdBy: 'Kiran Naidu', createdByRole: 'cp', createdAt: '2025-01-10',
    unreadUpdates: 2,
    documents: [
      { name: 'Aadhaar Card', uploaded: true, required: true, category: 'KYC' },
      { name: 'PAN Card', uploaded: true, required: true, category: 'KYC' },
      { name: 'ITR (3 years)', uploaded: true, required: true, category: 'Income' },
      { name: 'Balance Sheet & P&L (3 years)', uploaded: false, required: true, category: 'Income' },
      { name: 'GST Certificate', uploaded: true, required: true, category: 'Income' },
    ],
    events: [
      { id: 'LE030', type: 'loan_initiated', sender: 'System', senderRole: 'system', content: 'Loan application initiated — ICICI, ₹55,00,000', timestamp: '2025-01-10T10:00:00' },
      { id: 'LE031', type: 'document', sender: 'Naresh Kumar', senderRole: 'customer', content: 'Uploaded: Aadhaar, PAN, ITR, GST Certificate', timestamp: '2025-01-11T11:00:00' },
      { id: 'LE032', type: 'status_update', sender: 'Vikram Jain', senderRole: 'bank', content: 'Status: Applied → Under Review', timestamp: '2025-01-14T10:00:00' },
      { id: 'LE033', type: 'note', sender: 'Vikram Jain', senderRole: 'bank', content: 'Balance Sheet & P&L still pending. Requested from customer.', timestamp: '2025-01-15T14:00:00' },
    ],
  },
  {
    id: 'LT004',
    projectId: 'P001', projectName: 'Prestige Skyline', tower: 'B', unit: '702', floor: 7, unitType: '3BHK',
    saleValue: 9500000,
    customerId: 'C007', customerName: 'Meena Krishnan', customerPhone: '9876543213', customerEmail: 'meena@email.com',
    employmentType: 'Salaried', company: 'Wipro', monthlyIncome: 120000,
    cpId: 'CP003', cpName: 'Mohammed Salim', cpTier: 'Gold',
    bank: 'Axis', loanAmount: 7200000, tenure: 20, loanType: 'Home Purchase',
    officerName: 'Anil Kumar', officerPhone: '9800004567',
    status: 'Applied', createdBy: 'Mohammed Salim', createdByRole: 'cp', createdAt: '2025-01-14',
    unreadUpdates: 0,
    documents: [
      { name: 'Aadhaar Card', uploaded: true, required: true, category: 'KYC' },
      { name: 'PAN Card', uploaded: true, required: true, category: 'KYC' },
      { name: 'Salary Slips (3 months)', uploaded: true, required: true, category: 'Income' },
      { name: 'Bank Statement (6 months)', uploaded: true, required: true, category: 'Income' },
      { name: 'Form 16 (2 years)', uploaded: false, required: true, category: 'Income' },
    ],
    events: [
      { id: 'LE040', type: 'loan_initiated', sender: 'System', senderRole: 'system', content: 'Loan application initiated — Axis Bank, ₹72,00,000', timestamp: '2025-01-14T10:00:00' },
    ],
  },
];

interface LoanThreadState {
  threads: LoanThread[];
  addThread: (thread: LoanThread) => void;
  updateStatus: (id: string, status: LoanThreadStatus, note?: string, updatedBy?: string) => void;
  addEvent: (threadId: string, event: LoanThreadEvent) => void;
  uploadDocument: (threadId: string, docName: string) => void;
}

export const useLoanThreadStore = create<LoanThreadState>((set) => ({
  threads: initialLoanThreads,
  addThread: (thread) => set((state) => ({ threads: [...state.threads, thread] })),
  updateStatus: (id, status, note, updatedBy) =>
    set((state) => ({
      threads: state.threads.map((t) => {
        if (t.id !== id) return t;
        const event: LoanThreadEvent = {
          id: `LE${Date.now()}`,
          type: 'status_update',
          sender: updatedBy || 'System',
          senderRole: 'bank',
          content: `Status: ${t.status} → ${status}${note ? `. ${note}` : ''}`,
          timestamp: new Date().toISOString(),
        };
        return { ...t, status, events: [...t.events, event] };
      }),
    })),
  addEvent: (threadId, event) =>
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, events: [...t.events, event] } : t
      ),
    })),
  uploadDocument: (threadId, docName) =>
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId
          ? { ...t, documents: t.documents.map((d) => (d.name === docName ? { ...d, uploaded: true } : d)) }
          : t
      ),
    })),
}));
