import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { DateService } from '@/services/DateService';
import { LoanCalculator } from '@/services/LoanCalculator';
import { DualDatePicker } from '@/components/DualDatePicker';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Info } from 'lucide-react';
import { format } from 'date-fns';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Dashboard() {
  const { summary, loans, payments, activeLoan, schedule, setActiveLoanId } = useAppStore();
  
  // Report date defaults to today
  const [reportDate, setReportDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const prevReportDate = useRef<string>(reportDate);
  const [announceText, setAnnounceText] = useState('');

  // Automatically select the first loan if none is active and loans exist
  useEffect(() => {
    if (!activeLoan && loans.length > 0) {
      setActiveLoanId(loans[0].id);
    }
  }, [activeLoan, loans, setActiveLoanId]);

  const chartData = useMemo(() => {
    if (!loans) return [];
    return loans.map(loan => {
      const loanPayments = payments?.filter(p => p.loanId === loan.id) || [];
      const totalPaid = loanPayments.reduce((acc, p) => acc + p.amount, 0);
      return {
        name: loan.borrower,
        Principal: loan.principal,
        Paid: totalPaid
      };
    });
  }, [loans, payments]);

  const financialSummary = useMemo(() => {
    if (!activeLoan) return null;
    return LoanCalculator.calculateSummary(activeLoan, schedule, reportDate);
  }, [activeLoan, schedule, reportDate]);

  useEffect(() => {
    if (activeLoan && reportDate !== prevReportDate.current) {
      setAnnounceText(`Loan summary recalculated for report date ${reportDate}`);
      prevReportDate.current = reportDate;
      
      // Clear announcement after screen reader reads it
      const timer = setTimeout(() => setAnnounceText(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [reportDate, activeLoan]);

  const summaryRows = financialSummary ? [
    { field: 'Original Principal', value: financialSummary.originalPrincipal.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Initial principal entered when the loan was created' },
    { field: 'Current Principal', value: financialSummary.currentPrincipal.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Current outstanding principal after all principal repayments' },
    { field: 'Principal Repaid', value: financialSummary.principalRepaid.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Total principal repaid' },
    { field: 'Principal Remaining', value: financialSummary.principalRemaining.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Remaining principal (Original Principal − Principal Repaid)' },
    { field: 'Interest Accrued', value: financialSummary.interestAccrued.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Total interest accrued to the selected report date' },
    { field: 'Interest Paid', value: financialSummary.interestPaid.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Total interest paid' },
    { field: 'Interest Outstanding', value: financialSummary.interestOutstanding.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Unpaid interest (Interest Accrued − Interest Paid)' },
    { field: 'Total Payments Received', value: financialSummary.totalPaymentsReceived.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Sum of all payments received regardless of allocation' },
    { field: 'Total Principal Payments', value: financialSummary.totalPrincipalPayments.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Total payments applied to principal' },
    { field: 'Total Interest Payments', value: financialSummary.totalInterestPayments.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Total payments applied to interest' },
    { field: 'Outstanding Balance', value: financialSummary.outstandingBalance.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Remaining balance (Principal Remaining + Interest Outstanding)' },
    { field: 'Total Amount Due (Report Date)', value: financialSummary.totalAmountDue.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Amount payable on the selected report date' },
    { field: 'Accrued Interest Since Last Payment', value: financialSummary.accruedInterestSinceLastPayment.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Interest accumulated after the most recent payment up to the selected report date' },
    { field: 'Settlement Amount Today', value: financialSummary.settlementAmountToday.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), tooltip: 'Amount required to completely settle the loan today' },
    { field: 'Loan Progress (%)', value: `${financialSummary.loanProgressPercentage.toFixed(2)}%`, tooltip: 'Percentage of principal repaid' },
    { field: 'Loan Age', value: financialSummary.loanAge, tooltip: 'Time elapsed since the issue date' },
    { field: 'Remaining Loan Term', value: financialSummary.remainingLoanTerm, tooltip: 'Time remaining until the due date' },
  ] : [];

  return (
    <div className="space-y-6">
      <div aria-live="polite" className="sr-only">
        {announceText}
      </div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">High-level view of all loans and active loan details.</p>
        </div>
        
        {loans.length > 0 && (
          <div className="w-full md:w-64">
            <Select value={activeLoan?.id || ''} onValueChange={setActiveLoanId}>
              <SelectTrigger>
                <SelectValue placeholder="Select active loan" />
              </SelectTrigger>
              <SelectContent>
                {loans.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.borrower} ({l.loanNumber || 'N/A'})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Principal Disbursed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPrincipal.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPayments.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeLoans}</div>
          </CardContent>
        </Card>
      </div>

      {activeLoan && financialSummary && (
        <Card className="border-primary/50 bg-primary/5 shadow-sm">
          <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <CardTitle>Loan Financial Summary ({activeLoan.borrower})</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Complete snapshot of the loan's financial position.</p>
            </div>
            <div className="w-full md:w-64 bg-background p-3 rounded-md border shadow-sm">
              <DualDatePicker 
                label="Report Date" 
                value={reportDate} 
                onChange={(d) => setReportDate(d)} 
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden bg-background">
              <Table>
                <TableBody>
                  {summaryRows.map((row, i) => (
                    <TableRow key={i} className="hover:bg-muted/30">
                      <TableCell className="font-medium bg-muted/20 w-1/2 border-r">
                        <div className="flex items-center gap-2">
                          {row.field}
                          <span title={row.tooltip} aria-label={row.tooltip}>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" aria-hidden="true" />
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{row.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Loan Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-sm" />
                <YAxis className="text-sm" />
                <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="Principal" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Paid" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
