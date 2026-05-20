export interface AILeadInsight {
  leadId: string;
  leadName: string;
  phone: string;
  score: number;
  label: 'Hot' | 'Warm' | 'Cold';
  signals: string[];
  nextBestAction: string;
  lastContact: string;
  daysSinceContact: number;
  projectInterest: string;
  responseTime: string;
  pageViews: number;
  tourViews: number;
}

export interface PriceRecommendation {
  projectId: string;
  projectName: string;
  currentPriceSqft: number;
  recommendedPriceSqft: number;
  comparables: { name: string; location: string; priceSqft: number; distance: string }[];
  reasoning: string;
}

export const aiLeadInsights: AILeadInsight[] = [
  { leadId: 'L001', leadName: 'Rahul Sharma', phone: '9876543210', score: 92, label: 'Hot', signals: ['Viewed project 8 times in 3 days', 'Responded to message in 2 min', 'Downloaded brochure', 'Requested site visit'], nextBestAction: 'Call Rahul today — last contact was 4 days ago. He viewed Prestige Skyline 3 times yesterday.', lastContact: '2025-01-14', daysSinceContact: 4, projectInterest: 'Prestige Skyline', responseTime: '2 min avg', pageViews: 24, tourViews: 3 },
  { leadId: 'L002', leadName: 'Priya Reddy', phone: '9876543211', score: 78, label: 'Hot', signals: ['Viewed 3 projects', 'Asked about loan eligibility', 'Compared unit prices'], nextBestAction: 'Share loan pre-approval offer. Priya is comparing options — a competitive rate could close the deal.', lastContact: '2025-01-16', daysSinceContact: 2, projectInterest: 'Sobha Meridian', responseTime: '15 min avg', pageViews: 18, tourViews: 2 },
  { leadId: 'L003', leadName: 'Vikram Patel', phone: '9876543212', score: 61, label: 'Warm', signals: ['Site visit completed', 'Asked for payment plan', 'No follow-up response yet'], nextBestAction: 'Send payment plan PDF for My Home Avatar. Vikram visited the site 5 days ago but hasn\'t responded since.', lastContact: '2025-01-13', daysSinceContact: 5, projectInterest: 'My Home Avatar', responseTime: '1 hr avg', pageViews: 10, tourViews: 1 },
  { leadId: 'L004', leadName: 'Sneha Kulkarni', phone: '9876543213', score: 45, label: 'Warm', signals: ['Viewed 1 project page', 'Opened WhatsApp broadcast'], nextBestAction: 'Send a project comparison with 2–3 options in her budget range. Sneha needs more information before deciding.', lastContact: '2025-01-17', daysSinceContact: 1, projectInterest: 'Mahindra Happinest', responseTime: '3 hr avg', pageViews: 4, tourViews: 0 },
  { leadId: 'L005', leadName: 'Arjun Mehta', phone: '9876543214', score: 22, label: 'Cold', signals: ['No activity in 14 days', 'Didn\'t open last 2 messages'], nextBestAction: 'Move to nurture sequence. Send a market update or new project alert to re-engage.', lastContact: '2025-01-04', daysSinceContact: 14, projectInterest: 'Aparna Sarovar', responseTime: 'No response', pageViews: 2, tourViews: 0 },
  { leadId: 'L006', leadName: 'Meera Iyer', phone: '9876543215', score: 85, label: 'Hot', signals: ['Requested callback', 'Viewed virtual tour twice', 'Asked about possession date'], nextBestAction: 'Schedule a video call today — Meera is ready to discuss pricing. Share the latest offer.', lastContact: '2025-01-17', daysSinceContact: 1, projectInterest: 'Incor Carmel Heights', responseTime: '5 min avg', pageViews: 15, tourViews: 4 },
];

export const priceRecommendations: PriceRecommendation[] = [
  { projectId: 'P001', projectName: 'Prestige Skyline', currentPriceSqft: 6800, recommendedPriceSqft: 7200, comparables: [{ name: 'Phoenix One Bangalore West', location: 'Gachibowli', priceSqft: 7500, distance: '1.2 km' }, { name: 'Rajapushpa Atria', location: 'Gachibowli', priceSqft: 7100, distance: '2.1 km' }, { name: 'Lodha Bellezza', location: 'Kukatpally', priceSqft: 6400, distance: '4.5 km' }], reasoning: 'Prestige Skyline is priced 6% below comparable projects within a 5 km radius. Given strong demand (68 units sold in 3 months) and upcoming metro connectivity, a 5.9% price increase to ₹7,200/sqft is justified.' },
];

export const aiDescriptionTemplates = [
  { id: 'DESC001', projectId: 'P001', language: 'English', description: 'Discover unparalleled luxury at Prestige Skyline, nestled in the heart of Gachibowli, Hyderabad\'s thriving IT hub. These meticulously crafted 3 & 4 BHK apartments offer panoramic city views, world-class amenities, and seamless connectivity to major tech parks. With RERA approval and possession by Dec 2025, your dream home awaits.' },
  { id: 'DESC002', projectId: 'P001', language: 'Hindi', description: 'गचिबोवली, हैदराबाद के प्रतिष्ठित आईटी हब में स्थित प्रेस्टीज स्काईलाइन में अद्वितीय विलासिता का अनुभव करें। 3 और 4 BHK अपार्टमेंट, शानदार शहर का दृश्य, विश्वस्तरीय सुविधाएं और प्रमुख टेक पार्कों से उत्कृष्ट कनेक्टिविटी।' },
];
