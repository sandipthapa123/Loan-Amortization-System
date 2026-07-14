import { describe, it, expect } from 'vitest';
import { LoanCalculator, PaymentInput } from '../services/LoanCalculator';

describe('LoanCalculator', () => {
  const defaultLoan = {
    principal: 10000,
    interestRate: 10,
    issueDate: '2024-01-01',
    dueDate: '2025-01-01',
    dayCountBasis: 'Actual/365' as const
  };

  describe('Ledger Generation & Accrual Limits', () => {
    it('generates a single row to due date if there are no payments', () => {
      const schedule = LoanCalculator.calculateSchedule(
        defaultLoan.principal,
        defaultLoan.interestRate,
        defaultLoan.issueDate,
        defaultLoan.dueDate,
        [],
        defaultLoan.dayCountBasis,
        'INTEREST_FIRST'
      );

      expect(schedule.length).toBe(1);
      expect(schedule[0].fromDate).toBe('2024-01-01');
      expect(schedule[0].toDate).toBe('2025-01-01');
      expect(schedule[0].days).toBe(366); // 2024 is a leap year!
    });

    it('processes payments exactly on the day they occur without gap or overlap', () => {
      const payments: PaymentInput[] = [
        { id: '1', date: '2024-06-01', amount: 5000 }
      ];

      const schedule = LoanCalculator.calculateSchedule(
        defaultLoan.principal,
        defaultLoan.interestRate,
        defaultLoan.issueDate,
        defaultLoan.dueDate,
        payments,
        defaultLoan.dayCountBasis,
        'INTEREST_FIRST'
      );

      expect(schedule.length).toBe(2);
      expect(schedule[0].fromDate).toBe('2024-01-01');
      expect(schedule[0].toDate).toBe('2024-06-01'); // Payment 1
      
      expect(schedule[1].fromDate).toBe('2024-06-01'); // Continuation
      expect(schedule[1].toDate).toBe('2025-01-01');   // To Due Date
    });
    
    it('handles multiple payments on the exact same day', () => {
      const payments: PaymentInput[] = [
        { id: '1', date: '2024-06-01', amount: 1000 },
        { id: '2', date: '2024-06-01', amount: 2000 }
      ];

      const schedule = LoanCalculator.calculateSchedule(
        defaultLoan.principal,
        defaultLoan.interestRate,
        defaultLoan.issueDate,
        defaultLoan.dueDate,
        payments,
        defaultLoan.dayCountBasis,
        'INTEREST_FIRST'
      );

      // Period 1: Jan 1 to Jun 1
      expect(schedule[0].toDate).toBe('2024-06-01');
      expect(schedule[0].days).toBeGreaterThan(0);
      
      // Period 2: Jun 1 to Jun 1 (0 days, but processes payment)
      expect(schedule[1].fromDate).toBe('2024-06-01');
      expect(schedule[1].toDate).toBe('2024-06-01');
      expect(schedule[1].days).toBe(0);
      expect(schedule[1].interest.toNumber()).toBe(0); // 0 days = 0 interest
      
      // Period 3: Jun 1 to Due Date
      expect(schedule[2].fromDate).toBe('2024-06-01');
      expect(schedule[2].toDate).toBe('2025-01-01');
    });
  });

  describe('Summary Report Date Logic', () => {
    it('truncates accrued interest calculation precisely at the report date', () => {
      // 10,000 at 10% for exactly 36.5 days = ~100 interest on Actual/365.
      // If report date is 73 days in, it should be 200 interest.
      const schedule = LoanCalculator.calculateSchedule(
        defaultLoan.principal,
        defaultLoan.interestRate,
        defaultLoan.issueDate,
        defaultLoan.dueDate,
        [],
        defaultLoan.dayCountBasis,
        'INTEREST_FIRST'
      );

      // Report Date exactly 73 days after Issue Date
      // 2024-01-01 + 73 days = 2024-03-14 (since 2024 is leap, Jan=31, Feb=29, Mar=13 + 1)
      const summary = LoanCalculator.calculateSummary(defaultLoan, schedule, '2024-03-14');
      
      // 73/365 * 10% * 10000 = 200
      expect(summary.interestAccrued.toNumber()).toBeCloseTo(200, 2);
    });

    it('ignores payments made after the report date', () => {
      const payments: PaymentInput[] = [
        { id: '1', date: '2024-08-01', amount: 5000 }
      ];

      const schedule = LoanCalculator.calculateSchedule(
        defaultLoan.principal,
        defaultLoan.interestRate,
        defaultLoan.issueDate,
        defaultLoan.dueDate,
        payments,
        defaultLoan.dayCountBasis,
        'INTEREST_FIRST'
      );

      // Report date is before payment
      const summary = LoanCalculator.calculateSummary(defaultLoan, schedule, '2024-06-01');
      
      expect(summary.principalRepaid.toNumber()).toBe(0);
      expect(summary.totalPaymentsReceived.toNumber()).toBe(0);
      expect(summary.currentPrincipal.toNumber()).toBe(10000);
    });
  });
});
