export type MeetingType = 'Site Visit' | 'Builder Meeting' | 'Document Review';
export type MeetingStatus = 'Upcoming' | 'Completed' | 'Cancelled';

export interface Meeting {
  id: string;
  project: string;
  type: MeetingType;
  date: string;
  time: string;
  location: string;
  status: MeetingStatus;
  rating?: number;
  review?: string;
}

export const initialMeetings: Meeting[] = [
  { id: 'MT001', project: 'My Home Avatar', type: 'Site Visit', date: '2025-01-25', time: '10:00 AM', location: 'My Home Avatar Sales Gallery, Tellapur', status: 'Upcoming' },
  { id: 'MT002', project: 'My Home Avatar', type: 'Document Review', date: '2025-01-15', time: '2:00 PM', location: 'My Home Group Office, Jubilee Hills', status: 'Completed', rating: 4, review: 'Very helpful session, all documents reviewed thoroughly.' },
  { id: 'MT004', project: 'My Home Avatar', type: 'Builder Meeting', date: '2025-01-30', time: '3:00 PM', location: 'My Home Group Office, Jubilee Hills', status: 'Upcoming' },
];

export const timeSlots = ['10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
