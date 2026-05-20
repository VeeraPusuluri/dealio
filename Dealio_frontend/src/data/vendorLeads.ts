export type VendorLeadStatus = 'New' | 'Accepted' | 'In Progress' | 'Completed' | 'Rejected';

export interface VendorLead {
  id: string;
  customerName: string;
  phone: string;
  project: string;
  unit: string;
  source: 'CP Referral' | 'Community' | 'Direct';
  dateReceived: string;
  budgetRange?: string;
  status: VendorLeadStatus;
  scopeOfWork?: string;
}

export const vendorLeads: VendorLead[] = [
  { id: 'VL001', customerName: 'Rahul Singh', phone: '9800111222', project: 'My Home Avatar', unit: '4BHK Tower C-1204', source: 'CP Referral', dateReceived: '2025-01-15', budgetRange: '₹18–25L', status: 'New', scopeOfWork: 'Full interior design for 4BHK — living room, 4 bedrooms, kitchen, bathrooms' },
  { id: 'VL002', customerName: 'Naresh Kumar', phone: '9876543216', project: 'Sobha Meridian', unit: '3BHK B-804', source: 'Community', dateReceived: '2025-01-12', budgetRange: '₹12–18L', status: 'Accepted', scopeOfWork: 'Modular kitchen, false ceiling, wardrobes' },
  { id: 'VL003', customerName: 'Vijay Anand', phone: '9876543210', project: 'Prestige Skyline', unit: '3BHK A-1504', source: 'CP Referral', dateReceived: '2025-01-10', budgetRange: '₹15–20L', status: 'In Progress', scopeOfWork: 'Complete interior including flooring, painting, electrical' },
  { id: 'VL004', customerName: 'Kavitha Rao', phone: '9800222333', project: 'Mahindra Happinest', unit: '2BHK E-108', source: 'Direct', dateReceived: '2025-01-08', budgetRange: '₹8–12L', status: 'Completed', scopeOfWork: 'Basic interior — painting, false ceiling, modular kitchen' },
  { id: 'VL005', customerName: 'Arjun Reddy', phone: '9876543212', project: 'My Home Avatar', unit: '4BHK C-1204', source: 'CP Referral', dateReceived: '2025-01-18', budgetRange: '₹25–35L', status: 'New', scopeOfWork: 'Premium interior with imported materials' },
  { id: 'VL006', customerName: 'Sneha Patel', phone: '9876543211', project: 'Sobha Meridian', unit: '2BHK B-602', source: 'Community', dateReceived: '2025-01-05', status: 'Rejected', scopeOfWork: 'Basic painting only' },
];

export interface Quote {
  id: string;
  leadId: string;
  customerName: string;
  project: string;
  amount: number;
  dateSent: string;
  status: 'Sent' | 'Viewed' | 'Accepted' | 'Rejected';
  items: { scope: string; description: string; qty: number; unit: string; rate: number; total: number }[];
  materialGrade: 'Basic' | 'Standard' | 'Premium';
  validityDate: string;
}

export const quotes: Quote[] = [
  { id: 'Q001', leadId: 'VL002', customerName: 'Naresh Kumar', project: 'Sobha Meridian', amount: 1450000, dateSent: '2025-01-14', status: 'Viewed', items: [{ scope: 'Modular Kitchen', description: 'L-shaped modular kitchen with granite top', qty: 1, unit: 'set', rate: 450000, total: 450000 }, { scope: 'False Ceiling', description: 'Gypsum false ceiling with LED cove lighting', qty: 850, unit: 'sqft', rate: 120, total: 102000 }, { scope: 'Wardrobes', description: 'Sliding door wardrobes — 3 bedrooms', qty: 3, unit: 'nos', rate: 299000, total: 897000 }], materialGrade: 'Standard', validityDate: '2025-02-14' },
  { id: 'Q002', leadId: 'VL003', customerName: 'Vijay Anand', project: 'Prestige Skyline', amount: 1820000, dateSent: '2025-01-12', status: 'Accepted', items: [{ scope: 'Living Room', description: 'Custom TV unit, sofa set, accent wall', qty: 1, unit: 'lot', rate: 380000, total: 380000 }, { scope: 'Flooring', description: 'Italian marble flooring', qty: 1800, unit: 'sqft', rate: 280, total: 504000 }, { scope: 'Painting', description: 'Full home premium emulsion', qty: 2800, unit: 'sqft', rate: 28, total: 78400 }, { scope: 'Electrical', description: 'Concealed wiring, switches, fixtures', qty: 1, unit: 'lot', rate: 185000, total: 185000 }, { scope: 'False Ceiling', description: 'Designer false ceiling all rooms', qty: 1400, unit: 'sqft', rate: 145, total: 203000 }, { scope: 'Modular Kitchen', description: 'U-shaped premium modular kitchen', qty: 1, unit: 'set', rate: 470000, total: 470000 }], materialGrade: 'Premium', validityDate: '2025-02-12' },
  { id: 'Q003', leadId: 'VL004', customerName: 'Kavitha Rao', project: 'Mahindra Happinest', amount: 920000, dateSent: '2025-01-10', status: 'Accepted', items: [{ scope: 'Painting', description: 'Full home painting', qty: 1600, unit: 'sqft', rate: 22, total: 35200 }, { scope: 'False Ceiling', description: 'POP false ceiling living + bedrooms', qty: 600, unit: 'sqft', rate: 95, total: 57000 }, { scope: 'Modular Kitchen', description: 'Straight modular kitchen', qty: 1, unit: 'set', rate: 320000, total: 320000 }, { scope: 'Wardrobes', description: 'Hinged wardrobes — 2 bedrooms', qty: 2, unit: 'nos', rate: 245000, total: 490000 }], materialGrade: 'Basic', validityDate: '2025-02-10' },
];
