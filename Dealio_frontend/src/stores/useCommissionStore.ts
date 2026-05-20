import { create } from 'zustand';
import { Commission } from '@/data/commissions';
import { builderApi } from '@/lib/api';

interface CommissionState {
  commissions: Commission[];
  loading: boolean;
  builderId: string | null;
  fetchCommissions: (builderId: string) => Promise<void>;
  releaseCommission: (id: string) => void;
  addCommission: (commission: Commission) => void;
}

export const useCommissionStore = create<CommissionState>((set, get) => ({
  commissions: [],
  loading: false,
  builderId: null,

  fetchCommissions: async (builderId) => {
    set({ loading: true, builderId });
    try {
      const data = await builderApi.getBuilderCommissions(builderId) as Commission[];
      set({ commissions: data || [] });
    } catch {
      set({ commissions: [] });
    } finally {
      set({ loading: false });
    }
  },

  releaseCommission: (id) => {
    set((s) => ({
      commissions: s.commissions.map((c) =>
        c.id === id
          ? { ...c, status: 'Released' as const, releasedDate: new Date().toISOString().split('T')[0] }
          : c
      ),
    }));
    const { builderId } = get();
    if (builderId) builderApi.releaseBuilderCommission(builderId, id).catch(() => {});
  },

  addCommission: (commission) =>
    set((s) => ({ commissions: [...s.commissions, commission] })),
}));