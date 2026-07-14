import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AmortizationRow } from './LoanCalculator';
import { DateCalculationService } from './DateCalculationService';

export class ExportService {
  static exportToPDF(loanDetails: any, schedule: AmortizationRow[]) {
    const doc = new jsPDF('landscape'); // use landscape for more columns
    
    // Header
    doc.setFontSize(18);
    doc.text('Loan Amortization Schedule', 14, 22);
    
    // Details
    doc.setFontSize(11);
    doc.text(`Borrower: ${loanDetails.borrower}`, 14, 32);
    doc.text(`Lender: ${loanDetails.lender}`, 14, 38);
    doc.text(`Default Policy: ${loanDetails.allocationPolicy || 'INTEREST_FIRST'}`, 14, 44);
    doc.text(`Principal: ${loanDetails.principal.toLocaleString()}`, 120, 32);
    doc.text(`Interest Rate: ${loanDetails.interestRate}%`, 120, 38);
    
    // Table
    const tableData = schedule.map(row => [
      row.rowNumber,
      DateCalculationService.convertADtoBS(row.fromDate),
      DateCalculationService.convertADtoBS(row.toDate),
      row.days,
      row.allocationPolicyUsed === 'INTEREST_FIRST' ? 'INT_FIRST' : row.allocationPolicyUsed === 'PRINCIPAL_FIRST' ? 'PRIN_FIRST' : 'MANUAL',
      row.openingPrincipal.toFixed(2),
      row.interest.toFixed(2),
      row.payment.toFixed(2),
      row.interestPaid.toFixed(2),
      row.principalPaid.toFixed(2),
      row.unpaidInterestBucket.toFixed(2),
      row.closingPrincipal.toFixed(2)
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['No', 'From (BS)', 'To (BS)', 'Days', 'Policy', 'Opening (Rs.)', 'Interest (Rs.)', 'Payment (Rs.)', 'Int. Paid (Rs.)', 'Prin. Paid (Rs.)', 'Unpaid Int. (Rs.)', 'Closing (Rs.)']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`Loan_Schedule_${loanDetails.borrower}.pdf`);
  }

  static exportToExcel(loanDetails: any, schedule: AmortizationRow[]) {
    const data = schedule.map(row => ({
      'No.': row.rowNumber,
      'From Date (AD)': row.fromDate,
      'From Date (BS)': DateCalculationService.convertADtoBS(row.fromDate),
      'To Date (AD)': row.toDate,
      'To Date (BS)': DateCalculationService.convertADtoBS(row.toDate),
      'Days': row.days,
      'Allocation Policy': row.allocationPolicyUsed,
      'Opening Principal (Rs.)': row.openingPrincipal.toNumber(),
      'Interest Formula': row.interestFormula,
      'Accrued Interest (Rs.)': row.interest.toNumber(),
      'Payment (Rs.)': row.payment.toNumber(),
      'Interest Paid (Rs.)': row.interestPaid.toNumber(),
      'Principal Paid (Rs.)': row.principalPaid.toNumber(),
      'Unpaid Interest Bucket (Rs.)': row.unpaidInterestBucket.toNumber(),
      'Closing Principal (Rs.)': row.closingPrincipal.toNumber(),
      'Remaining Balance (Rs.)': row.closingPrincipal.plus(row.unpaidInterestBucket).toNumber()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Amortization Schedule');
    XLSX.writeFile(workbook, `Loan_Schedule_${loanDetails.borrower}.xlsx`);
  }

  static exportToCSV(loanDetails: any, schedule: AmortizationRow[]) {
    const data = schedule.map(row => ({
      'No.': row.rowNumber,
      'From Date (AD)': row.fromDate,
      'From Date (BS)': DateCalculationService.convertADtoBS(row.fromDate),
      'To Date (AD)': row.toDate,
      'To Date (BS)': DateCalculationService.convertADtoBS(row.toDate),
      'Days': row.days,
      'Allocation Policy': row.allocationPolicyUsed,
      'Opening Principal (Rs.)': row.openingPrincipal.toFixed(2),
      'Interest Formula': row.interestFormula,
      'Accrued Interest (Rs.)': row.interest.toFixed(2),
      'Payment (Rs.)': row.payment.toFixed(2),
      'Interest Paid (Rs.)': row.interestPaid.toFixed(2),
      'Principal Paid (Rs.)': row.principalPaid.toFixed(2),
      'Unpaid Interest Bucket (Rs.)': row.unpaidInterestBucket.toFixed(2),
      'Closing Principal (Rs.)': row.closingPrincipal.toFixed(2),
      'Remaining Balance (Rs.)': row.closingPrincipal.plus(row.unpaidInterestBucket).toFixed(2)
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Loan_Schedule_${loanDetails.borrower}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
