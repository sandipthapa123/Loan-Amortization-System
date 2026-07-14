import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DateService } from '@/services/DateService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaymentsTable } from '@/components/PaymentsTable';
import { LoanFinancialSummaryTable } from '@/components/LoanFinancialSummaryTable';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export function Amortization() {
  const { activeLoanId, setActiveLoanId, activeLoan, schedule, loans, payments } = useAppStore();
  const loanPayments = activeLoan ? payments.filter(p => p.loanId === activeLoan.id) : [];

  const handleCopyTable = (tableId: string) => {
    const el = document.getElementById(tableId);
    if (el) {
      const rows = Array.from(el.querySelectorAll('tr'));
      const tsv = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => cell.textContent?.trim().replace(/\s+/g, ' ')).join('\t');
      }).join('\n');
      navigator.clipboard.writeText(tsv).then(() => toast.success('Schedule copied to clipboard!'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Amortization Schedule</h2>
        <div className="w-64">
          <Select value={activeLoanId || ''} onValueChange={setActiveLoanId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Loan" />
            </SelectTrigger>
            <SelectContent>
              {loans.map(loan => (
                <SelectItem key={loan.id} value={loan.id}>
                  {loan.borrower} - {loan.principal.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!activeLoan ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            Please select a loan to view its amortization schedule.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <LoanFinancialSummaryTable activeLoan={activeLoan} schedule={schedule} />
          
          <PaymentsTable loanId={activeLoan.id} payments={loanPayments} />
          
          <Card>
            <CardHeader>
              <CardTitle>Schedule Ledger</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto max-h-[600px]">
              <Table id="amortization-schedule-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>From Date (AD)</TableHead>
                    <TableHead>From Date (BS)</TableHead>
                    <TableHead>To Date (AD)</TableHead>
                    <TableHead>To Date (BS)</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Policy Used</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Interest Formula</TableHead>
                    <TableHead className="text-right">Accrued Interest</TableHead>
                    <TableHead className="text-right">Payment</TableHead>
                    <TableHead className="text-right">Interest Paid</TableHead>
                    <TableHead className="text-right">Principal Paid</TableHead>
                    <TableHead className="text-right">Unpaid Interest Bucket</TableHead>
                    <TableHead className="text-right">Closing Principal</TableHead>
                    <TableHead className="text-right">Total Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.map((row) => {
                    const remainingBalance = row.closingPrincipal.plus(row.unpaidInterestBucket);
                    
                    const policyLabel = row.allocationPolicyUsed === 'INTEREST_FIRST' ? 'Interest First' :
                                        row.allocationPolicyUsed === 'PRINCIPAL_FIRST' ? 'Principal First' :
                                        row.allocationPolicyUsed === 'MANUAL' ? 'Manual' :
                                        row.allocationPolicyUsed;

                    return (
                      <TableRow key={row.rowNumber}>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{row.fromDate}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{DateService.convertADtoBS(row.fromDate)}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{row.toDate}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{DateService.convertADtoBS(row.toDate)}</TableCell>
                        <TableCell>{row.days}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{policyLabel}</TableCell>
                        <TableCell className="text-right">{row.openingPrincipal.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">{row.interestFormula}</TableCell>
                        <TableCell className="text-right">{row.interest.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{row.payment.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{row.interestPaid.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{row.principalPaid.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-destructive">{row.unpaidInterestBucket.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{row.closingPrincipal.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">{remainingBalance.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {schedule.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={16} className="text-center text-muted-foreground py-8">
                        No payments recorded yet. Add payments to generate schedule.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {schedule.length > 0 && (
              <div className="flex justify-end p-4 pt-0 border-t mt-4">
                <Button variant="outline" size="sm" onClick={() => handleCopyTable('amortization-schedule-table')}>
                  <Copy className="mr-2 h-4 w-4" /> Copy Schedule
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
