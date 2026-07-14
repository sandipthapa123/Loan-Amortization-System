import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DualDatePicker } from '@/components/DualDatePicker';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Copy } from 'lucide-react';
import { format } from 'date-fns';
import { LoanCalculator } from '@/services/LoanCalculator';
import { AmortizationRow } from '@/services/LoanCalculator';
import { Button } from './ui/button';
import toast from 'react-hot-toast';

import { copyTableToClipboard } from '@/lib/utils';

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
    { field: 'Original Principal', value: financialSummary.originalPrincipal.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), remarks: 'Initial principal entered when the loan was created' },
    { field: 'Current Principal', value: financialSummary.currentPrincipal.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), remarks: 'Current outstanding principal after all principal repayments' },
    { field: 'Principal Repaid', value: financialSummary.principalRepaid.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), remarks: 'Total principal repaid' },
    { field: 'Interest Accrued', value: financialSummary.interestAccrued.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), remarks: 'Total interest accrued to the selected report date' },
    { field: 'Total Loan Value', value: financialSummary.totalLoanValue.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), remarks: 'Original Principal + Total projected interest from Issue Date to Due Date' },
    { field: 'Interest Paid', value: financialSummary.interestPaid.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), remarks: 'Total interest paid' },
    { field: 'Interest Outstanding', value: financialSummary.interestOutstanding.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), remarks: 'Unpaid interest (Interest Accrued − Interest Paid)' },
    { field: 'Total Payments Received', value: financialSummary.totalPaymentsReceived.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), remarks: 'Sum of all payments received regardless of allocation' },
    { field: 'Outstanding Balance', value: financialSummary.outstandingBalance.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), remarks: 'Remaining balance (Current Principal + Interest Outstanding)' },
    { field: 'Accrued Interest Since Last Payment', value: financialSummary.accruedInterestSinceLastPayment.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), remarks: 'Interest accumulated after the most recent payment up to the selected report date' },
    { field: 'Settlement Amount Today', value: financialSummary.settlementAmountToday.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), remarks: 'Total paying requirements minus already total paid.' },
    { field: 'Loan Progress (%)', value: `${financialSummary.loanProgressPercentage.toFixed(2)}%`, remarks: 'Percentage of principal repaid' },
    { field: 'Loan Age', value: financialSummary.loanAge, remarks: 'Time elapsed since the issue date' },
    { field: 'Remaining Loan Term', value: financialSummary.remainingLoanTerm, remarks: 'Time remaining until the due date' },
  ] : [];

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
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-1/3">Field</TableHead>
                  <TableHead className="w-1/4">Value (Rs.)</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryRows.map((row, i) => (
                  <TableRow key={i} className="hover:bg-muted/30">
                    <TableCell className="font-medium bg-muted/20 border-r">
                      {row.field}
                    </TableCell>
                    <TableCell className="font-semibold whitespace-nowrap">{row.value}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.remarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" onClick={() => copyTableToClipboard('financial-summary-table')}>
              <Copy className="mr-2 h-4 w-4" /> Copy Table
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
