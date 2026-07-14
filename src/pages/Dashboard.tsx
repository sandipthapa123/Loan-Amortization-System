import React, { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DateService } from '@/services/DateService';

export function Dashboard() {
  const { summary, loans, payments, activeLoan, schedule } = useAppStore();

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

  const activeLoanStats = useMemo(() => {
    if (!activeLoan) return null;
    const loanPayments = payments.filter(p => p.loanId === activeLoan.id);
    const totalPaymentsAmount = loanPayments.reduce((acc, p) => acc + p.amount, 0);
    
    // Get latest schedule row
    const latestRow = schedule.length > 0 ? schedule[schedule.length - 1] : null;
    const outstandingPrincipal = latestRow ? latestRow.closingPrincipal.toNumber() : activeLoan.principal;
    
    return {
      loanNumber: activeLoan.loanNumber || 'N/A',
      borrower: activeLoan.borrower,
      principal: activeLoan.principal,
      interestRate: activeLoan.interestRate,
      issueDateAD: activeLoan.issueDate,
      issueDateBS: DateService.convertADtoBS(activeLoan.issueDate),
      dueDateAD: activeLoan.dueDate,
      dueDateBS: DateService.convertADtoBS(activeLoan.dueDate),
      allocationPolicy: activeLoan.allocationPolicy || 'INTEREST_FIRST',
      outstandingPrincipal: outstandingPrincipal,
      outstandingInterest: latestRow ? latestRow.unpaidInterestBucket.toNumber() : 0, 
      totalPayments: totalPaymentsAmount,
      remainingBalance: outstandingPrincipal + (latestRow ? latestRow.unpaidInterestBucket.toNumber() : 0)
    };
  }, [activeLoan, payments, schedule]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">High-level view of all loans and active loan details.</p>
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

      {activeLoanStats && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Active Loan Details ({activeLoanStats.borrower})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Loan Number</span>
                <span className="font-medium">{activeLoanStats.loanNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Borrower</span>
                <span className="font-medium">{activeLoanStats.borrower}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Principal</span>
                <span className="font-medium">{activeLoanStats.principal.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Interest Rate</span>
                <span className="font-medium">{activeLoanStats.interestRate}%</span>
              </div>
              
              <div>
                <span className="text-muted-foreground block mb-1">Issue Date (AD)</span>
                <span className="font-medium">{activeLoanStats.issueDateAD}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Issue Date (BS)</span>
                <span className="font-medium">{activeLoanStats.issueDateBS}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Due Date (AD)</span>
                <span className="font-medium">{activeLoanStats.dueDateAD}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Due Date (BS)</span>
                <span className="font-medium">{activeLoanStats.dueDateBS}</span>
              </div>

              <div>
                <span className="text-muted-foreground block mb-1">Allocation Policy</span>
                <span className="font-medium">{activeLoanStats.allocationPolicy}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Total Payments</span>
                <span className="font-medium">{activeLoanStats.totalPayments.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Outstanding Principal</span>
                <span className="font-medium text-destructive">{activeLoanStats.outstandingPrincipal.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Remaining Balance</span>
                <span className="font-medium">{activeLoanStats.remainingBalance.toLocaleString()}</span>
              </div>
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
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
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
