import { create } from 'zustand';

export type InteriorLeadStatus = 'New' | 'Contacted' | 'Quote Sent' | 'Confirmed' | 'In Progress' | 'Completed';

export const interiorStatusColors: Record<InteriorLeadStatus, string> = {
  'New': '#0EA5E9',
  'Contacted': '#6366F1',
  'Quote Sent': '#F59E0B',
  'Confirmed': '#10B981',
  'In Progress': '#E87722',
  'Completed': '#16A34A',
};

export interface InteriorThreadEvent {
  id: string;
  type: 'property' | 'referral' | 'note' | 'quote' | 'accepted' | 'work_started' | 'completed';
  sender: string;
  senderRole: string;
  content: string;
  timestamp: string;
  attachment?: string;
}

export interface InteriorThread {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  projectId: string;
  projectName: string;
  unit: string;
  tower: string;
  sqft: number;
  possessionDate?: string;
  vendorId: string;
  vendorName: string;
  cpId?: string;
  cpName?: string;
  builderId?: string;
  builderName?: string;
  leadSource: 'CP Referral' | 'Builder Conversion';
  serviceInterest: string[];
  status: InteriorLeadStatus;
  quoteAmount?: number;
  rating?: number;
  events: InteriorThreadEvent[];
  createdAt: string;
}

const initialInteriorThreads: InteriorThread[] = [
  {
    id: 'IT001',
    customerId: 'C004', customerName: 'Arjun Reddy', customerPhone: '9876543212',
    projectId: 'P003', projectName: 'My Home Avatar', unit: '1204', tower: 'C', sqft: 2800,
    vendorId: 'SV001', vendorName: 'DesignCraft Interiors',
    cpId: 'CP001', cpName: 'Ravi Kumar',
    builderId: 'B001', builderName: 'My Home Group',
    leadSource: 'CP Referral',
    serviceInterest: ['Full Interior', 'Modular Kitchen', 'False Ceiling'],
    status: 'Quote Sent',
    quoteAmount: 450000,
    events: [
      { id: 'IE001', type: 'property', sender: 'System', senderRole: 'system', content: 'Property details added: My Home Avatar, Tower C, Unit 1204, 2800 sqft', timestamp: '2025-01-19T10:00:00' },
      { id: 'IE002', type: 'referral', sender: 'Ravi Kumar', senderRole: 'cp', content: 'Lead referred by CP Ravi Kumar (Platinum tier)', timestamp: '2025-01-19T10:05:00' },
      { id: 'IE003', type: 'note', sender: 'DesignCraft Interiors', senderRole: 'vendor', content: 'Site visit scheduled for Jan 22, 10 AM', timestamp: '2025-01-20T14:30:00' },
      { id: 'IE004', type: 'quote', sender: 'DesignCraft Interiors', senderRole: 'vendor', content: 'Quote sent: ₹4,50,000 for 2,800 sqft full interior package', timestamp: '2025-01-22T16:00:00' },
    ],
    createdAt: '2025-01-19',
  },
  {
    id: 'IT002',
    customerId: 'C006', customerName: 'Naresh Kumar', customerPhone: '9876543216',
    projectId: 'P002', projectName: 'Sobha Meridian', unit: 'B-804', tower: 'B', sqft: 1650,
    vendorId: 'SV001', vendorName: 'DesignCraft Interiors',
    builderId: 'B002', builderName: 'Sobha Ltd',
    leadSource: 'Builder Conversion',
    serviceInterest: ['Modular Kitchen', 'Wardrobe', 'Painting'],
    status: 'In Progress',
    quoteAmount: 285000,
    events: [
      { id: 'IE010', type: 'property', sender: 'System', senderRole: 'system', content: 'Property details added: Sobha Meridian, Tower B, Unit 804, 1650 sqft', timestamp: '2025-01-10T10:00:00' },
      { id: 'IE011', type: 'referral', sender: 'Sobha Ltd', senderRole: 'builder', content: 'Converted from sale by Sobha Ltd', timestamp: '2025-01-10T10:05:00' },
      { id: 'IE012', type: 'quote', sender: 'DesignCraft Interiors', senderRole: 'vendor', content: 'Quote sent: ₹2,85,000 for kitchen + wardrobe + painting', timestamp: '2025-01-12T11:00:00' },
      { id: 'IE013', type: 'accepted', sender: 'Naresh Kumar', senderRole: 'customer', content: 'Customer accepted quote', timestamp: '2025-01-14T09:00:00' },
      { id: 'IE014', type: 'work_started', sender: 'DesignCraft Interiors', senderRole: 'vendor', content: 'Work started on Jan 16', timestamp: '2025-01-16T10:00:00' },
    ],
    createdAt: '2025-01-10',
  },
];

interface InteriorState {
  threads: InteriorThread[];
  addThread: (thread: InteriorThread) => void;
  updateStatus: (id: string, status: InteriorLeadStatus) => void;
  addEvent: (threadId: string, event: InteriorThreadEvent) => void;
}

export const useInteriorStore = create<InteriorState>((set) => ({
  threads: initialInteriorThreads,
  addThread: (thread) => set((state) => ({ threads: [...state.threads, thread] })),
  updateStatus: (id, status) =>
    set((state) => ({
      threads: state.threads.map((t) => (t.id === id ? { ...t, status } : t)),
    })),
  addEvent: (threadId, event) =>
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, events: [...t.events, event] } : t
      ),
    })),
}));
