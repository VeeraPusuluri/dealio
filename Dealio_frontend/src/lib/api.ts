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

  // Unwrap the backend's ApiResponse envelope { ok, message, data }
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

  loginVerifyOtp: (countryCode: string, phone: string, otp: string, role?: string) =>
    authReq('/auth/login/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ countryCode, phone, otp, ...(role ? { role } : {}) }),
    }),

  signupSendOtp: (countryCode: string, phone: string, fullName: string, role: string) =>
    authReq('/auth/signup/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ countryCode, phone, fullName, role: role.toUpperCase() }),
    }),

  signupVerifyOtp: (countryCode: string, phone: string, otp: string, fullName?: string, role?: string, referralCode?: string) =>
    authReq('/auth/signup/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ countryCode, phone, otp, fullName, role, referralCode }),
    }),

  googleAuth: (idToken: string, role?: string, referralCode?: string) =>
    authReq('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, role: role?.toUpperCase(), referralCode }),
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

  acceptSignedAgreement: (builderId: number | string, dealId: number | string) =>
    builderReq(`/builder/${builderId}/deals/${dealId}/accept-agreement`, { method: 'PATCH' }),

  markDealSold: (builderId: number | string, dealId: number | string) =>
    builderReq(`/builder/${builderId}/deals/${dealId}/mark-sold`, { method: 'PATCH' }),

  getBuilderNotifications: () =>
    builderReq('/builder/notifications'),

  getBuilderLoans: (builderId: number | string) =>
    builderReq(`/builder/${builderId}/loans`),

  createBuilderLoan: (builderId: number | string, data: object) =>
    builderReq(`/builder/${builderId}/loans`, { method: 'POST', body: JSON.stringify(data) }),

  updateLoanStatus: (builderId: number | string, loanId: number, status: string, note?: string, sender?: string, senderRole?: string) =>
    builderReq(`/builder/${builderId}/loans/${loanId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note, sender, senderRole }),
    }),

  addLoanNote: (builderId: number | string, loanId: number, type: string, content: string, sender: string, senderRole: string) =>
    builderReq(`/builder/${builderId}/loans/${loanId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ type, content, sender, senderRole }),
    }),

  getBuilderShortlists: (builderId: number | string) =>
    builderReq(`/builder/${builderId}/shortlists`),

  respondToShortlist: (builderId: number | string, shortlistId: number, status: 'Accepted' | 'SuggestOther', builderNote?: string) =>
    builderReq(`/builder/${builderId}/shortlists/${shortlistId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, builderNote }),
    }),

  createLeadFromShare: (projectId: number | string, data: { cpUserId?: string | number | null; customerName: string; customerPhone: string; stage?: string }) =>
    builderReq(`/builder/projects/${projectId}/leads/from-share`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resolveShareToken: (token: string) =>
    builderReq(`/builder/share/${token}`),

  updateProject: (builderId: number | string, projectId: number | string, data: Record<string, unknown>) =>
    builderReq(`/builder/${builderId}/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getDocuments: (builderId: number | string, projectId: number | string) =>
    builderReq(`/builder/${builderId}/projects/${projectId}/documents`),

  getBroadcasts: (builderId: number | string) =>
    builderReq(`/builder/${builderId}/broadcasts`),

  sendBroadcast: (builderId: number | string, data: {
    message: string;
    audience: string;
    audienceFilter?: string;
    projectId?: number | null;
    projectName?: string | null;
  }) =>
    builderReq(`/builder/${builderId}/broadcasts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Project Updates
  getProjectUpdates: (builderId: number | string, projectId: number | string) =>
    builderReq(`/builder/${builderId}/projects/${projectId}/updates`),
  createProjectUpdate: (builderId: number | string, projectId: number | string, data: { title: string; content: string; type: string; visibleTo: string }) =>
    builderReq(`/builder/${builderId}/projects/${projectId}/updates`, { method: 'POST', body: JSON.stringify(data) }),
  editProjectUpdate: (builderId: number | string, projectId: number | string, updateId: number, data: Partial<{ title: string; content: string; type: string; visibleTo: string }>) =>
    builderReq(`/builder/${builderId}/projects/${projectId}/updates/${updateId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProjectUpdate: (builderId: number | string, projectId: number | string, updateId: number) =>
    builderReq(`/builder/${builderId}/projects/${projectId}/updates/${updateId}`, { method: 'DELETE' }),
  getPublicProjectUpdates: (projectId: number | string, role = 'CP') =>
    builderReq(`/builder/projects/${projectId}/updates?role=${role}`),

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

  getDeal: (builderId: number | string, dealId: number | string) =>
    builderReq(`/builder/${builderId}/deals/${dealId}`),

  addDealDocument: (builderId: number | string, dealId: number | string, data: { name: string; docType: string; fileUrl?: string; sharedWithCp?: boolean; sharedWithCustomer?: boolean }) =>
    builderReq(`/builder/${builderId}/deals/${dealId}/documents`, { method: 'POST', body: JSON.stringify(data) }),

  uploadDealDocument: async (builderId: number | string, dealId: number | string, file: File, docType: string, sharedWithCp: boolean, sharedWithCustomer: boolean) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    formData.append('sharedWithCp', String(sharedWithCp));
    formData.append('sharedWithCustomer', String(sharedWithCustomer));
    let res: Response;
    try {
      res = await fetch(`${BUILDER_BASE}/builder/${builderId}/deals/${dealId}/upload`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
    } catch {
      throw new Error('Cannot reach the server.');
    }
    if (res.status === 204) return null;
    let json: Record<string, unknown>;
    try { json = await res.json(); } catch {
      throw new Error(`Server error (HTTP ${res.status})`);
    }
    if (!res.ok) throw new Error((json?.message as string) || `Upload failed: ${res.status}`);
    return json?.data !== undefined ? json.data : json;
  },

  shareDealDocument: (builderId: number | string, dealId: number | string, docId: number, data: { sharedWithCp?: boolean; sharedWithCustomer?: boolean }) =>
    builderReq(`/builder/${builderId}/deals/${dealId}/documents/${docId}/share`, { method: 'PATCH', body: JSON.stringify(data) }),

  sendDealMessage: (builderId: number | string, dealId: number | string, message: string) =>
    builderReq(`/builder/${builderId}/deals/${dealId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),

  setPaymentSchedule: (builderId: number | string, dealId: number | string, schedule: unknown[]) =>
    builderReq(`/builder/${builderId}/deals/${dealId}/payment-schedule`, { method: 'PATCH', body: JSON.stringify({ schedule }) }),

  assignCPToDeal: (builderId: number | string, dealId: number | string, cpUserId: number | null) =>
    builderReq(`/builder/${builderId}/deals/${dealId}/assign-cp`, { method: 'PATCH', body: JSON.stringify({ cpUserId }) }),

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

// Role-aware notification read-sync. All three routers expose the same PATCH shape on
// the single backend; the caller's role picks the path prefix.
function notifPrefix(role?: string): string {
  return role === 'cp' ? '/cp' : role === 'customer' ? '/customer' : '/builder';
}

export const notificationsApi = {
  markRead: (role: string | undefined, id: number) =>
    builderReq(`${notifPrefix(role)}/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {}),
  markAllRead: (role: string | undefined) =>
    builderReq(`${notifPrefix(role)}/notifications/read-all`, { method: 'PATCH' }).catch(() => {}),
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
  getOrCreateShareLink: (cpUserId: string | number, projectId: string | number) =>
    cpReq(`/cp/${cpUserId}/projects/${projectId}/share-link`, { method: 'POST' }),

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

  getLeads: (cpUserId: string | number) =>
    cpReq(`/cp/${cpUserId}/leads`),

  createLead: (cpUserId: string | number, data: {
    projectId: number; customerName: string; customerPhone: string;
    customerEmail?: string; stage?: string;
  }) =>
    cpReq(`/cp/${cpUserId}/leads`, { method: 'POST', body: JSON.stringify({ ...data, stage: data.stage ?? 'NEW_LEAD' }) }),

  getMeetings: (cpUserId: string | number) =>
    cpReq(`/cp/${cpUserId}/meetings`),

  addMeetingNote: (cpUserId: string | number, meetingId: number | string, notes: string, rating?: number) =>
    cpReq(`/cp/${cpUserId}/meetings/${meetingId}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes, ...(rating !== undefined ? { cpRating: rating } : {}) }),
    }),

  sendPhoneOtp: (phone: string) =>
    cpReq('/cp/verify-phone/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),

  verifyPhone: (cpUserId: string | number, phone: string, otp: string) =>
    cpReq(`/cp/${cpUserId}/verify-phone`, { method: 'POST', body: JSON.stringify({ phone, otp }) }),

  getDueToday: (cpUserId: string | number) =>
    cpReq(`/cp/${cpUserId}/due-today`),

  getFollowUps: (cpUserId: string | number) =>
    cpReq(`/cp/${cpUserId}/follow-ups`),

  createFollowUp: (cpUserId: string | number, data: {
    dealId: number; dueDate: string; dueTime?: string; reason: string;
  }) =>
    cpReq(`/cp/${cpUserId}/follow-ups`, { method: 'POST', body: JSON.stringify(data) }),

  markFollowUpDone: (cpUserId: string | number, followUpId: number | string) =>
    cpReq(`/cp/${cpUserId}/follow-ups/${followUpId}/done`, { method: 'PATCH' }),

  getCallLogs: (cpUserId: string | number) =>
    cpReq(`/cp/${cpUserId}/call-logs`),

  createCallLog: (cpUserId: string | number, data: {
    dealId: number; outcome: string; duration: string; notes?: string;
    nextFollowUp?: string; nextFollowUpTime?: string;
  }) =>
    cpReq(`/cp/${cpUserId}/call-logs`, { method: 'POST', body: JSON.stringify(data) }),

  getCPDeal: (cpUserId: number | string, dealId: number | string) =>
    cpReq(`/cp/${cpUserId}/deals/${dealId}`),

  agreeDeal: (cpUserId: number | string, dealId: number | string) =>
    cpReq(`/cp/${cpUserId}/deals/${dealId}/agree`, { method: 'PATCH' }),

  sendCPDealMessage: (cpUserId: number | string, dealId: number | string, message: string) =>
    cpReq(`/cp/${cpUserId}/deals/${dealId}/messages`, { method: 'POST', body: JSON.stringify({ message }) }),

  getCommissions: (cpUserId: string | number) =>
    cpReq(`/cp/${cpUserId}/commissions`),

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
const AI_BASE = import.meta.env.VITE_BUILDER_URL ?? 'http://127.0.0.1:8090/api';

export const aiApi = {
  checkHealth: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('dealio_access_token');
      const res = await fetch(`${AI_BASE}/ai/health`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Opens an SSE stream to the AI chat endpoint.
   * Returns a ReadableStreamDefaultReader that emits JSON chunks { text } or [DONE].
   */
  streamChat: (
    messages: { role: 'user' | 'assistant'; content: string }[],
    context: { role?: string; userName?: string },
  ): ReadableStreamDefaultReader<Uint8Array> => {
    const token = localStorage.getItem('dealio_access_token');
    const ctrl = new AbortController();
    const stream = fetch(`${AI_BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, context }),
      signal: ctrl.signal,
    }).then(r => {
      if (!r.body) throw new Error('No response body');
      return r.body.getReader();
    });
    // Wrap in a proxy reader that resolves the promise
    let resolvedReader: ReadableStreamDefaultReader<Uint8Array>;
    const proxyStream = new ReadableStream<Uint8Array>({
      start(controller) {
        stream.then(reader => {
          resolvedReader = reader;
          const pump = () => reader.read().then(({ done, value }) => {
            if (done) { controller.close(); return; }
            controller.enqueue(value);
            pump();
          }).catch(() => controller.close());
          pump();
        }).catch(() => controller.close());
      },
      cancel() { ctrl.abort(); },
    });
    return proxyStream.getReader();
  },
};

export const portalApi = {
  getMyMeetings: (phone: string) =>
    builderReq(`/portal/customer/meetings?phone=${encodeURIComponent(phone)}`),

  getBookedSlots: (builderId: number | string, date: string): Promise<string[]> =>
    builderReq(`/portal/customer/booked-slots?builderId=${builderId}&date=${encodeURIComponent(date)}`) as Promise<string[]>,

  bookMeeting: (data: {
    builderId: number; projectId?: number; customerName: string; customerPhone: string;
    preferredDate: string; preferredTime: string; meetingType?: string; notes?: string;
    cpUserId?: number | string | null;
  }) =>
    builderReq('/portal/customer/meetings', { method: 'POST', body: JSON.stringify(data) }),

  getMyDeals: (phone: string) =>
    builderReq(`/portal/customer/deals?phone=${encodeURIComponent(phone)}`),

  rateMeeting: (meetingId: number, rating: number) =>
    builderReq(`/portal/customer/meetings/${meetingId}/rating`, {
      method: 'PATCH',
      body: JSON.stringify({ rating }),
    }),

  shortlistUnit: (data: {
    customerPhone: string; builderId: number; projectId: number;
    cpId?: number | null; unitId: string; unitDetails: object;
  }) =>
    builderReq('/portal/customer/shortlist', { method: 'POST', body: JSON.stringify(data) }),

  getMyShortlists: (phone: string) =>
    builderReq(`/portal/customer/shortlist?phone=${encodeURIComponent(phone)}`),

  submitLoanApplication: (data: {
    builderId?: number; projectId?: number; customerName?: string; customerPhone: string;
    customerEmail?: string; loanAmount: number; propertyValue: number;
    employmentType?: string; tenureMonths: number;
  }) =>
    builderReq('/portal/customer/applications', { method: 'POST', body: JSON.stringify(data) }),

  confirmDeal: (dealId: number, phone: string) =>
    builderReq(`/builder/customer/deals/${dealId}/confirm`, { method: 'PATCH', body: JSON.stringify({ phone }) }),

  acceptNegotiation: (dealId: number, phone: string) =>
    builderReq(`/portal/customer/deals/${dealId}/accept-negotiation`, { method: 'PATCH', body: JSON.stringify({ phone }) }),

  uploadSignedAgreement: async (dealId: number, phone: string, file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('phone', phone);
    let res: Response;
    try {
      res = await fetch(`${BUILDER_BASE}/portal/customer/deals/${dealId}/signed-agreement`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
    } catch {
      throw new Error('Cannot reach the server.');
    }
    let json: Record<string, unknown>;
    try { json = await res.json(); } catch {
      throw new Error(`Server error (HTTP ${res.status})`);
    }
    if (!res.ok) throw new Error((json?.message as string) || `Upload failed: ${res.status}`);
    return json?.data !== undefined ? json.data : json;
  },

  sendDealMessage: (dealId: number, phone: string, recipientRole: 'builder' | 'cp', message: string) =>
    builderReq(`/portal/customer/deals/${dealId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ phone, recipientRole, message }),
    }),

  requestPricing: (data: { builderId: number; projectId: number; customerPhone: string; unitId: string; unitDetails: object; note?: string }) =>
    builderReq('/portal/customer/pricing-requests', { method: 'POST', body: JSON.stringify(data) }),
};

const adminReq = (path: string, options?: RequestInit) => request(BUILDER_BASE, `/admin${path}`, options);

export const adminApi = {
  getStats: () =>
    adminReq('/stats'),

  getUsers: (params?: { role?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.role)   qs.set('role',   params.role);
    if (params?.search) qs.set('search', params.search);
    return adminReq(`/users${qs.toString() ? `?${qs}` : ''}`);
  },

  suspendUser: (userId: number, suspended: boolean) =>
    adminReq(`/users/${userId}/suspend`, { method: 'PATCH', body: JSON.stringify({ suspended }) }),

  getBuilders: (search?: string) =>
    adminReq(`/builders${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  getProjects: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    return adminReq(`/projects${qs.toString() ? `?${qs}` : ''}`);
  },

  toggleProjectFeatured: (projectId: number) =>
    adminReq(`/projects/${projectId}/featured`, { method: 'PATCH' }),

  getCPs: (params?: { tier?: string; docStatus?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.tier)      qs.set('tier',      params.tier);
    if (params?.docStatus) qs.set('docStatus', params.docStatus);
    if (params?.search)    qs.set('search',    params.search);
    return adminReq(`/cps${qs.toString() ? `?${qs}` : ''}`);
  },

  verifyDocument: (cpId: number, docType: 'aadhaar' | 'pan' | 'rera', approved: boolean, rejectionNote?: string) =>
    adminReq(`/cps/${cpId}/verify-doc`, {
      method: 'PATCH',
      body: JSON.stringify({ docType, approved, rejectionNote }),
    }),

  updateCPTier: (cpId: number, tier: string) =>
    adminReq(`/cps/${cpId}/tier`, { method: 'PATCH', body: JSON.stringify({ tier }) }),

  getRevenueStats: (range?: string) =>
    adminReq(`/revenue${range ? `?range=${encodeURIComponent(range)}` : ''}`),

  getDeals: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    return adminReq(`/deals${qs.toString() ? `?${qs}` : ''}`);
  },

  updateDealMilestone: (dealId: number, status: string) =>
    adminReq(`/deals/${dealId}/milestone`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getCommissions: () =>
    adminReq('/commissions'),

  submitContact: (data: { name: string; phone: string; email?: string; city?: string; interest?: string; message?: string }) =>
    request(BUILDER_BASE, '/admin/contact', { method: 'POST', body: JSON.stringify(data) }),

  getContactRequests: () =>
    adminReq('/contact'),

  updateContactStatus: (id: number, status: 'new' | 'in_progress' | 'resolved') =>
    adminReq(`/contact/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getLoanCases: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    return adminReq(`/loan-cases${qs.toString() ? `?${qs}` : ''}`);
  },

  updateLoanCaseStatus: (id: number, data: { status: string; bank?: string; officerName?: string; officerPhone?: string; interestRate?: number; emi?: number }) =>
    adminReq(`/loan-cases/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  getMeetings: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    return adminReq(`/meetings${qs.toString() ? `?${qs}` : ''}`);
  },
};