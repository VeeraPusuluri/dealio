export const nriProfiles = [
  {
    id: 'NRI001',
    name: 'Arjun Mehta',
    email: 'nri@cpconnect.in',
    country: 'UAE',
    city: 'Dubai',
    timezone: 'GST',
    currency: 'AED',
    phone: '+971501234567',
    occupation: 'Software Engineer',
    employer: 'Emirates NBD',
    monthlyIncomeForeign: 25000,
    monthlyIncomeINR: 567500,
    nreAccountBank: 'HDFC Bank',
    panNumber: 'ARJPM1234K',
    assignedCPId: 'CP001',
    assignedCPName: 'Ravi Kumar',
    shortlistedProjects: ['P001', 'P003'],
    interestedBHK: ['3BHK', '4BHK'],
    budgetINR: { min: 8500000, max: 15000000 },
    purpose: 'Investment + Family Home',
    poaStatus: 'Verified',
    poaNomineeName: 'Suresh Mehta (Brother)',
    consultationCount: 3,
    documentsUploaded: 6,
  }
];

export const currencyRates: Record<string, number> = {
  INR: 1,
  USD: 0.01198,
  AED: 0.04405,
  GBP: 0.00943,
  SGD: 0.01613,
  AUD: 0.01852,
  CAD: 0.01634,
  EUR: 0.01102,
};

export const currencySymbols: Record<string, string> = {
  INR: '₹', USD: '$', AED: 'AED ', GBP: '£', SGD: 'S$', AUD: 'A$', CAD: 'C$', EUR: '€'
};

export const nriCountries = [
  { name: 'UAE', flag: '🇦🇪', currency: 'AED', timezone: 'GST', offset: 4 },
  { name: 'USA', flag: '🇺🇸', currency: 'USD', timezone: 'EST', offset: -5 },
  { name: 'UK', flag: '🇬🇧', currency: 'GBP', timezone: 'GMT', offset: 0 },
  { name: 'Singapore', flag: '🇸🇬', currency: 'SGD', timezone: 'SGT', offset: 8 },
  { name: 'Australia', flag: '🇦🇺', currency: 'AUD', timezone: 'AEDT', offset: 11 },
  { name: 'Canada', flag: '🇨🇦', currency: 'CAD', timezone: 'EST', offset: -5 },
  { name: 'Germany', flag: '🇩🇪', currency: 'EUR', timezone: 'CET', offset: 1 },
];

export const nriConsultations = [
  { id: 'CON001', date: '2025-01-20', timeIST: '2:00 PM', cpName: 'Ravi Kumar', project: 'Prestige Skyline', type: 'Google Meet', link: 'https://meet.google.com/abc-defg-hij', status: 'Confirmed' as const, notes: 'Discuss 3BHK options and loan process' },
  { id: 'CON002', date: '2025-01-15', timeIST: '11:00 AM', cpName: 'Ravi Kumar', project: 'My Home Avatar', type: 'Zoom', link: 'https://zoom.us/j/123456789', status: 'Completed' as const, notes: 'Virtual tour done. Customer wants pricing sheet.' },
];

export const nriDocuments = [
  { id: 'ND001', name: 'Passport (UAE)', status: 'Verified' as const, uploadedDate: '2025-01-05', type: 'Identity' },
  { id: 'ND002', name: 'NRE Account Statement — 6 months', status: 'Verified' as const, uploadedDate: '2025-01-05', type: 'Financial' },
  { id: 'ND003', name: 'Salary Slips — 3 months (AED)', status: 'Verified' as const, uploadedDate: '2025-01-06', type: 'Income' },
  { id: 'ND004', name: 'Employment Contract', status: 'Verified' as const, uploadedDate: '2025-01-06', type: 'Income' },
  { id: 'ND005', name: 'PAN Card', status: 'Verified' as const, uploadedDate: '2025-01-07', type: 'Identity' },
  { id: 'ND006', name: 'Overseas Address Proof', status: 'Verified' as const, uploadedDate: '2025-01-07', type: 'Address' },
  { id: 'ND007', name: 'Form 15CA / CB', status: 'Pending' as const, uploadedDate: null, type: 'Tax' },
  { id: 'ND008', name: 'Power of Attorney (executed)', status: 'Verified' as const, uploadedDate: '2025-01-08', type: 'Legal' },
];

export const nriPoaData = {
  nriName: 'Arjun Mehta',
  nriPassport: 'Z1234567',
  nriCountry: 'UAE',
  nomineeName: 'Suresh Mehta',
  nomineeRelation: 'Brother',
  nomineePhone: '9876543210',
  nomineePAN: 'SURM5678K',
  nomineeAddress: '12, MG Road, Hyderabad 500001',
  poaType: 'Specific POA',
  scope: ['Sign sale agreement', 'Make payments', 'Register property', 'Handle loan disbursement'],
  executedDate: '2025-01-08',
  apostilleStatus: 'Completed',
  platformStatus: 'Verified',
};
