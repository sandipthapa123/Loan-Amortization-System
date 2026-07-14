import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { LoanEntry } from './pages/LoanEntry';
import { Amortization } from './pages/Amortization';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Toaster } from 'react-hot-toast';
import { DataSync } from './components/DataSync';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataSync />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="loans/new" element={<LoanEntry />} />
            <Route path="loans/:id/edit" element={<LoanEntry />} />
            <Route path="amortization" element={<Amortization />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
