import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DateCalculationService } from '@/services/DateCalculationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { PaymentsTable } from '@/components/PaymentsTable';
import { LoanFinancialSummaryTable } from '@/components/LoanFinancialSummaryTable';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';

import { copyTableToClipboard } from '@/lib/utils';
import { PolicySwitch } from '@/components/PolicySwitch';

export function Amortization() {
  const { activeLoanId, setActiveLoanId, activeLoan, schedule, loans, payments } = useAppStore();
  const loanPayments = activeLoan ? payments.filter(p => p.loanId === activeLoan.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Amortization Schedule</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {activeLoan && <PolicySwitch />}
          <div className="w-full md:w-64">
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
                        <TableCell className="text-xs whitespace-nowrap">{DateCalculationService.convertADtoBS(row.fromDate)}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{row.toDate}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{DateCalculationService.convertADtoBS(row.toDate)}</TableCell>
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
                {schedule.length > 0 && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={9} className="text-right font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">
                        {schedule.reduce((sum, row) => sum + row.interest.toNumber(), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {schedule.reduce((sum, row) => sum + row.payment.toNumber(), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {schedule.reduce((sum, row) => sum + row.interestPaid.toNumber(), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {schedule.reduce((sum, row) => sum + row.principalPaid.toNumber(), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </CardContent>
            {schedule.length > 0 && (
              <div className="flex justify-end p-4 pt-0 border-t mt-4">
                <Button variant="outline" size="sm" onClick={() => copyTableToClipboard('amortization-schedule-table')}>
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
