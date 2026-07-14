import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/StorageService';
import { useAppStore } from '@/store/useAppStore';

export function DataSync() {
  const loans = useLiveQuery(() => db.loans.toArray());
  const payments = useLiveQuery(() => db.payments.toArray());
  const syncData = useAppStore(state => state.syncData);

  useEffect(() => {
    if (loans !== undefined && payments !== undefined) {
      syncData(loans, payments);
    }
  }, [loans, payments, syncData]);

  return null;
}
