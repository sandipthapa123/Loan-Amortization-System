import Dexie, { type EntityTable } from 'dexie';

export interface Loan {
  id: string;
  borrower: string;
  lender: string;
  principal: number;
  interestRate: number;
  issueDate: string; // AD string
  dueDate: string; // AD string
  currency: string;
  loanNumber: string;
  interestType: string;
  dayCountBasis: 'Actual/365' | 'Actual/360' | 'Actual/Actual';
  allocationPolicy: 'INTEREST_FIRST' | 'PRINCIPAL_FIRST' | 'MANUAL' | 'PROPORTIONAL';
  status: 'Active' | 'Settled';
  createdAt: number;
}

export interface Payment {
  id: string;
  loanId: string;
  date: string; // AD string
  amount: number;
  allocationPolicy?: 'LOAN_DEFAULT' | 'INTEREST_FIRST' | 'PRINCIPAL_FIRST' | 'MANUAL';
  manualInterestPaid?: number;
  manualPrincipalPaid?: number;
  reference: string;
  notes: string;
  createdAt: number;
}

export interface AppPreferences {
  id: number;
  theme: 'light' | 'dark' | 'high-contrast';
  language: 'en' | 'ne';
}

const db = new Dexie('LoanAmortizationDB') as Dexie & {
  loans: EntityTable<Loan, 'id'>;
  payments: EntityTable<Payment, 'id'>;
  preferences: EntityTable<AppPreferences, 'id'>;
};

db.version(1).stores({
  loans: 'id, borrower, issueDate, status',
  payments: 'id, loanId, date',
  preferences: 'id'
});

export { db };
