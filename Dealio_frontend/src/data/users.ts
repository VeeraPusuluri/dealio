import { UserRole } from '@/stores/useAuthStore';

export type KYCStatus = 'Verified' | 'Pending' | 'Rejected';
export type UserStatus = 'Active' | 'Pending KYC' | 'Suspended';

export interface PlatformUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  city: string;
  registeredDate: string;
  kycStatus: KYCStatus;
  userStatus: UserStatus;
  lastLogin: string;
  documents: { name: string; uploaded: boolean; verified: boolean }[];
  activityLog: { date: string; action: string }[];
}

export const platformUsers: PlatformUser[] = [
  { id: 'U001', name: 'Prestige Group', role: 'builder', email: 'builder@prestige.com', phone: '9800100100', city: 'Hyderabad', registeredDate: '2024-06-15', kycStatus: 'Verified', userStatus: 'Active', lastLogin: '2025-01-19', documents: [{ name: 'Company PAN', uploaded: true, verified: true }, { name: 'GST Certificate', uploaded: true, verified: true }, { name: 'RERA License', uploaded: true, verified: true }], activityLog: [{ date: '2025-01-19', action: 'Logged in' }, { date: '2025-01-18', action: 'Added new project' }] },
  { id: 'U002', name: 'Ravi Kumar', role: 'cp', email: 'ravi@cpconnect.in', phone: '9800012345', city: 'Hyderabad', registeredDate: '2022-03-15', kycStatus: 'Verified', userStatus: 'Active', lastLogin: '2025-01-19', documents: [{ name: 'Aadhaar', uploaded: true, verified: true }, { name: 'PAN Card', uploaded: true, verified: true }, { name: 'RERA License', uploaded: true, verified: true }], activityLog: [{ date: '2025-01-19', action: 'Submitted lead L008' }, { date: '2025-01-18', action: 'Earned commission CM002' }] },
  { id: 'U003', name: 'Rahul Singh', role: 'customer', email: 'rahul@email.com', phone: '9800111222', city: 'Hyderabad', registeredDate: '2024-12-01', kycStatus: 'Verified', userStatus: 'Active', lastLogin: '2025-01-18', documents: [{ name: 'Aadhaar', uploaded: true, verified: true }, { name: 'PAN Card', uploaded: true, verified: true }], activityLog: [{ date: '2025-01-18', action: 'Viewed loan status' }] },
  { id: 'U004', name: 'Priya Sharma', role: 'cp', email: 'priya@cpconnect.in', phone: '9800023456', city: 'Hyderabad', registeredDate: '2022-08-10', kycStatus: 'Verified', userStatus: 'Active', lastLogin: '2025-01-17', documents: [{ name: 'Aadhaar', uploaded: true, verified: true }, { name: 'PAN Card', uploaded: true, verified: true }, { name: 'RERA License', uploaded: true, verified: true }], activityLog: [{ date: '2025-01-17', action: 'Logged in' }] },
  { id: 'U005', name: 'Sneha Patel', role: 'customer', email: 'sneha@email.com', phone: '9800555666', city: 'Pune', registeredDate: '2025-01-10', kycStatus: 'Pending', userStatus: 'Pending KYC', lastLogin: '2025-01-18', documents: [{ name: 'Aadhaar', uploaded: true, verified: false }, { name: 'PAN Card', uploaded: false, verified: false }], activityLog: [{ date: '2025-01-18', action: 'Uploaded Aadhaar' }] },
  { id: 'U006', name: 'Mohammed Salim', role: 'cp', email: 'salim@cpconnect.in', phone: '9800034567', city: 'Secunderabad', registeredDate: '2022-01-20', kycStatus: 'Verified', userStatus: 'Active', lastLogin: '2025-01-19', documents: [{ name: 'Aadhaar', uploaded: true, verified: true }, { name: 'PAN Card', uploaded: true, verified: true }, { name: 'RERA License', uploaded: true, verified: true }], activityLog: [{ date: '2025-01-19', action: 'Logged in' }] },
  { id: 'U007', name: 'Ramesh Babu', role: 'bank', email: 'ramesh@hdfc.com', phone: '9800001234', city: 'Hyderabad', registeredDate: '2024-08-01', kycStatus: 'Verified', userStatus: 'Active', lastLogin: '2025-01-19', documents: [{ name: 'Employee ID', uploaded: true, verified: true }, { name: 'Bank Authorization', uploaded: true, verified: true }], activityLog: [{ date: '2025-01-19', action: 'Updated loan LN003 status' }] },
  { id: 'U008', name: 'DesignCraft Interiors', role: 'vendor', email: 'info@designcraft.in', phone: '9800090909', city: 'Hyderabad', registeredDate: '2024-09-15', kycStatus: 'Verified', userStatus: 'Active', lastLogin: '2025-01-17', documents: [{ name: 'GST Certificate', uploaded: true, verified: true }, { name: 'Business PAN', uploaded: true, verified: true }], activityLog: [{ date: '2025-01-17', action: 'Sent quote Q003' }] },
  { id: 'U009', name: 'Rajendra Prasad', role: 'customer', email: 'rajendra@email.com', phone: '9800200200', city: 'Hyderabad', registeredDate: '2024-11-01', kycStatus: 'Verified', userStatus: 'Active', lastLogin: '2025-01-16', documents: [{ name: 'Aadhaar', uploaded: true, verified: true }, { name: 'PAN Card', uploaded: true, verified: true }], activityLog: [{ date: '2025-01-16', action: 'Logged in' }] },
  { id: 'U010', name: 'Anita Joshi', role: 'cp', email: 'anita@cpconnect.in', phone: '9800067890', city: 'Pune', registeredDate: '2023-06-12', kycStatus: 'Pending', userStatus: 'Pending KYC', lastLogin: '2025-01-15', documents: [{ name: 'Aadhaar', uploaded: true, verified: false }, { name: 'PAN Card', uploaded: true, verified: false }, { name: 'RERA License', uploaded: false, verified: false }], activityLog: [{ date: '2025-01-15', action: 'Registered' }] },
  { id: 'U011', name: 'Vikram Singh', role: 'builder', email: 'vikram@myhome.com', phone: '9800300300', city: 'Hyderabad', registeredDate: '2024-07-20', kycStatus: 'Rejected', userStatus: 'Suspended', lastLogin: '2025-01-10', documents: [{ name: 'Company PAN', uploaded: true, verified: false }, { name: 'GST Certificate', uploaded: true, verified: false }, { name: 'RERA License', uploaded: false, verified: false }], activityLog: [{ date: '2025-01-10', action: 'KYC rejected — missing RERA' }] },
  { id: 'U012', name: 'Kavitha Rao', role: 'customer', email: 'kavitha@email.com', phone: '9800222333', city: 'Hyderabad', registeredDate: '2025-01-05', kycStatus: 'Verified', userStatus: 'Active', lastLogin: '2025-01-19', documents: [{ name: 'Aadhaar', uploaded: true, verified: true }, { name: 'PAN Card', uploaded: true, verified: true }], activityLog: [{ date: '2025-01-19', action: 'Logged in' }] },
];
