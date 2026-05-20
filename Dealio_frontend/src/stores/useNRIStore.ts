import { create } from 'zustand';

interface NRIState {
  currency: string;
  shortlisted: string[];
  setCurrency: (c: string) => void;
  toggleShortlist: (projectId: string) => void;
}

export const useNRIStore = create<NRIState>((set) => ({
  currency: 'AED',
  shortlisted: ['P001', 'P003'],
  setCurrency: (c) => set({ currency: c }),
  toggleShortlist: (projectId) =>
    set((state) => ({
      shortlisted: state.shortlisted.includes(projectId)
        ? state.shortlisted.filter((id) => id !== projectId)
        : [...state.shortlisted, projectId],
    })),
}));
