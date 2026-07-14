import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/services/StorageService';
import { useNavigate } from 'react-router-dom';
import { DualDatePicker } from '@/components/DualDatePicker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useAppStore } from '@/store/useAppStore';

const loanSchema = z.object({
  borrower: z.string().min(1, 'Borrower name is required'),
  lender: z.string().min(1, 'Lender name is required'),
  principal: z.number().min(1, 'Principal must be greater than 0'),
  interestRate: z.number().min(0.01, 'Rate must be greater than 0'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  currency: z.string().min(1, 'Currency is required'),
  loanNumber: z.string(),
  interestType: z.string(),
  dayCountBasis: z.enum(['Actual/365', 'Actual/360', 'Actual/Actual']),
  allocationPolicy: z.enum(['INTEREST_FIRST', 'PRINCIPAL_FIRST', 'MANUAL', 'PROPORTIONAL']),
});

type LoanFormValues = z.infer<typeof loanSchema>;

export function LoanEntry() {
  const navigate = useNavigate();
  const setActiveLoanId = useAppStore(state => state.setActiveLoanId);
  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      borrower: '',
      lender: '',
      principal: 0,
      interestRate: 0,
      issueDate: '',
      dueDate: '',
      currency: 'NPR',
      loanNumber: '',
      interestType: 'Fixed',
      dayCountBasis: 'Actual/365',
      allocationPolicy: 'INTEREST_FIRST',
    }
  });

  const onSubmit = async (data: LoanFormValues) => {
    try {
      const newLoan = {
        id: uuidv4(),
        ...data,
        status: 'Active' as const,
        createdAt: Date.now()
      };
      await db.loans.add(newLoan);
      setActiveLoanId(newLoan.id);
      toast.success('Loan created successfully');
      navigate('/amortization');
    } catch (e) {
      toast.error('Failed to create loan');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Loan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="borrower" className="text-sm font-medium">Borrower</label>
                <Input id="borrower" {...form.register('borrower')} placeholder="John Doe" aria-label="Borrower Name" />
                {form.formState.errors.borrower && (
                  <p className="text-sm text-destructive" role="alert">{form.formState.errors.borrower.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="lender" className="text-sm font-medium">Lender / Bank</label>
                <Input id="lender" {...form.register('lender')} placeholder="Global Bank" aria-label="Lender Name" />
              </div>
              <div className="space-y-2">
                <label htmlFor="principal" className="text-sm font-medium">Principal Amount</label>
                <Input id="principal" type="number" step="0.01" {...form.register('principal', { valueAsNumber: true })} aria-label="Principal Amount" />
              </div>
              <div className="space-y-2">
                <label htmlFor="interestRate" className="text-sm font-medium">Annual Interest Rate (%)</label>
                <Input id="interestRate" type="number" step="0.01" {...form.register('interestRate', { valueAsNumber: true })} aria-label="Annual Interest Rate" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DualDatePicker 
                label="Issue Date" 
                value={form.watch('issueDate')} 
                onChange={(v) => form.setValue('issueDate', v, { shouldValidate: true })} 
              />
              <DualDatePicker 
                label="Due Date" 
                value={form.watch('dueDate')} 
                onChange={(v) => form.setValue('dueDate', v, { shouldValidate: true })} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="dayCountBasis" className="text-sm font-medium">Day Count Basis</label>
                <Select onValueChange={(v: any) => form.setValue('dayCountBasis', v)} defaultValue={form.getValues('dayCountBasis')}>
                  <SelectTrigger id="dayCountBasis" aria-label="Day Count Basis">
                    <SelectValue placeholder="Select basis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Actual/365">Actual/365</SelectItem>
                    <SelectItem value="Actual/360">Actual/360</SelectItem>
                    <SelectItem value="Actual/Actual">Actual/Actual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="currency" className="text-sm font-medium">Currency</label>
                <Input id="currency" {...form.register('currency')} aria-label="Currency" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label htmlFor="allocationPolicy" className="text-sm font-medium">Payment Allocation Policy</label>
                <Select onValueChange={(v: any) => form.setValue('allocationPolicy', v)} defaultValue={form.getValues('allocationPolicy')}>
                  <SelectTrigger id="allocationPolicy" aria-label="Payment Allocation Policy">
                    <SelectValue placeholder="Select Policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTEREST_FIRST">Interest First (Recommended / Banking Standard)</SelectItem>
                    <SelectItem value="PRINCIPAL_FIRST">Principal First</SelectItem>
                    <SelectItem value="MANUAL">Manual Allocation (Per Payment)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground mt-1">
                  {form.watch('allocationPolicy') === 'INTEREST_FIRST' && 'Every payment is first used to pay any accrued interest. Only the remaining amount, if any, reduces the outstanding principal.'}
                  {form.watch('allocationPolicy') === 'PRINCIPAL_FIRST' && 'Every payment first reduces the outstanding principal. Any remaining amount is then applied to accrued interest.'}
                  {form.watch('allocationPolicy') === 'MANUAL' && 'Allow manual splitting of each payment into Interest and Principal portions.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Create Loan</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
