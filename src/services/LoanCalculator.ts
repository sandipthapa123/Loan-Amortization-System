import Decimal from 'decimal.js';
import { DateService, DayCountBasis } from './DateService';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface PaymentInput {
  id: string;
  date: string; // AD string
  amount: number;
  allocationPolicy?: 'LOAN_DEFAULT' | 'INTEREST_FIRST' | 'PRINCIPAL_FIRST' | 'MANUAL';
  manualInterestPaid?: number;
  manualPrincipalPaid?: number;
}

export interface AmortizationRow {
  rowNumber: number;
  fromDate: string;
  toDate: string;
  days: number;
  allocationPolicyUsed: string;
  openingPrincipal: Decimal;
  interestFormula: string;
  interest: Decimal;
  payment: Decimal;
  interestPaid: Decimal;
  principalPaid: Decimal;
  unpaidInterestBucket: Decimal;
  closingPrincipal: Decimal;
  runningInterest: Decimal;
  runningPrincipal: Decimal;
  runningPayments: Decimal;
}

export class LoanCalculator {
  static calculateSchedule(
    principal: number,
    annualInterestRate: number,
    issueDate: string,
    dueDate: string,
    payments: PaymentInput[],
    basis: DayCountBasis,
    defaultAllocationPolicy: 'INTEREST_FIRST' | 'PRINCIPAL_FIRST' | 'MANUAL' | 'PROPORTIONAL' = 'INTEREST_FIRST'
  ): AmortizationRow[] {
    const schedule: AmortizationRow[] = [];
    
    // Sort payments by date ascending
    const sortedPayments = [...payments].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let currentPrincipal = new Decimal(principal);
    let currentUnpaidInterest = new Decimal(0);
    let previousDate = issueDate;
    
    let runningInterest = new Decimal(0);
    let runningPrincipal = new Decimal(0);
    let runningPayments = new Decimal(0);
    
    let rowNumber = 1;

    // Helper to process a period
    const processPeriod = (fromDate: string, toDate: string, payment: PaymentInput | null) => {
      const days = Math.max(0, DateService.getDaysDifference(fromDate, toDate));
      const rate = new Decimal(annualInterestRate).dividedBy(100);
      const yearFraction = new Decimal(DateService.getYearFraction(days, basis, new Date(fromDate).getFullYear()));
      
      const interest = currentPrincipal.times(rate).times(yearFraction);
      
      const basisDivisor = basis === 'Actual/360' ? '360' : basis === 'Actual/365' ? '365' : 'Actual';
      const interestFormula = `${currentPrincipal.toFixed(2)} × ${annualInterestRate}% × (${days} / ${basisDivisor})`;
      
      // Total interest due includes newly accrued + previously unpaid
      const totalInterestDue = interest.plus(currentUnpaidInterest);
      
      const effectivePolicy = (!payment || !payment.allocationPolicy || payment.allocationPolicy === 'LOAN_DEFAULT') 
        ? defaultAllocationPolicy 
        : payment.allocationPolicy;

      const paymentAmount = payment ? new Decimal(payment.amount) : new Decimal(0);
      let interestPaid = new Decimal(0);
      let principalPaid = new Decimal(0);

      if (effectivePolicy === 'INTEREST_FIRST') {
        interestPaid = Decimal.min(totalInterestDue, paymentAmount);
        principalPaid = paymentAmount.minus(interestPaid);
      } else if (effectivePolicy === 'PRINCIPAL_FIRST') {
        principalPaid = Decimal.min(currentPrincipal, paymentAmount);
        let remainingPayment = paymentAmount.minus(principalPaid);
        interestPaid = Decimal.min(totalInterestDue, remainingPayment);
        remainingPayment = remainingPayment.minus(interestPaid);
        principalPaid = principalPaid.plus(remainingPayment);
      } else if (effectivePolicy === 'PROPORTIONAL') {
        const totalDue = totalInterestDue.plus(currentPrincipal);
        if (totalDue.greaterThan(0)) {
          const interestRatio = totalInterestDue.dividedBy(totalDue);
          const principalRatio = currentPrincipal.dividedBy(totalDue);
          interestPaid = paymentAmount.times(interestRatio);
          principalPaid = paymentAmount.times(principalRatio);
        } else {
          principalPaid = paymentAmount;
          interestPaid = new Decimal(0);
        }
      } else if (effectivePolicy === 'MANUAL') {
        interestPaid = new Decimal(payment?.manualInterestPaid || 0);
        principalPaid = new Decimal(payment?.manualPrincipalPaid || 0);
      }

      // Update unpaid interest bucket
      currentUnpaidInterest = totalInterestDue.minus(interestPaid);
      
      // Note: we never capitalize interest. The principal only reduces.
      const closingPrincipal = currentPrincipal.minus(principalPaid);
      
      runningInterest = runningInterest.plus(interest);
      runningPrincipal = runningPrincipal.plus(principalPaid);
      runningPayments = runningPayments.plus(paymentAmount);

      schedule.push({
        rowNumber,
        fromDate,
        toDate,
        days,
        allocationPolicyUsed: effectivePolicy,
        openingPrincipal: currentPrincipal,
        interestFormula,
        interest,
        payment: paymentAmount,
        interestPaid,
        principalPaid,
        unpaidInterestBucket: currentUnpaidInterest,
        closingPrincipal,
        runningInterest,
        runningPrincipal,
        runningPayments
      });

      currentPrincipal = closingPrincipal;
      previousDate = toDate;
      rowNumber++;
    };

    // If no payments, just generate one row up to due date
    if (sortedPayments.length === 0) {
      processPeriod(issueDate, dueDate, null);
      return schedule;
    }

    // Process all payments
    for (const payment of sortedPayments) {
      if (currentPrincipal.lessThanOrEqualTo(0)) break; // Stop if already paid off
      processPeriod(previousDate, payment.date, payment);
    }

    // After all payments, if there's still a balance and the last payment was before the due date, generate final row
    if (currentPrincipal.greaterThan(0)) {
      const lastPaymentDate = sortedPayments[sortedPayments.length - 1].date;
      if (new Date(lastPaymentDate).getTime() < new Date(dueDate).getTime()) {
        processPeriod(previousDate, dueDate, null);
      }
    }

    return schedule;
  }

  static calculateSummary(
    loan: any, 
    schedule: AmortizationRow[], 
    reportDate: string
  ): LoanFinancialSummary {
    const originalPrincipal = new Decimal(loan.principal);
    
    let principalRepaid = new Decimal(0);
    let interestPaid = new Decimal(0);
    let totalPaymentsReceived = new Decimal(0);
    let scheduleInterestAccrued = new Decimal(0);
    
    let lastProcessedDate = loan.issueDate;
    let currentPrincipal = originalPrincipal;
    let scheduleUnpaidInterest = new Decimal(0);

    const reportDateTime = new Date(reportDate).getTime();

    for (const row of schedule) {
      const fromDateTime = new Date(row.fromDate).getTime();
      const toDateTime = new Date(row.toDate).getTime();

      if (toDateTime <= reportDateTime) {
        principalRepaid = principalRepaid.plus(row.principalPaid);
        interestPaid = interestPaid.plus(row.interestPaid);
        totalPaymentsReceived = totalPaymentsReceived.plus(row.payment);
        scheduleInterestAccrued = scheduleInterestAccrued.plus(row.interest);
        
        lastProcessedDate = row.toDate;
        currentPrincipal = row.closingPrincipal;
        scheduleUnpaidInterest = row.unpaidInterestBucket;
      } else if (fromDateTime < reportDateTime) {
        // Row crosses the report date. Accrue prorated interest up to report date.
        const days = DateService.getDaysDifference(row.fromDate, reportDate);
        const rate = new Decimal(loan.interestRate).dividedBy(100);
        const yearFraction = new Decimal(DateService.getYearFraction(days, loan.dayCountBasis, new Date(row.fromDate).getFullYear()));
        const proratedInterest = row.openingPrincipal.times(rate).times(yearFraction);
        
        scheduleInterestAccrued = scheduleInterestAccrued.plus(proratedInterest);
        scheduleUnpaidInterest = scheduleUnpaidInterest.plus(proratedInterest);
        lastProcessedDate = reportDate;
        break;
      } else {
        break; // Future row
      }
    }

    let accruedInterestSinceLastPayment = new Decimal(0);
    if (new Date(reportDate).getTime() > new Date(lastProcessedDate).getTime() && currentPrincipal.greaterThan(0)) {
      const days = DateService.getDaysDifference(lastProcessedDate, reportDate);
      const rate = new Decimal(loan.interestRate).dividedBy(100);
      const yearFraction = new Decimal(DateService.getYearFraction(days, loan.dayCountBasis, new Date(lastProcessedDate).getFullYear()));
      accruedInterestSinceLastPayment = currentPrincipal.times(rate).times(yearFraction);
    }

    const interestAccrued = scheduleInterestAccrued.plus(accruedInterestSinceLastPayment);
    const interestOutstanding = scheduleUnpaidInterest.plus(accruedInterestSinceLastPayment);
    const principalRemaining = originalPrincipal.minus(principalRepaid); // Should match currentPrincipal
    const outstandingBalance = principalRemaining.plus(interestOutstanding);
    const loanProgressPercentage = originalPrincipal.greaterThan(0)
      ? principalRepaid.dividedBy(originalPrincipal).times(100).toNumber()
      : 0;

    // Calculate Total Loan Value at Due Date
    let totalProjectedInterest = new Decimal(0);
    for (const row of schedule) {
      if (new Date(row.toDate).getTime() <= new Date(loan.dueDate).getTime()) {
        totalProjectedInterest = totalProjectedInterest.plus(row.interest);
      } else {
        if (new Date(row.fromDate).getTime() < new Date(loan.dueDate).getTime()) {
          const daysToDueDate = DateService.getDaysDifference(row.fromDate, loan.dueDate);
          const rate = new Decimal(loan.interestRate).dividedBy(100);
          const yearFrac = new Decimal(DateService.getYearFraction(daysToDueDate, loan.dayCountBasis, new Date(row.fromDate).getFullYear()));
          const proratedInterest = row.openingPrincipal.times(rate).times(yearFrac);
          totalProjectedInterest = totalProjectedInterest.plus(proratedInterest);
        }
        break;
      }
    }
    const totalLoanValue = originalPrincipal.plus(totalProjectedInterest);

    return {
      originalPrincipal,
      currentPrincipal,
      principalRepaid,
      principalRemaining,
      interestAccrued,
      interestPaid,
      interestOutstanding,
      totalPaymentsReceived,
      totalPrincipalPayments: principalRepaid,
      totalInterestPayments: interestPaid,
      outstandingBalance,
      totalAmountDue: outstandingBalance,
      accruedInterestSinceLastPayment,
      settlementAmountToday: outstandingBalance,
      loanProgressPercentage,
      totalProjectedInterestToDueDate: totalProjectedInterest,
      totalLoanValue,
      loanAge: DateService.getDuration(loan.issueDate, new Date().toISOString().split('T')[0]),
      remainingLoanTerm: DateService.getDuration(new Date().toISOString().split('T')[0], loan.dueDate)
    };
  }
}

export interface LoanFinancialSummary {
  originalPrincipal: Decimal;
  currentPrincipal: Decimal;
  principalRepaid: Decimal;
  principalRemaining: Decimal;
  interestAccrued: Decimal;
  interestPaid: Decimal;
  interestOutstanding: Decimal;
  totalPaymentsReceived: Decimal;
  totalPrincipalPayments: Decimal;
  totalInterestPayments: Decimal;
  outstandingBalance: Decimal;
  totalAmountDue: Decimal;
  accruedInterestSinceLastPayment: Decimal;
  settlementAmountToday: Decimal;
  loanProgressPercentage: number;
  totalProjectedInterestToDueDate: Decimal;
  totalLoanValue: Decimal;
  loanAge: string;
  remainingLoanTerm: string;
}
