export const investmentOpportunities = [
  { id: 'INV001', name: 'NRE Fixed Deposit', category: 'Banking', returnMin: 6.5, returnMax: 7.5, lockInYears: 1, minAmount: 10000, risk: 'Very Low' as const, repatriable: true, taxFree: true, description: 'NRE FD is tax-free in India and fully repatriable. Start immediately.', howItWorks: ['Open NRE FD at any Indian bank', 'Lock in for 1–5 years at competitive rates', 'Interest is tax-free and fully repatriable'] },
  { id: 'INV002', name: 'EV Charging Stations', category: 'Infrastructure', returnMin: 15, returnMax: 22, lockInYears: 3, minAmount: 200000, risk: 'Medium' as const, repatriable: true, taxFree: false, description: 'India has 5 million EVs and only 12,000 charging points. Massive undersupply. Revenue from per-charge fees.', howItWorks: ['Invest in EV charging infrastructure', 'Operators manage daily operations', 'Earn revenue from per-charge fees'] },
  { id: 'INV003', name: 'Retail Space Leasing', category: 'Real Estate', returnMin: 8, returnMax: 12, lockInYears: 5, minAmount: 1000000, risk: 'Low-Medium' as const, repatriable: true, taxFree: false, description: 'Buy a small retail shop in a new township. Dealio manages the tenant. Rent credited monthly.', howItWorks: ['Purchase retail space in upcoming townships', 'We find and manage tenants', 'Monthly rent credited to your account'] },
  { id: 'INV004', name: 'Co-working Space', category: 'Real Estate', returnMin: 10, returnMax: 15, lockInYears: 2, minAmount: 300000, risk: 'Medium' as const, repatriable: true, taxFree: false, description: "India's co-working market is growing 35% YoY. Invest in managed co-working desks in Hyderabad IT corridors.", howItWorks: ['Invest in co-working desk units', 'Professional operators manage bookings', 'Revenue from desk rental fees'] },
  { id: 'INV005', name: 'Solar Rooftop Commercial', category: 'Energy', returnMin: 14, returnMax: 18, lockInYears: 5, minAmount: 150000, risk: 'Low' as const, repatriable: true, taxFree: false, description: 'Install solar panels on commercial rooftops. Earn from power units sold + government subsidy. Zero maintenance.', howItWorks: ['Fund solar panel installation', 'Earn from power units sold to buildings', 'Government subsidies boost returns'] },
  { id: 'INV006', name: 'Fractional CRE', category: 'Real Estate', returnMin: 12, returnMax: 16, lockInYears: 3, minAmount: 500000, risk: 'Low-Medium' as const, repatriable: true, taxFree: false, description: 'Own a fraction of Grade A office space leased to MNCs. Monthly rental income proportional to your share.', howItWorks: ['Buy fractional ownership in Grade A offices', 'MNC tenants provide stable rental income', 'SEBI-regulated structure for safety'] },
  { id: 'INV007', name: 'Student Housing / PG', category: 'Real Estate', returnMin: 10, returnMax: 14, lockInYears: 2, minAmount: 800000, risk: 'Medium' as const, repatriable: true, taxFree: false, description: 'India has 40 million students, 30% live in PGs. Buy a PG room unit. Dealio manages everything.', howItWorks: ['Invest in student housing units', 'We manage bookings and collections', 'Monthly rent credited to your account'] },
  { id: 'INV008', name: 'Cold Storage Units', category: 'Infrastructure', returnMin: 16, returnMax: 20, lockInYears: 5, minAmount: 500000, risk: 'Medium-High' as const, repatriable: true, taxFree: false, description: 'India wastes 40% of food due to cold chain gaps. Invest in cold storage infrastructure with government-backed contracts.', howItWorks: ['Fund cold storage facility construction', 'Long-term government-backed contracts', 'Revenue from storage fees'] },
  { id: 'INV009', name: 'Medical Equipment Leasing', category: 'Healthcare', returnMin: 15, returnMax: 18, lockInYears: 3, minAmount: 300000, risk: 'Medium' as const, repatriable: true, taxFree: false, description: 'Lease medical equipment to private clinics and nursing homes. Healthcare demand is recession-proof.', howItWorks: ['Fund medical equipment purchase', 'Equipment leased to clinics/hospitals', 'Monthly lease payments guaranteed'] },
  { id: 'INV010', name: 'Warehouse / Logistics', category: 'Infrastructure', returnMin: 12, returnMax: 15, lockInYears: 5, minAmount: 1000000, risk: 'Low' as const, repatriable: true, taxFree: false, description: 'E-commerce needs 3x more warehouse space by 2028. Own a small warehouse unit leased to logistics companies.', howItWorks: ['Purchase warehouse unit', 'Leased to logistics/e-commerce companies', 'Backed by 3–5 year contracts'] },
];

export const nriProperties = [
  {
    id: 'PROP001',
    name: 'My Home Avatar — Tower C, Unit 1204',
    purchasePrice: 22000000,
    currentValue: 25200000,
    status: 'Tenanted' as const,
    tenant: { name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@email.com', aadhaar: '****1234', company: 'TCS', leaseStart: '2024-07-01', leaseEnd: '2026-03-31', monthlyRent: 28500, deposit: 57000 },
    manager: 'Ravi Kumar (CP)',
    rentLedger: [
      { month: 'Jan 2025', due: 28500, received: '2025-01-01', amount: 28500, status: 'Paid' as const },
      { month: 'Dec 2024', due: 28500, received: '2024-12-02', amount: 28500, status: 'Paid' as const },
      { month: 'Nov 2024', due: 28500, received: '2024-11-04', amount: 28500, status: 'Late' as const },
      { month: 'Oct 2024', due: 28500, received: '2024-10-01', amount: 28500, status: 'Paid' as const },
      { month: 'Sep 2024', due: 28500, received: '2024-09-01', amount: 28500, status: 'Paid' as const },
      { month: 'Aug 2024', due: 28500, received: '2024-08-03', amount: 28500, status: 'Paid' as const },
      { month: 'Jul 2024', due: 28500, received: '2024-07-01', amount: 28500, status: 'Paid' as const },
    ],
    maintenance: [
      { id: 'M001', category: 'Plumbing', description: 'Bathroom tap leaking', date: '2024-12-10', status: 'Resolved' as const, cost: 1500, vendor: 'QuickFix Services' },
      { id: 'M002', category: 'Electrical', description: 'MCB tripping in kitchen', date: '2025-01-05', status: 'In Progress' as const, cost: 0, vendor: 'Pending Assignment' },
    ],
    totalRentEarned: 342000,
    possessionDate: '2024-07-01',
  }
];

export const customerInvestments = [
  { id: 'CI001', customerId: 'CUST001', investmentId: 'INV002', name: 'EV Charging Station', amountInvested: 200000, monthlyReturn: 2800, totalEarned: 5600, status: 'Active' as const, startDate: '2024-11-01', maturityDate: '2027-11-01' }
];
