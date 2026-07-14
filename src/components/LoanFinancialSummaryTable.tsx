import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DualDatePicker } from '@/components/DualDatePicker';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Copy, Info } from 'lucide-react';
import { format } from 'date-fns';
import { LoanCalculator } from '@/services/LoanCalculator';
import { AmortizationRow } from '@/services/LoanCalculator';
import { Button } from './ui/button';
import toast from 'react-hot-toast';

interface LoanFinancialSummaryTableProps {
  activeLoan: any;
  schedule: AmortizationRow[];
}

export function LoanFinancialSummaryTable({ activeLoan, schedule }: LoanFinancialSummaryTableProps) {
  // Report date defaults to today
  const [reportDate, setReportDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const prevReportDate = useRef<string>(reportDate);
  const [announceText, setAnnounceText] = useState('');

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

  const handleCopyTable = () => {
    const el = document.getElementById('financial-summary-table');
    if (el) {
      const rows = Array.from(el.querySelectorAll('tr'));
      const tsv = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => cell.textContent?.trim().replace(/\s+/g, ' ')).join('\t');
      }).join('\n');
      navigator.clipboard.writeText(tsv).then(() => toast.success('Table copied to clipboard!'));
    }
  };

  if (!activeLoan || !financialSummary) return null;

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {announceText}
      </div>
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
            <Table id="financial-summary-table">
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
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={handleCopyTable}>
              <Copy className="mr-2 h-4 w-4" /> Copy Table
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
