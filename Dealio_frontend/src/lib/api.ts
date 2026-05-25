import { supabase } from '@/integrations/supabase/client';

const AUTH_BASE = import.meta.env.VITE_AUTH_URL ?? 'http://127.0.0.1:8090/api';
const BUILDER_BASE = import.meta.env.VITE_BUILDER_URL ?? 'http://127.0.0.1:8090/api';
const CUSTOMER_BASE = import.meta.env.VITE_CUSTOMER_URL ?? 'http://127.0.0.1:8090/api';

const TOKEN_KEY = 'dealio_access_token';
const BUILDER_ID_KEY = 'dealio_builder_id';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

async function request(base: string, path: string, options: RequestInit = {}) {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  } catch {
    throw new Error('Cannot reach the server. Make sure both backend services are running.');
  }

  if (res.status === 204) return null;

  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server returned an unexpected response (HTTP ${res.status}). Check backend logs.`);
  }

  if (!res.ok) {
    throw new Error((json?.message as string) || `Request failed: ${res.status}`);
  }

  // Unwrap Spring Boot ApiResponse wrapper { ok, message, data }
  return json?.data !== undefined ? json.data : json;
}

const authReq = (path: string, options?: RequestInit) => request(AUTH_BASE, path, options);
const builderReq = (path: string, options?: RequestInit) => request(BUILDER_BASE, path, options);

export const authApi = {
  loginSendOtp: (countryCode: string, phone: string) =>
    authReq('/auth/login/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ countryCode, phone }),
    }),

  loginVerifyOtp: (countryCode: string, phone: string, otp: string) =>
    authReq('/auth/login/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ countryCode, phone, otp }),
    }),

  signupSendOtp: (countryCode: string, phone: string, fullName: string, role: string) =>
    authReq('/auth/signup/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ countryCode, phone, fullName, role: role.toUpperCase() }),
    }),

  signupVerifyOtp: (countryCode: string, phone: string, otp: string, fullName?: string, role?: string) =>
    authReq('/auth/signup/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ countryCode, phone, otp, fullName, role }),
    }),

  googleAuth: (idToken: string, role?: string) =>
    authReq('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, role: role?.toUpperCase() }),
    }),

  refresh: (refreshToken: string) =>
    authReq('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  logout: () =>
    authReq('/auth/logout', { method: 'POST' }),
};

export const builderApi = {
  ensureBuilder: (name: string, email: string, phone?: string, userId?: string | number) =>
    builderReq('/builder/ensure', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, userId: userId ? Number(userId) : undefined }),
    }),

  getCachedBuilderId: () => localStorage.getItem(BUILDER_ID_KEY),

  setCachedBuilderId: (id: string) => localStorage.setItem(BUILDER_ID_KEY, id),

  clearCachedBuilderId: () => localStorage.removeItem(BUILDER_ID_KEY),

  createProject: (builderId: number | string, data: Record<string, unknown>) =>
    builderReq(`/builder/${builderId}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProjects: (builderId: number | string, status?: string) =>
    builderReq(`/builder/${builderId}/projects${status ? `?status=${status}` : ''}`),

  getProject: (builderId: number | string, projectId: number | string) =>
    builderReq(`/builder/${builderId}/projects/${projectId}`),

  getPublicProjects: (city?: string, builderId?: number | string) => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (builderId) params.set('builderId', String(builderId));
    const qs = params.toString();
    return builderReq(`/builder/projects${qs ? `?${qs}` : ''}`);
  },

  getPublicBuilders: () =>
    builderReq('/builder/builders'),

  resolveMapsLink: (url: string): Promise<{ resolvedUrl: string }> =>
    builderReq(`/builder/resolve-maps-link?url=${encodeURIComponent(url)}`) as Promise<{ resolvedUrl: string }>,

  getPublicProject: (id: number | string) =>
    builderReq(`/builder/projects/${id}`),

  getBuilderMeetings: (builderId: number | string) =>
    builderReq(`/builder/${builderId}/meetings`),

  updateMeetingStatus: (builderId: number | string, meetingId: number | string, data: { status: string; notes?: string; confirmedDate?: string; confirmedTime?: string }) =>
    builderReq(`/builder/${builderId}/meetings/${meetingId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getBuilderDeals: (builderId: number | string) =>
    builderReq(`/builder/${builderId}/deals`),

  getBuilderLeads: (builderId: number | string) =>
    builderReq(`/builder/${builderId}/leads`),

  updateLeadStage: (builderId: number | string, leadId: number | string, stage: string) =>
    builderReq(`/builder/${builderId}/leads/${leadId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    }),

  getBuilderCommissions: (builderId: number | string) =>
    builderReq(`/builder/${builderId}/commissions`),

  releaseBuilderCommission: (builderId: number | string, dealId: number | string) =>
    builderReq(`/builder/${builderId}/commissions/${dealId}/release`, { method: 'PATCH' }),

  updateBuilderDealStatus: (builderId: number | string, dealId: number | string, status: string) =>
    builderReq(`/builder/${builderId}/deals/${dealId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getBuilderNotifications: () =>
    builderReq('/builder/notifications'),

  updateProject: (builderId: number | string, projectId: number | string, data: Record<string, unknown>) =>
    builderReq(`/builder/${builderId}/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getDocuments: (builderId: number | string, projectId: number | string) =>
    builderReq(`/builder/${builderId}/projects/${projectId}/documents`),

  getProjectPdfUrl: async (builderId: number | string, projectId: number | string): Promise<string> => {
    const token = getToken();
    const res = await fetch(`${BUILDER_BASE}/builder/${builderId}/projects/${projectId}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to generate PDF');
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  uploadDocument: async (builderId: number | string, projectId: number | string, file: File, docType: string) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    let res: Response;
    try {
      res = await fetch(`${BUILDER_BASE}/builder/${builderId}/projects/${projectId}/documents`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
    } catch {
      throw new Error('Cannot reach the server. Make sure both backend services are running.');
    }
    if (res.status === 204) return null;
    let json: Record<string, unknown>;
    try { json = await res.json(); } catch {
      throw new Error(`Server returned an unexpected response (HTTP ${res.status}).`);
    }
    if (!res.ok) throw new Error((json?.message as string) || `Upload failed: ${res.status}`);
    return json?.data !== undefined ? json.data : json;
  },

  uploadProjectImage: async (builderId: number | string, projectId: number | string, file: File): Promise<string> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    let res: Response;
    try {
      res = await fetch(`${BUILDER_BASE}/builder/${builderId}/projects/${projectId}/image`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
    } catch {
      throw new Error('Cannot reach the server. Make sure the backend is running.');
    }
    let json: Record<string, unknown>;
    try { json = await res.json(); } catch {
      throw new Error(`Server returned an unexpected response (HTTP ${res.status}).`);
    }
    if (!res.ok) throw new Error((json?.message as string) || `Image upload failed: ${res.status}`);
    return (json?.data ?? json) as string;
  },
};

const customerReq = (path: string, options?: RequestInit) => request(CUSTOMER_BASE, path, options);

export const customerApi = {
  getCities: () =>
    customerReq('/customer/cities'),

  getProjectsByCity: (city?: string) =>
    customerReq(`/customer/projects${city ? `?city=${encodeURIComponent(city)}` : ''}`),

  getAvailableCPs: () =>
    customerReq('/customer/cps'),

  getProject: (id: number | string) =>
    customerReq(`/customer/projects/${id}`),

  setPreferredCity: (city: string | null) =>
    customerReq('/customer/preferred-city', {
      method: 'PATCH',
      body: JSON.stringify({ city }),
    }),

  getNotifications: () =>
    customerReq('/customer/notifications'),

  updateProfile: (data: { email?: string | null }) =>
    customerReq('/customer/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export interface CPContactPayload {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  tags?: string;
  bhkPreference?: string;
}

const cpReq = (path: string, options?: RequestInit) => request(BUILDER_BASE, path, options);

export const cpApi = {
  getContacts: (cpUserId: string | number) =>
    cpReq(`/cp/${cpUserId}/contacts`),

  addContact: (cpUserId: string | number, data: CPContactPayload) =>
    cpReq(`/cp/${cpUserId}/contacts`, { method: 'POST', body: JSON.stringify(data) }),

  updateContact: (cpUserId: string | number, contactId: number, data: Partial<CPContactPayload>) =>
    cpReq(`/cp/${cpUserId}/contacts/${contactId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteContact: (cpUserId: string | number, contactId: number) =>
    cpReq(`/cp/${cpUserId}/contacts/${contactId}`, { method: 'DELETE' }),

  getProfile: (cpUserId: string | number) =>
    cpReq(`/cp/${cpUserId}/profile`),

  updateProfile: (cpUserId: string | number, data: { fullName?: string; email?: string; city?: string; bio?: string; reraNumber?: string }) =>
    cpReq(`/cp/${cpUserId}/profile`, { method: 'PATCH', body: JSON.stringify(data) }),

  getNotifications: () =>
    cpReq('/cp/notifications'),

  sendPhoneOtp: (phone: string) =>
    cpReq('/cp/verify-phone/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),

  verifyPhone: (cpUserId: string | number, phone: string, otp: string) =>
    cpReq(`/cp/${cpUserId}/verify-phone`, { method: 'POST', body: JSON.stringify({ phone, otp }) }),

  uploadDocument: async (cpUserId: string | number, file: File, docType: 'aadhaar' | 'pan' | 'rera') => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    let res: Response;
    try {
      res = await fetch(`${BUILDER_BASE}/cp/${cpUserId}/documents`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
    } catch {
      throw new Error('Cannot reach the server.');
    }
    let json: Record<string, unknown>;
    try { json = await res.json(); } catch { throw new Error(`Server error (HTTP ${res.status})`); }
    if (!res.ok) throw new Error((json?.message as string) || `Upload failed: ${res.status}`);
    return json?.data !== undefined ? json.data : json;
  },
};

// Customer portal — calls Builder service, requires JWT, no builderId in path
export const portalApi = {
  getMyMeetings: (phone: string) =>
    builderReq(`/portal/customer/meetings?phone=${encodeURIComponent(phone)}`),

  bookMeeting: (data: {
    builderId: number; projectId?: number; customerName: string; customerPhone: string;
    preferredDate: string; preferredTime: string; meetingType?: string; notes?: string;
  }) =>
    builderReq('/portal/customer/meetings', { method: 'POST', body: JSON.stringify(data) }),

  getMyDeals: (phone: string) =>
    builderReq(`/portal/customer/deals?phone=${encodeURIComponent(phone)}`),

  submitLoanApplication: (data: {
    builderId: number; projectId?: number; customerName: string; customerPhone: string;
    customerEmail?: string; loanAmount: number; propertyValue: number;
    employmentType?: string; tenureMonths: number;
  }) =>
    builderReq('/portal/customer/applications', { method: 'POST', body: JSON.stringify(data) }),
};