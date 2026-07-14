import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { db } from '@/services/StorageService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

export function PolicySwitch() {
  const { activeLoan } = useAppStore();

  if (!activeLoan) return null;

  const handlePolicyChange = async (newPolicy: 'INTEREST_FIRST' | 'PRINCIPAL_FIRST' | 'MANUAL' | 'PROPORTIONAL') => {
    try {
      await db.loans.update(activeLoan.id, { allocationPolicy: newPolicy });
      
      const policyLabels = {
        'INTEREST_FIRST': 'Interest First',
        'PRINCIPAL_FIRST': 'Principal First',
        'MANUAL': 'Manual Allocation',
        'PROPORTIONAL': 'Proportional'
      };
      
      toast.success(`The loan has been recalculated using the ${policyLabels[newPolicy]} payment allocation policy.`);
    } catch (e) {
      toast.error('Failed to update allocation policy');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium whitespace-nowrap">Global Policy:</span>
      <Select value={activeLoan.allocationPolicy || 'INTEREST_FIRST'} onValueChange={handlePolicyChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Policy" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="INTEREST_FIRST">Interest First (Default)</SelectItem>
          <SelectItem value="PRINCIPAL_FIRST">Principal First</SelectItem>
          <SelectItem value="PROPORTIONAL">Proportional</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
