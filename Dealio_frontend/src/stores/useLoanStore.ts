import { create } from 'zustand';
import { Loan, LoanStatus, initialLoans } from '@/data/loans';

interface LoanState {
  loans: Loan[];
  updateLoanStatus: (id: string, status: LoanStatus, date?: string) => void;
  assignOfficer: (id: string, officerName: string, officerPhone: string) => void;
}

export const useLoanStore = create<LoanState>((set) => ({
  loans: initialLoans,
  updateLoanStatus: (id, status, date) =>
    set((state) => ({
      loans: state.loans.map((l) => {
        if (l.id !== id) return l;
        const updates: Partial<Loan> = { status };
        if (status === 'Sanctioned') updates.sanctionedDate = date || new Date().toISOString().split('T')[0];
        if (status === 'Disbursed') updates.disbursedDate = date || new Date().toISOString().split('T')[0];
        return { ...l, ...updates };
      }),
    })),
  assignOfficer: (id, officerName, officerPhone) =>
    set((state) => ({
      loans: state.loans.map((l) =>
        l.id === id ? { ...l, officerName, officerPhone } : l
      ),
    })),
}));
