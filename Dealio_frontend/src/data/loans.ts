export type LoanStatus = 'Applied' | 'Documents Pending' | 'Processing' | 'Sanctioned' | 'Disbursed';

export interface Loan {
  id: string;
  customerName: string;
  phone: string;
  projectId: string;
  projectName: string;
  unitType: string;
  loanAmount: number;
  bank: string;
  status: LoanStatus;
  officerName?: string;
  officerPhone?: string;
  interestRate?: number;
  tenure?: number;
  emi?: number;
  appliedDate: string;
  sanctionedDate?: string;
  disbursedDate?: string;
  missingDocs?: string[];
  documents: { name: string; uploaded: boolean }[];
}

export const loanStatusColors: Record<LoanStatus, string> = {
  'Applied': '#3B82F6',
  'Documents Pending': '#DC2626',
  'Processing': '#F59E0B',
  'Sanctioned': '#0A7E8C',
  'Disbursed': '#16A34A',
};

export const initialLoans: Loan[] = [
  {
    id: 'LN001', customerName: 'Rahul Singh', phone: '9800111222', projectId: 'P003', projectName: 'My Home Avatar', unitType: '4BHK',
    loanAmount: 16500000, bank: 'HDFC', status: 'Disbursed', officerName: 'Ramesh Babu', officerPhone: '9800001234',
    interestRate: 8.65, tenure: 20, emi: 138500, appliedDate: '2024-12-22', sanctionedDate: '2025-01-02', disbursedDate: '2025-01-10',
    documents: [
      { name: 'Aadhaar Card', uploaded: true }, { name: 'PAN Card', uploaded: true },
      { name: 'Salary Slips (3 months)', uploaded: true }, { name: 'Bank Statements (6 months)', uploaded: true },
      { name: 'Form 16', uploaded: true }, { name: 'Property Documents', uploaded: true },
    ],
  },
  {
    id: 'LN002', customerName: 'Kavitha Rao', phone: '9800222333', projectId: 'P006', projectName: 'Mahindra Happinest', unitType: '2BHK',
    loanAmount: 3800000, bank: 'SBI', status: 'Sanctioned', officerName: 'Sunita Devi', officerPhone: '9800002345',
    interestRate: 8.25, tenure: 15, emi: 36800, appliedDate: '2025-01-05', sanctionedDate: '2025-01-16',
    documents: [
      { name: 'Aadhaar Card', uploaded: true }, { name: 'PAN Card', uploaded: true },
      { name: 'Salary Slips (3 months)', uploaded: true }, { name: 'Bank Statements (6 months)', uploaded: true },
      { name: 'Form 16', uploaded: true },
    ],
  },
  {
    id: 'LN003', customerName: 'Naresh Goud', phone: '9800333444', projectId: 'P002', projectName: 'Sobha Meridian', unitType: '3BHK',
    loanAmount: 5500000, bank: 'ICICI', status: 'Processing', officerName: 'Vikram Jain', officerPhone: '9800003456',
    interestRate: 8.9, tenure: 20, emi: 51200, appliedDate: '2025-01-10',
    documents: [
      { name: 'Aadhaar Card', uploaded: true }, { name: 'PAN Card', uploaded: true },
      { name: 'Salary Slips (3 months)', uploaded: true }, { name: 'Bank Statements (6 months)', uploaded: true },
      { name: 'Form 16', uploaded: true },
    ],
  },
  {
    id: 'LN004', customerName: 'Meena Krishnan', phone: '9800444555', projectId: 'P001', projectName: 'Prestige Skyline', unitType: '3BHK',
    loanAmount: 7200000, bank: 'Axis', status: 'Documents Pending', officerName: 'Anil Kumar', officerPhone: '9800004567',
    appliedDate: '2025-01-14', missingDocs: ['Form 16'],
    documents: [
      { name: 'Aadhaar Card', uploaded: true }, { name: 'PAN Card', uploaded: true },
      { name: 'Salary Slips (3 months)', uploaded: true }, { name: 'Bank Statements (6 months)', uploaded: true },
      { name: 'Form 16', uploaded: false },
    ],
  },
  {
    id: 'LN005', customerName: 'Sneha Patel', phone: '9800555666', projectId: 'P002', projectName: 'Sobha Meridian', unitType: '2BHK',
    loanAmount: 6000000, bank: 'HDFC', status: 'Applied', appliedDate: '2025-01-18',
    documents: [
      { name: 'Aadhaar Card', uploaded: true }, { name: 'PAN Card', uploaded: true },
      { name: 'Salary Slips (3 months)', uploaded: false }, { name: 'Bank Statements (6 months)', uploaded: false },
    ],
  },
];
