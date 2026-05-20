export interface ServiceVendor {
  id: string;
  name: string;
  category: string;
  rating: number;
  priceRange: string;
  description: string;
  verified: boolean;
  leadFee: number;
  cities: string[];
  portfolioImages: string[];
}

export const services: ServiceVendor[] = [
  { id: 'SV001', name: 'DesignCraft Interiors', category: 'Interior Design', rating: 4.8, priceRange: '₹800–1,800/sqft', description: 'Premium interior design solutions with 3D visualization and turnkey execution.', verified: true, leadFee: 1500, cities: ['Hyderabad', 'Bengaluru'], portfolioImages: [] },
  { id: 'SV002', name: 'BuildRight Contractors', category: 'Civil Work', rating: 4.6, priceRange: '₹1,200–2,200/sqft', description: 'Civil work, renovations, and structural modifications with licensed engineers.', verified: true, leadFee: 2000, cities: ['Hyderabad', 'Secunderabad'], portfolioImages: [] },
  { id: 'SV003', name: 'Asian Paints Colourworld', category: 'Painting', rating: 4.7, priceRange: '₹18–35/sqft', description: 'Professional painting services with premium Asian Paints products.', verified: true, leadFee: 500, cities: ['Hyderabad', 'Pune', 'Mumbai'], portfolioImages: [] },
  { id: 'SV004', name: 'EasyMove Packers', category: 'Packers & Movers', rating: 4.4, priceRange: '₹8,000–35,000', description: 'Safe and secure packing, moving, and unpacking services across India.', verified: true, leadFee: 400, cities: ['Hyderabad', 'Bengaluru', 'Chennai'], portfolioImages: [] },
  { id: 'SV005', name: 'SolarPower Homes', category: 'Solar Installation', rating: 4.9, priceRange: '₹45,000–2,50,000', description: 'Rooftop solar panel installation with 25-year warranty and net metering.', verified: true, leadFee: 3000, cities: ['Hyderabad', 'Pune'], portfolioImages: [] },
  { id: 'SV006', name: 'AquaPure Solutions', category: 'Water Purifier & AMC', rating: 4.5, priceRange: '₹6,000–25,000', description: 'RO/UV water purifier installation and annual maintenance contracts.', verified: true, leadFee: 300, cities: ['Hyderabad', 'Bengaluru', 'Mumbai', 'Chennai'], portfolioImages: [] },
];
