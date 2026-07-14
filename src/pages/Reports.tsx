import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ExportService } from '@/services/ExportService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';

export function Reports() {
  const { activeLoanId, setActiveLoanId, activeLoan, schedule, loans } = useAppStore();

  const handleExportPDF = () => {
    if (activeLoan && schedule.length > 0) {
      ExportService.exportToPDF(activeLoan, schedule);
    }
  };

  const handleExportExcel = () => {
    if (activeLoan && schedule.length > 0) {
      ExportService.exportToExcel(activeLoan, schedule);
    }
  };

  const handleExportCSV = () => {
    if (activeLoan && schedule.length > 0) {
      ExportService.exportToCSV(activeLoan, schedule);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports & Export</h2>
        <p className="text-muted-foreground">Generate professional schedules and ledgers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Amortization Schedule</CardTitle>
          <CardDescription>Select a loan to export its complete schedule.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-full md:w-1/2">
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

          <div className="flex flex-wrap gap-4">
            <Button onClick={handleExportPDF} disabled={!activeLoan || schedule.length === 0} className="w-40">
              <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
            <Button onClick={handleExportExcel} disabled={!activeLoan || schedule.length === 0} variant="outline" className="w-40">
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Excel
            </Button>
            <Button onClick={handleExportCSV} disabled={!activeLoan || schedule.length === 0} variant="outline" className="w-40">
              <FileDown className="mr-2 h-4 w-4" /> CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
