import React, { useMemo, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { LoanFinancialSummaryTable } from '@/components/LoanFinancialSummaryTable';

export function Dashboard() {
  const { summary, loans, payments, activeLoan, schedule, setActiveLoanId } = useAppStore();

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

  return (
    <div className="space-y-6">
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

      <LoanFinancialSummaryTable activeLoan={activeLoan} schedule={schedule} />

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
