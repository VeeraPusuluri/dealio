export type LandStatus = 'Active' | 'Under Review' | 'Closed';
export type TitleStatus = 'Clear' | 'Under Verification' | 'Disputed';
export type DealPreference = 'JV' | 'Outright Sale' | 'Open to Both';

export interface LandListing {
  id: string;
  ownerName: string;
  ownerId: string;
  location: string;
  city: string;
  area: number;
  areaUnit: 'acres' | 'sq yards';
  zoneType: 'Residential' | 'Commercial' | 'Mixed';
  titleStatus: TitleStatus;
  dealPreference: DealPreference;
  jvTerms?: string;
  askingPrice?: number;
  status: LandStatus;
  buildersInterested: number;
  documents: { name: string; uploaded: boolean }[];
  listedDate: string;
}

export interface BuilderInterest {
  id: string;
  landId: string;
  builderName: string;
  company: string;
  status: 'Interested' | 'NDA Signed' | 'EOI Received' | 'Negotiating';
  proposedTerms?: string;
  dateExpressed: string;
}

export const landListings: LandListing[] = [
  {
    id: 'LD001', ownerName: 'Rajendra Prasad', ownerId: 'LO001', location: 'Kokapet', city: 'Hyderabad',
    area: 2.5, areaUnit: 'acres', zoneType: 'Residential', titleStatus: 'Clear',
    dealPreference: 'JV', jvTerms: '40:60 (Owner:Builder)', status: 'Active', buildersInterested: 3,
    documents: [{ name: 'Title Deed', uploaded: true }, { name: 'Encumbrance Certificate', uploaded: true }, { name: 'Layout Approval', uploaded: true }],
    listedDate: '2024-12-01',
  },
  {
    id: 'LD002', ownerName: 'Srinivas Rao', ownerId: 'LO002', location: 'Adibatla', city: 'Hyderabad',
    area: 4.1, areaUnit: 'acres', zoneType: 'Mixed', titleStatus: 'Clear',
    dealPreference: 'Outright Sale', askingPrice: 82000000, status: 'Active', buildersInterested: 1,
    documents: [{ name: 'Title Deed', uploaded: true }, { name: 'Encumbrance Certificate', uploaded: true }, { name: 'Layout Approval', uploaded: false }],
    listedDate: '2025-01-05',
  },
  {
    id: 'LD003', ownerName: 'Padma Lakshmi', ownerId: 'LO003', location: 'Shamshabad', city: 'Hyderabad',
    area: 6.8, areaUnit: 'acres', zoneType: 'Commercial', titleStatus: 'Under Verification',
    dealPreference: 'JV', jvTerms: '50:50', status: 'Under Review', buildersInterested: 0,
    documents: [{ name: 'Title Deed', uploaded: true }, { name: 'Encumbrance Certificate', uploaded: false }],
    listedDate: '2025-01-15',
  },
];

export const builderInterests: BuilderInterest[] = [
  { id: 'BI001', landId: 'LD001', builderName: 'Rajesh Mehta', company: 'Prestige Group', status: 'NDA Signed', proposedTerms: 'JV 40:60, premium villas project', dateExpressed: '2024-12-15' },
  { id: 'BI002', landId: 'LD001', builderName: 'Sunil Kapoor', company: 'Sobha Ltd', status: 'EOI Received', proposedTerms: 'JV 35:65, mixed-use township', dateExpressed: '2024-12-20' },
  { id: 'BI003', landId: 'LD001', builderName: 'Vikram Singh', company: 'My Home Group', status: 'Interested', dateExpressed: '2025-01-08' },
  { id: 'BI004', landId: 'LD002', builderName: 'Anand Sharma', company: 'Aparna Constructions', status: 'Interested', proposedTerms: 'Outright purchase at ₹7.8Cr', dateExpressed: '2025-01-12' },
];
