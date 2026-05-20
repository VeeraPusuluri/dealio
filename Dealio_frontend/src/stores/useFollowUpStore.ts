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

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const initialFollowUps: FollowUp[] = [
  { id: 'FU001', leadId: 'L004', customerName: 'Meera Krishnan', projectName: 'Prestige Skyline', stage: 'New Lead', reason: 'New lead — first follow-up', dueDate: today, dueTime: '11:00', done: false, createdAt: '2025-01-18' },
  { id: 'FU002', leadId: 'L008', customerName: 'Priya Menon', projectName: 'My Home Avatar', stage: 'New Lead', reason: 'New lead — first follow-up', dueDate: today, dueTime: '14:00', done: false, createdAt: '2025-01-19' },
  { id: 'FU003', leadId: 'L001', customerName: 'Vijay Anand', projectName: 'Prestige Skyline', stage: 'Meeting Done', reason: 'Meeting completed 2d ago — needs push', dueDate: today, done: false, createdAt: '2025-01-15' },
  { id: 'FU004', leadId: 'L005', customerName: 'Ramesh Goud', projectName: 'Incor Carmel Heights', stage: 'Meeting Requested', reason: 'Builder hasn\'t confirmed meeting', dueDate: tomorrow, done: false, createdAt: '2025-01-12' },
  { id: 'FU005', leadId: 'L003', customerName: 'Arjun Reddy', projectName: 'My Home Avatar', stage: 'Booked', reason: 'Congratulations message', dueDate: tomorrow, done: false, createdAt: '2025-01-19' },
];

const initialCallLogs: CallLog[] = [
  { id: 'CL001', leadId: 'L001', outcome: 'Interested — confirmed', duration: '3–10 min', notes: 'Wants Tower A higher floors, east facing', createdAt: '2025-01-14T10:30:00', createdBy: 'Ravi Kumar' },
  { id: 'CL002', leadId: 'L002', outcome: 'Interested — needs time', duration: '1–3 min', notes: 'Comparing with 2 other projects', createdAt: '2025-01-10T15:00:00', createdBy: 'Priya Sharma' },
  { id: 'CL003', leadId: 'L004', outcome: 'Not answering', duration: '<1 min', notes: '', nextFollowUp: today, createdAt: '2025-01-18T16:00:00', createdBy: 'Mohammed Salim' },
];

export const useFollowUpStore = create<FollowUpState>((set, get) => ({
  followUps: initialFollowUps,
  callLogs: initialCallLogs,
  addFollowUp: (fu) => set((s) => ({ followUps: [...s.followUps, fu] })),
  markDone: (id) => set((s) => ({ followUps: s.followUps.map((f) => f.id === id ? { ...f, done: true } : f) })),
  addCallLog: (log) => set((s) => ({ callLogs: [...s.callLogs, log] })),
  getCallLogsForLead: (leadId) => get().callLogs.filter((c) => c.leadId === leadId),
  getFollowUpsDue: (date) => get().followUps.filter((f) => f.dueDate === date && !f.done),
}));
