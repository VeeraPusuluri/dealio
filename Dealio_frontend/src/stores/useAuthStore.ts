import { create } from 'zustand';

export type UserRole = 'builder' | 'cp' | 'customer' | 'bank' | 'vendor' | 'admin' | 'nri' | 'landowner';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  role: UserRole;
  tier?: string;
  avatar?: string;
}

export const roleColors: Record<UserRole, string> = {
  builder: '#0A7E8C',
  cp: '#E87722',
  customer: '#16A34A',
  bank: '#2E5D8E',
  vendor: '#7B5E3A',
  admin: '#6B3FA0',
  nri: '#F5A623',
  landowner: '#C0392B',
};

export const roleLabels: Record<UserRole, string> = {
  builder: 'Builder',
  cp: 'Channel Partner',
  customer: 'Customer',
  bank: 'Bank Officer',
  vendor: 'Interior Vendor',
  admin: 'Admin',
  nri: 'NRI Buyer',
  landowner: 'Land Owner',
};

export const demoCredentials: Record<UserRole, { email: string; password: string; name: string }> = {
  builder: { email: 'builder@dealio.in', password: 'Demo@1234', name: 'Prestige Group' },
  cp: { email: 'ravi@dealio.in', password: 'Demo@1234', name: 'Ravi Kumar' },
  customer: { email: 'rahul@email.com', password: 'Demo@1234', name: 'Rahul Singh' },
  bank: { email: 'ramesh@hdfc.com', password: 'Demo@1234', name: 'Ramesh Babu' },
  vendor: { email: 'info@designcraft.in', password: 'Demo@1234', name: 'DesignCraft Interiors' },
  admin: { email: 'admin@dealio.in', password: 'Demo@1234', name: 'Platform Admin' },
  nri: { email: 'nri@dealio.in', password: 'Demo@1234', name: 'Arjun Mehta' },
  landowner: { email: 'rajendra@email.com', password: 'Demo@1234', name: 'Rajendra Prasad' },
};

export interface AuthApiResponse {
  user: {
    id: number;
    fullName: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    role: string;
    avatarUrl?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const TOKEN_KEY = 'dealio_access_token';
const REFRESH_KEY = 'dealio_refresh_token';
const USER_KEY = 'dealio_user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  accessToken: string | null;
  setAuthFromResponse: (response: AuthApiResponse) => void;
  logout: () => Promise<void>;
  login: (role: UserRole) => Promise<void>;
  loginAsRole: (role: UserRole) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, role?: UserRole, extra?: Record<string, unknown>) => Promise<void>;
  switchRole: () => Promise<void>;
  hydrateFromSession: (userId: string, email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  accessToken: null,

  setAuthFromResponse: (response: AuthApiResponse) => {
    // Map backend response keys to frontend User interface
    const user: User = {
      id: String(response.user.id),
      name: response.user.fullName || (response.user as any).name,
      email: response.user.email,
      phone: response.user.phone,
      countryCode: response.user.countryCode,
      role: (response.user.role || (response.user as any).role || 'customer').toLowerCase() as UserRole,
      avatar: response.user.avatarUrl,
    };
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true, loading: false, accessToken: response.accessToken });
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, isAuthenticated: false, accessToken: null, loading: false });
  },

  loginAsRole: async (_role) => { /* use phone OTP flow */ },
  login: async (role) => { await get().loginAsRole(role); },
  loginWithEmail: async (_email, _password) => { /* not implemented */ },
  signUpWithEmail: async (_email, _password, _name, _role, _extra) => { /* not implemented */ },
  hydrateFromSession: async (_userId, _email) => { /* no-op: hydration is from localStorage */ },

  switchRole: async () => {
    await get().logout();
  },
}));

// Hydrate from localStorage on module load
(() => {
  const stored = localStorage.getItem(USER_KEY);
  const token = localStorage.getItem(TOKEN_KEY);
  if (stored && token) {
    try {
      const user = JSON.parse(stored) as User;
      useAuthStore.setState({ user, isAuthenticated: true, loading: false, accessToken: token });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      useAuthStore.setState({ loading: false });
    }
  } else {
    useAuthStore.setState({ loading: false });
  }
})();