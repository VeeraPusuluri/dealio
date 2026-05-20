export interface Project {
  id: string;
  name: string;
  builder: string;
  location: string;
  city: string;
  bhkTypes: string[];
  totalUnits: number;
  available: number;
  booked: number;
  sold: number;
  priceRange: [number, number];
  commissionPercent: number;
  status: 'Active' | 'Closing Soon' | 'New Launch';
  rera: string;
  image: string;
  amenities: string[];
  possessionDate: string;
}

export const projects: Project[] = [
  {
    id: 'P001', name: 'Prestige Skyline', builder: 'Prestige Group', location: 'Gachibowli', city: 'Hyderabad',
    bhkTypes: ['3BHK', '4BHK'], totalUnits: 240, available: 68, booked: 42, sold: 130,
    priceRange: [8500000, 14000000], commissionPercent: 2.5, status: 'Active',
    rera: 'P02400003456', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600',
    amenities: ['Swimming Pool', 'Gym', 'Club House', "Children's Play Area", 'Jogging Track'],
    possessionDate: 'Dec 2025',
  },
  {
    id: 'P002', name: 'Sobha Meridian', builder: 'Sobha Ltd', location: 'Kondapur', city: 'Hyderabad',
    bhkTypes: ['2BHK', '3BHK'], totalUnits: 180, available: 22, booked: 38, sold: 120,
    priceRange: [6500000, 9500000], commissionPercent: 2, status: 'Closing Soon',
    rera: 'P02400004521', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600',
    amenities: ['Swimming Pool', 'Gym', 'Amphitheatre', 'Library'],
    possessionDate: 'Mar 2025',
  },
  {
    id: 'P003', name: 'My Home Avatar', builder: 'My Home Group', location: 'Tellapur', city: 'Hyderabad',
    bhkTypes: ['3BHK', '4BHK', '5BHK'], totalUnits: 320, available: 145, booked: 65, sold: 110,
    priceRange: [11000000, 28000000], commissionPercent: 3, status: 'Active',
    rera: 'P02400005678', image: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=600',
    amenities: ['Swimming Pool', 'Gym', 'Club House', "Children's Play Area", 'Tennis Court', 'Mini Theatre'],
    possessionDate: 'Sep 2025',
  },
  {
    id: 'P004', name: 'Aparna Sarovar', builder: 'Aparna Constructions', location: 'Nallagandla', city: 'Hyderabad',
    bhkTypes: ['2BHK', '3BHK'], totalUnits: 150, available: 10, booked: 20, sold: 120,
    priceRange: [5500000, 7800000], commissionPercent: 1.75, status: 'Closing Soon',
    rera: 'P02400006789', image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=600',
    amenities: ['Swimming Pool', 'Gym', 'Banquet Hall'],
    possessionDate: 'Jan 2025',
  },
  {
    id: 'P005', name: 'Incor Carmel Heights', builder: 'Incor Infrastructure', location: 'Miyapur', city: 'Hyderabad',
    bhkTypes: ['3BHK'], totalUnits: 200, available: 90, booked: 30, sold: 80,
    priceRange: [7200000, 10500000], commissionPercent: 2.25, status: 'Active',
    rera: 'P02400007890', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600',
    amenities: ['Swimming Pool', 'Gym', 'Club House', 'Badminton Court'],
    possessionDate: 'Jun 2026',
  },
  {
    id: 'P006', name: 'Mahindra Happinest', builder: 'Mahindra Lifespaces', location: 'Kompally', city: 'Hyderabad',
    bhkTypes: ['2BHK'], totalUnits: 300, available: 210, booked: 55, sold: 35,
    priceRange: [3800000, 5200000], commissionPercent: 2, status: 'New Launch',
    rera: 'P02400008901', image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600',
    amenities: ['Swimming Pool', 'Gym', "Children's Play Area", 'Landscaped Gardens'],
    possessionDate: 'Dec 2026',
  },
];
