export interface SocialPost {
  id: string;
  projectId: string;
  projectName: string;
  caption: string;
  hashtags: string[];
  platforms: ('instagram' | 'facebook' | 'linkedin' | 'whatsapp')[];
  status: 'Draft' | 'Scheduled' | 'Published' | 'Failed';
  scheduledAt?: string;
  publishedAt?: string;
  reach?: number;
  leads?: number;
  engagement?: number;
  image?: string;
  cpId: string;
  fromLibrary: boolean;
}

export interface ContentLibraryItem {
  id: string;
  projectId: string;
  projectName: string;
  builderName: string;
  type: 'Image' | 'Video' | 'Carousel' | 'Story';
  caption: string;
  hashtags: string[];
  imageUrl: string;
  approved: boolean;
  uploadedAt: string;
}

export interface BroadcastSequence {
  id: string;
  name: string;
  segment: string;
  messages: { day: number; template: string; sent: number; replied: number }[];
  status: 'Active' | 'Paused' | 'Completed';
  totalRecipients: number;
  startedAt: string;
}

export const contentLibrary: ContentLibraryItem[] = [
  { id: 'CL001', projectId: 'P001', projectName: 'Prestige Skyline', builderName: 'Prestige Group', type: 'Image', caption: 'Luxury living redefined at Prestige Skyline. 3 & 4 BHK apartments in Gachibowli.', hashtags: ['#PrestigeSkyline', '#LuxuryLiving', '#Hyderabad', '#Gachibowli'], imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600', approved: true, uploadedAt: '2025-01-15' },
  { id: 'CL002', projectId: 'P003', projectName: 'My Home Avatar', builderName: 'My Home Group', type: 'Carousel', caption: 'Step into the future of living. My Home Avatar at Tellapur offers world-class amenities.', hashtags: ['#MyHomeAvatar', '#Tellapur', '#DreamHome'], imageUrl: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=600', approved: true, uploadedAt: '2025-01-12' },
  { id: 'CL003', projectId: 'P006', projectName: 'Mahindra Happinest', builderName: 'Mahindra Lifespaces', type: 'Story', caption: '🎉 NEW LAUNCH! Mahindra Happinest — Starting ₹38L. Book now!', hashtags: ['#NewLaunch', '#MahindraHappinest', '#AffordableHomes'], imageUrl: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600', approved: true, uploadedAt: '2025-01-18' },
  { id: 'CL004', projectId: 'P002', projectName: 'Sobha Meridian', builderName: 'Sobha Ltd', type: 'Image', caption: 'Last 22 units left! Don\'t miss Sobha Meridian at Kondapur.', hashtags: ['#SobhaMeridian', '#ClosingSoon', '#Kondapur'], imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600', approved: true, uploadedAt: '2025-01-10' },
];

export const socialPosts: SocialPost[] = [
  { id: 'SP001', projectId: 'P001', projectName: 'Prestige Skyline', caption: 'Luxury living redefined at Prestige Skyline 🏙️', hashtags: ['#PrestigeSkyline', '#LuxuryLiving'], platforms: ['instagram', 'facebook'], status: 'Published', publishedAt: '2025-01-18T10:30:00', reach: 4520, leads: 12, engagement: 340, image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600', cpId: 'CP001', fromLibrary: true },
  { id: 'SP002', projectId: 'P006', projectName: 'Mahindra Happinest', caption: '🎉 NEW LAUNCH alert! Starting ₹38L only', hashtags: ['#NewLaunch', '#MahindraHappinest'], platforms: ['instagram', 'facebook', 'linkedin'], status: 'Published', publishedAt: '2025-01-15T14:00:00', reach: 8900, leads: 28, engagement: 670, image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600', cpId: 'CP001', fromLibrary: true },
  { id: 'SP003', projectId: 'P003', projectName: 'My Home Avatar', caption: 'Premium 4BHK homes at Tellapur starting ₹1.1Cr', hashtags: ['#MyHomeAvatar', '#PremiumLiving'], platforms: ['instagram'], status: 'Scheduled', scheduledAt: '2025-01-22T09:00:00', cpId: 'CP001', fromLibrary: true },
];

export const broadcastSequences: BroadcastSequence[] = [
  { id: 'BS001', name: 'New Launch — Mahindra Happinest', segment: 'All Leads (Hyderabad)', messages: [{ day: 1, template: 'Hi {{name}}, exciting new launch! Mahindra Happinest starting ₹38L. Interested?', sent: 1240, replied: 185 }, { day: 3, template: 'Hi {{name}}, have you checked out Mahindra Happinest? Only {{units}} units left!', sent: 1055, replied: 92 }, { day: 7, template: '{{name}}, last chance! Book a free site visit to Mahindra Happinest this weekend.', sent: 963, replied: 68 }], status: 'Active', totalRecipients: 1240, startedAt: '2025-01-15' },
  { id: 'BS002', name: 'Sobha Meridian Closing Soon', segment: 'Hot Leads (Kondapur)', messages: [{ day: 1, template: 'Hi {{name}}, only 22 units left at Sobha Meridian! 2% commission. Act fast!', sent: 320, replied: 88 }, { day: 3, template: '{{name}}, Sobha Meridian closing this month. Book now or miss out!', sent: 232, replied: 45 }], status: 'Completed', totalRecipients: 320, startedAt: '2025-01-10' },
];

export const socialAnalytics = {
  platforms: [
    { name: 'Instagram', posts: 24, reach: 45200, leads: 68, engagement: 3420, roi: 2.8 },
    { name: 'Facebook', posts: 18, reach: 32100, leads: 42, engagement: 1890, roi: 2.1 },
    { name: 'LinkedIn', posts: 8, reach: 12400, leads: 15, engagement: 920, roi: 1.5 },
    { name: 'WhatsApp', posts: 32, reach: 8900, leads: 95, engagement: 4500, roi: 4.2 },
  ],
  monthlyTrend: [
    { month: 'Oct', reach: 18000, leads: 32 },
    { month: 'Nov', reach: 24500, leads: 48 },
    { month: 'Dec', reach: 31200, leads: 62 },
    { month: 'Jan', reach: 45200, leads: 95 },
  ],
};
