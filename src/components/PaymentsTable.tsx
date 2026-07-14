import React, { useState } from 'react';
import { Payment, db } from '@/services/StorageService';
import { DateService } from '@/services/DateService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Copy, Plus } from 'lucide-react';
import { DualDatePicker } from './DualDatePicker';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

import { copyTableToClipboard } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface PaymentsTableProps {
  loanId: string;
  payments: Payment[];
}

export function PaymentsTable({ loanId, payments }: PaymentsTableProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [allocationPolicy, setAllocationPolicy] = useState<any>('LOAN_DEFAULT');
  const [manualInterestPaid, setManualInterestPaid] = useState('');
  const [manualPrincipalPaid, setManualPrincipalPaid] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!date || !amount) {
      toast.error('Date and amount are required');
      return;
    }

    const numAmount = Number(amount);
    let intPaid: number | undefined = undefined;
    let prinPaid: number | undefined = undefined;

    if (allocationPolicy === 'MANUAL') {
      intPaid = Number(manualInterestPaid);
      prinPaid = Number(manualPrincipalPaid);
      
      // small delta for floating point comparison
      if (Math.abs((intPaid + prinPaid) - numAmount) > 0.001) {
        toast.error('Manual Interest + Principal must equal the Total Amount');
        return;
      }
    }
    
    try {
      const paymentData = {
        date,
        amount: numAmount,
        allocationPolicy,
        manualInterestPaid: intPaid,
        manualPrincipalPaid: prinPaid,
        reference,
        notes
      };

      if (editingPayment) {
        await db.payments.update(editingPayment.id, paymentData);
        toast.success('Payment updated');
      } else {
        await db.payments.add({
          ...paymentData,
          id: uuidv4(),
          loanId,
          createdAt: Date.now()
        });
        toast.success('Payment added');
      }
      setIsAddOpen(false);
      setEditingPayment(null);
      resetForm();
    } catch (e) {
      toast.error('Failed to save payment');
    }
  };

  const resetForm = () => {
    setDate('');
    setAmount('');
    setAllocationPolicy('LOAN_DEFAULT');
    setManualInterestPaid('');
    setManualPrincipalPaid('');
    setReference('');
    setNotes('');
  };

  const handleEdit = (p: Payment) => {
    setEditingPayment(p);
    setDate(p.date);
    setAmount(p.amount.toString());
    setAllocationPolicy(p.allocationPolicy || 'LOAN_DEFAULT');
    setManualInterestPaid(p.manualInterestPaid !== undefined ? p.manualInterestPaid.toString() : '');
    setManualPrincipalPaid(p.manualPrincipalPaid !== undefined ? p.manualPrincipalPaid.toString() : '');
    setReference(p.reference || '');
    setNotes(p.notes || '');
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this payment?')) {
      await db.payments.delete(id);
      toast.success('Payment deleted');
    }
  };

  const handleDuplicate = async (p: Payment) => {
    await db.payments.add({
      ...p,
      id: uuidv4(),
      createdAt: Date.now()
    });
    toast.success('Payment duplicated');
  };

  const loan = useAppStore(state => state.loans.find(l => l.id === loanId));
  const defaultPolicy = loan?.allocationPolicy || 'INTEREST_FIRST';

  const getPolicyLabel = (policy: string | undefined) => {
    const actualPolicy = (!policy || policy === 'LOAN_DEFAULT') ? defaultPolicy : policy;
    const suffix = (!policy || policy === 'LOAN_DEFAULT') ? ' (Loan Default)' : '';
    
    switch (actualPolicy) {
      case 'INTEREST_FIRST': return 'Interest First' + suffix;
      case 'PRINCIPAL_FIRST': return 'Principal First' + suffix;
      case 'PROPORTIONAL': return 'Proportional' + suffix;
      case 'MANUAL': return 'Manual' + suffix;
      default: return 'Interest First' + suffix;
    }
  };

  const sortedPaymentsAsc = [...payments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let runningTotal = 0;
  const paymentsWithCumulative = sortedPaymentsAsc.map(p => {
    runningTotal += p.amount;
    return { ...p, cumulativeAmount: runningTotal };
  });
  const sortedPaymentsDesc = [...paymentsWithCumulative].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payments</h3>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setEditingPayment(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPayment ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <DualDatePicker label="Payment Date" value={date} onChange={setDate} />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Override Policy</label>
                  <Select value={allocationPolicy} onValueChange={setAllocationPolicy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select override" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOAN_DEFAULT">Use Loan Default</SelectItem>
                      <SelectItem value="INTEREST_FIRST">Interest First</SelectItem>
                      <SelectItem value="PRINCIPAL_FIRST">Principal First</SelectItem>
                      <SelectItem value="MANUAL">Manual Allocation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {allocationPolicy === 'MANUAL' && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-md border">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interest Portion</label>
                    <Input type="number" step="0.01" value={manualInterestPaid} onChange={(e) => setManualInterestPaid(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Principal Portion</label>
                    <Input type="number" step="0.01" value={manualPrincipalPaid} onChange={(e) => setManualPrincipalPaid(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reference</label>
                  <Input value={reference} onChange={(e) => setReference(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <Button className="w-full" onClick={handleSave}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md max-h-[300px] overflow-auto">
        <Table id="payments-table">
          <TableHeader>
            <TableRow>
              <TableHead>Date (AD)</TableHead>
              <TableHead>Date (BS)</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Cumulative Amount</TableHead>
              <TableHead>Policy</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPaymentsDesc.map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.date}</TableCell>
                <TableCell>{DateService.convertADtoBS(p.date)}</TableCell>
                <TableCell className="text-right font-semibold">{p.amount.toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold text-muted-foreground">{p.cumulativeAmount.toLocaleString()}</TableCell>
                <TableCell>
                  {getPolicyLabel(p.allocationPolicy)}
                  {p.allocationPolicy === 'MANUAL' && <span className="text-xs text-muted-foreground block">(I: {p.manualInterestPaid}, P: {p.manualPrincipalPaid})</span>}
                </TableCell>
                <TableCell>{p.reference}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} aria-label="Edit payment">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDuplicate(p)} aria-label="Duplicate payment">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} aria-label="Delete payment">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {sortedPaymentsDesc.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">No payments found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {sortedPaymentsDesc.length > 0 && (
        <div className="flex justify-end mt-2">
          <Button variant="outline" size="sm" onClick={() => copyTableToClipboard('payments-table')}>
            <Copy className="mr-2 h-4 w-4" /> Copy Table
          </Button>
        </div>
      )}
    </div>
  );
}
