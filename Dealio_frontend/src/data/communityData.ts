export interface CommunityNotice {
  id: string;
  type: 'Deal' | 'Event' | 'Maintenance';
  title: string;
  body: string;
  date: string;
}

export interface GroupDeal {
  id: string;
  vendorId: string;
  vendorName: string;
  offer: string;
  minFlats: number;
  deadline: string;
  interested: number;
}

export interface Community {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  totalFlats: number;
  optedInMembers: number;
  cpAdminId: string;
  cpAdminName: string;
  notices: CommunityNotice[];
  groupDeals: GroupDeal[];
}

export const communities: Community[] = [
  {
    id: 'COM001',
    name: 'My Home Avatar — Tower C Owners',
    projectId: 'P003',
    projectName: 'My Home Avatar',
    totalFlats: 120,
    optedInMembers: 98,
    cpAdminId: 'CP001',
    cpAdminName: 'Ravi Kumar',
    notices: [
      { id: 'N001', type: 'Deal', title: 'Group Painting Deal', body: 'Asian Paints offering 15% discount for 10+ flat bookings. Register by Jan 30.', date: '2025-01-15' },
      { id: 'N002', type: 'Event', title: 'Clubhouse Inauguration', body: 'Join us for the clubhouse inauguration on Feb 1st at 6 PM. Snacks and entertainment arranged.', date: '2025-01-18' },
      { id: 'N003', type: 'Maintenance', title: 'Elevator Maintenance', body: 'Tower C elevators 1 & 2 will be under maintenance on Jan 25th from 10 AM to 4 PM.', date: '2025-01-20' },
    ],
    groupDeals: [
      { id: 'GD001', vendorId: 'SV001', vendorName: 'DesignCraft Interiors', offer: '12% off for 5+ flat bookings', minFlats: 5, deadline: '2025-02-15', interested: 8 },
      { id: 'GD002', vendorId: 'SV006', vendorName: 'AquaPure Solutions', offer: 'Free installation + 1 year AMC', minFlats: 10, deadline: '2025-02-28', interested: 14 },
    ],
  },
];
