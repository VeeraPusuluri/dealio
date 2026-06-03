import { create } from 'zustand';

export interface FollowUp {
  id: string;
  leadId: string;
  customerName: string;
  projectName: string;
  stage: string;
  reason: string;
  dueDate: string;
  dueTime?: string;
  done: boolean;
  createdAt: string;
}

export interface CallLog {
  id: string;
  leadId: string;
  customerName?: string;
  projectName?: string;
  outcome: string;
  duration: string;
  notes: string;
  nextFollowUp?: string;
  nextFollowUpTime?: string;
  createdAt: string;
  createdBy: string;
}

interface FollowUpState {
  followUps: FollowUp[];
  callLogs: CallLog[];
  addFollowUp: (fu: FollowUp) => void;
  markDone: (id: string) => void;
  addCallLog: (log: CallLog) => void;
  getCallLogsForLead: (leadId: string) => CallLog[];
  getFollowUpsDue: (date: string) => FollowUp[];
}

export const useFollowUpStore = create<FollowUpState>((set, get) => ({
  followUps: [],
  callLogs: [],
  addFollowUp: (fu) => set((s) => ({ followUps: [...s.followUps, fu] })),
  markDone: (id) => set((s) => ({ followUps: s.followUps.map((f) => f.id === id ? { ...f, done: true } : f) })),
  addCallLog: (log) => set((s) => ({ callLogs: [...s.callLogs, log] })),
  getCallLogsForLead: (leadId) => get().callLogs.filter((c) => c.leadId === leadId),
  getFollowUpsDue: (date) => get().followUps.filter((f) => f.dueDate === date && !f.done),
}));
