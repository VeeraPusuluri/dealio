import { create } from 'zustand';
import { Lead, LeadStage } from '@/data/leads';
import { builderApi } from '@/lib/api';

interface LeadState {
  leads: Lead[];
  loading: boolean;
  builderId: string | null;
  fetchLeads: (builderId: string) => Promise<void>;
  moveLead: (id: string, toStage: LeadStage) => void;
  addLead: (lead: Lead) => void;
  markAsSold: (leadId: string, unitId: string, price: number) => void;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  loading: false,
  builderId: null,

  fetchLeads: async (builderId) => {
    set({ loading: true, builderId });
    try {
      const data = await builderApi.getBuilderLeads(builderId) as Lead[];
      set({ leads: data || [] });
    } catch {
      set({ leads: [] });
    } finally {
      set({ loading: false });
    }
  },

  moveLead: (id, toStage) => {
    set((s) => ({
      leads: s.leads.map((l) => l.id === id ? { ...l, stage: toStage, daysInStage: 0 } : l),
    }));
    const { builderId } = get();
    if (builderId) builderApi.updateLeadStage(builderId, id, toStage).catch(() => {});
  },

  addLead: (lead) => set((s) => ({ leads: [...s.leads, lead] })),

  markAsSold: (leadId) =>
    set((s) => ({
      leads: s.leads.map((l) =>
        l.id === leadId ? { ...l, stage: 'Closed' as LeadStage, daysInStage: 0 } : l
      ),
    })),
}));