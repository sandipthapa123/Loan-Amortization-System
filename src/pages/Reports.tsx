import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ExportService } from '@/services/ExportService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, FileSpreadsheet, FileText, TableProperties, Eye } from 'lucide-react';
import { PolicySwitch } from '@/components/PolicySwitch';

export function Reports() {
  const { activeLoanId, setActiveLoanId, activeLoan, schedule, loans } = useAppStore();
  const [isDetailedView, setIsDetailedView] = useState(false);

  const handleExportPDF = () => {
    if (activeLoan && schedule.length > 0) {
      ExportService.exportToPDF(activeLoan, schedule, isDetailedView);
    }
  };

  const handlePreviewPDF = () => {
    if (activeLoan && schedule.length > 0) {
      ExportService.exportToPDF(activeLoan, schedule, isDetailedView, true);
    }
  };

  const handleExportExcel = () => {
    if (activeLoan && schedule.length > 0) {
      ExportService.exportToExcel(activeLoan, schedule, isDetailedView);
    }
  };

  const handleExportCSV = () => {
    if (activeLoan && schedule.length > 0) {
      ExportService.exportToCSV(activeLoan, schedule, isDetailedView);
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
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="w-full md:w-1/2">
              <Select value={activeLoanId || ''} onValueChange={setActiveLoanId}>
                <SelectTrigger aria-label="Select Loan to Export">
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
            
            {activeLoan && (
              <div className="flex w-full md:w-auto items-center gap-4">
                <PolicySwitch />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsDetailedView(!isDetailedView)}
                >
                  <TableProperties className="mr-2 h-4 w-4" />
                  {isDetailedView ? "Detailed View" : "Brief View"}
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <Button onClick={handlePreviewPDF} disabled={!activeLoan || schedule.length === 0} variant="secondary" className="w-40" aria-label="Preview PDF">
              <Eye className="mr-2 h-4 w-4" /> Preview PDF
            </Button>
            <Button onClick={handleExportPDF} disabled={!activeLoan || schedule.length === 0} className="w-40" aria-label="Export to PDF">
              <FileText className="mr-2 h-4 w-4" /> Export PDF
            </Button>
            <Button onClick={handleExportExcel} disabled={!activeLoan || schedule.length === 0} variant="outline" className="w-40" aria-label="Export to Excel">
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Excel
            </Button>
            <Button onClick={handleExportCSV} disabled={!activeLoan || schedule.length === 0} variant="outline" className="w-40" aria-label="Export to CSV">
              <FileDown className="mr-2 h-4 w-4" /> CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
