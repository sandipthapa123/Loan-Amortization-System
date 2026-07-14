import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Loan, Payment } from '@/services/StorageService';
import { AmortizationRow, LoanCalculator } from '@/services/LoanCalculator';

type Theme = 'light' | 'dark' | 'high-contrast';

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: 'en' | 'ne';
  setLanguage: (lang: 'en' | 'ne') => void;
  
  // SSOT State
  activeLoanId: string | null;
  setActiveLoanId: (id: string | null) => void;
  
  loans: Loan[];
  payments: Payment[];
  activeLoan: Loan | null;
  schedule: AmortizationRow[];
  summary: {
    totalPrincipal: number;
    totalPayments: number;
    activeLoans: number;
  };
  
  syncData: (loans: Loan[], payments: Payment[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      language: 'en',
      setLanguage: (language) => set({ language }),
      
      activeLoanId: null,
      setActiveLoanId: (activeLoanId) => set((state) => {
        // Trigger a re-sync immediately using existing loans/payments
        const activeLoan = state.loans.find(l => l.id === activeLoanId) || null;
        const loanPayments = activeLoan ? state.payments.filter(p => p.loanId === activeLoan.id) : [];
        const schedule = activeLoan
          ? LoanCalculator.calculateSchedule(
              activeLoan.principal,
              activeLoan.interestRate,
              activeLoan.issueDate,
              activeLoan.dueDate,
              loanPayments.map(p => ({ 
                id: p.id, 
                date: p.date, 
                amount: p.amount,
                allocationPolicy: p.allocationPolicy,
                manualInterestPaid: p.manualInterestPaid,
                manualPrincipalPaid: p.manualPrincipalPaid
              })),
              activeLoan.dayCountBasis,
              activeLoan.allocationPolicy
            )
          : [];
        return { activeLoanId, activeLoan, schedule };
      }),
      
      loans: [],
      payments: [],
      activeLoan: null,
      schedule: [],
      summary: {
        totalPrincipal: 0,
        totalPayments: 0,
        activeLoans: 0
      },
      
      syncData: (loans, payments) => set((state) => {
        const totalPrincipal = loans.reduce((acc, loan) => acc + loan.principal, 0);
        const totalPayments = payments.reduce((acc, payment) => acc + payment.amount, 0);
        const activeLoans = loans.filter(l => l.status === 'Active').length;
        
        const summary = { totalPrincipal, totalPayments, activeLoans };
        
        const activeLoan = loans.find(l => l.id === state.activeLoanId) || null;
        const loanPayments = activeLoan ? payments.filter(p => p.loanId === activeLoan.id) : [];
        const schedule = activeLoan
          ? LoanCalculator.calculateSchedule(
              activeLoan.principal,
              activeLoan.interestRate,
              activeLoan.issueDate,
              activeLoan.dueDate,
              loanPayments.map(p => ({ 
                id: p.id, 
                date: p.date, 
                amount: p.amount,
                allocationPolicy: p.allocationPolicy,
                manualInterestPaid: p.manualInterestPaid,
                manualPrincipalPaid: p.manualPrincipalPaid
              })),
              activeLoan.dayCountBasis,
              activeLoan.allocationPolicy
            )
          : [];
          
        return { loans, payments, summary, activeLoan, schedule };
      }),
    }),
    {
      name: 'loan-calculator-state',
      partialize: (state) => ({ 
        theme: state.theme, 
        language: state.language, 
        activeLoanId: state.activeLoanId 
      }), // only persist preferences and activeLoanId
    }
  )
);
