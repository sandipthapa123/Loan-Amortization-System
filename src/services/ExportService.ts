import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { LoanCalculator, AmortizationRow } from './LoanCalculator';
import { DateCalculationService } from './DateCalculationService';

export class ExportService {
  static exportToPDF(loanDetails: any, schedule: AmortizationRow[], isDetailedView: boolean = false, isPreview: boolean = false) {
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
    const tableData = schedule.map(row => {
      if (isDetailedView) {
        return [
          row.rowNumber,
          DateCalculationService.convertADtoBS(row.fromDate),
          DateCalculationService.convertADtoBS(row.toDate),
          row.days,
          row.openingPrincipal.toFixed(2),
          row.interest.toFixed(2),
          row.payment.toFixed(2),
          row.interestPaid.toFixed(2),
          row.principalPaid.toFixed(2),
          row.closingPrincipal.toFixed(2),
          row.closingPrincipal.plus(row.unpaidInterestBucket).toFixed(2)
        ];
      } else {
        return [
          DateCalculationService.convertADtoBS(row.toDate),
          row.openingPrincipal.toFixed(2),
          row.interest.toFixed(2),
          row.payment.toFixed(2),
          row.interestPaid.toFixed(2),
          row.principalPaid.toFixed(2),
          row.closingPrincipal.toFixed(2),
          row.closingPrincipal.plus(row.unpaidInterestBucket).toFixed(2)
        ];
      }
    });

    const head = isDetailedView 
      ? [['No.', 'From (BS)', 'To (BS)', 'Days', 'Opening (Rs.)', 'Interest (Rs.)', 'Payment (Rs.)', 'Int. Paid (Rs.)', 'Prin. Paid (Rs.)', 'Closing (Rs.)', 'Total Out. (Rs.)']]
      : [['Date (BS)', 'Opening (Rs.)', 'Interest (Rs.)', 'Payment (Rs.)', 'Int. Paid (Rs.)', 'Prin. Paid (Rs.)', 'Closing (Rs.)', 'Total Out. (Rs.)']];

    autoTable(doc, {
      startY: 50,
      head: head,
      body: tableData,
      theme: 'grid',
      styles: { fontSize: isDetailedView ? 7 : 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    const summary = LoanCalculator.calculateSummary(loanDetails, schedule, DateCalculationService.getTodayAD());
    const finalY = (doc as any).lastAutoTable.finalY || 50;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Loan Value: Rs. ${summary.totalLoanValue.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 10);
    doc.text(`Total Payments: Rs. ${summary.totalPaymentsReceived.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 16);
    doc.text(`Interest Outstanding: Rs. ${summary.interestOutstanding.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 22);
    doc.text(`Principal Outstanding: Rs. ${summary.currentPrincipal.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 28);
    doc.text(`Total Outstanding Payment: Rs. ${summary.outstandingBalance.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 34);

    if (isPreview) {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else {
      doc.save(`Loan_Schedule_${loanDetails.borrower}.pdf`);
    }
  }

  static exportToExcel(loanDetails: any, schedule: AmortizationRow[], isDetailedView: boolean = false) {
    const data = schedule.map(row => {
      if (isDetailedView) {
        return {
          'No.': row.rowNumber,
          'From Date (AD)': row.fromDate,
          'From Date (BS)': DateCalculationService.convertADtoBS(row.fromDate),
          'To Date (AD)': row.toDate,
          'To Date (BS)': DateCalculationService.convertADtoBS(row.toDate),
          'Days': row.days,
          'Opening Principal (Rs.)': row.openingPrincipal.toNumber(),
          'Interest Formula': row.interestFormula,
          'Accrued Interest (Rs.)': row.interest.toNumber(),
          'Payment (Rs.)': row.payment.toNumber(),
          'Interest Paid (Rs.)': row.interestPaid.toNumber(),
          'Unpaid Interest Bucket (Rs.)': row.unpaidInterestBucket.toNumber(),
          'Principal Paid (Rs.)': row.principalPaid.toNumber(),
          'Closing Principal (Rs.)': row.closingPrincipal.toNumber(),
          'Remaining Balance (Rs.)': row.closingPrincipal.plus(row.unpaidInterestBucket).toNumber()
        };
      } else {
        return {
          'Date (BS)': DateCalculationService.convertADtoBS(row.toDate),
          'Opening Principal (Rs.)': row.openingPrincipal.toNumber(),
          'Accrued Interest (Rs.)': row.interest.toNumber(),
          'Payment (Rs.)': row.payment.toNumber(),
          'Interest Paid (Rs.)': row.interestPaid.toNumber(),
          'Principal Paid (Rs.)': row.principalPaid.toNumber(),
          'Closing Principal (Rs.)': row.closingPrincipal.toNumber(),
          'Remaining Balance (Rs.)': row.closingPrincipal.plus(row.unpaidInterestBucket).toNumber()
        };
      }
    }) as any[];

    const summary = LoanCalculator.calculateSummary(loanDetails, schedule, DateCalculationService.getTodayAD());
    data.push({}); // Empty row for spacing
    data.push({ 'Closing Principal (Rs.)': 'Total Loan Value:', 'Remaining Balance (Rs.)': summary.totalLoanValue.toNumber() });
    data.push({ 'Closing Principal (Rs.)': 'Total Payments:', 'Remaining Balance (Rs.)': summary.totalPaymentsReceived.toNumber() });
    data.push({ 'Closing Principal (Rs.)': 'Interest Outstanding:', 'Remaining Balance (Rs.)': summary.interestOutstanding.toNumber() });
    data.push({ 'Closing Principal (Rs.)': 'Principal Outstanding:', 'Remaining Balance (Rs.)': summary.currentPrincipal.toNumber() });
    data.push({ 'Closing Principal (Rs.)': 'Total Outstanding Payment:', 'Remaining Balance (Rs.)': summary.outstandingBalance.toNumber() });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Amortization Schedule');
    XLSX.writeFile(workbook, `Loan_Schedule_${loanDetails.borrower}.xlsx`);
  }

  static exportToCSV(loanDetails: any, schedule: AmortizationRow[], isDetailedView: boolean = false) {
    const data = schedule.map(row => {
      if (isDetailedView) {
        return {
          'No.': row.rowNumber,
          'From Date (AD)': row.fromDate,
          'From Date (BS)': DateCalculationService.convertADtoBS(row.fromDate),
          'To Date (AD)': row.toDate,
          'To Date (BS)': DateCalculationService.convertADtoBS(row.toDate),
          'Days': row.days,
          'Opening Principal (Rs.)': row.openingPrincipal.toFixed(2),
          'Interest Formula': row.interestFormula,
          'Accrued Interest (Rs.)': row.interest.toFixed(2),
          'Payment (Rs.)': row.payment.toFixed(2),
          'Interest Paid (Rs.)': row.interestPaid.toFixed(2),
          'Unpaid Interest Bucket (Rs.)': row.unpaidInterestBucket.toFixed(2),
          'Principal Paid (Rs.)': row.principalPaid.toFixed(2),
          'Closing Principal (Rs.)': row.closingPrincipal.toFixed(2),
          'Remaining Balance (Rs.)': row.closingPrincipal.plus(row.unpaidInterestBucket).toFixed(2)
        };
      } else {
        return {
          'Date (BS)': DateCalculationService.convertADtoBS(row.toDate),
          'Opening Principal (Rs.)': row.openingPrincipal.toFixed(2),
          'Accrued Interest (Rs.)': row.interest.toFixed(2),
          'Payment (Rs.)': row.payment.toFixed(2),
          'Interest Paid (Rs.)': row.interestPaid.toFixed(2),
          'Principal Paid (Rs.)': row.principalPaid.toFixed(2),
          'Closing Principal (Rs.)': row.closingPrincipal.toFixed(2),
          'Remaining Balance (Rs.)': row.closingPrincipal.plus(row.unpaidInterestBucket).toFixed(2)
        };
      }
    }) as any[];

    const summary = LoanCalculator.calculateSummary(loanDetails, schedule, DateCalculationService.getTodayAD());
    data.push({}); // Empty row for spacing
    data.push({ 'Closing Principal (Rs.)': 'Total Loan Value:', 'Remaining Balance (Rs.)': summary.totalLoanValue.toFixed(2) });
    data.push({ 'Closing Principal (Rs.)': 'Total Payments:', 'Remaining Balance (Rs.)': summary.totalPaymentsReceived.toFixed(2) });
    data.push({ 'Closing Principal (Rs.)': 'Interest Outstanding:', 'Remaining Balance (Rs.)': summary.interestOutstanding.toFixed(2) });
    data.push({ 'Closing Principal (Rs.)': 'Principal Outstanding:', 'Remaining Balance (Rs.)': summary.currentPrincipal.toFixed(2) });
    data.push({ 'Closing Principal (Rs.)': 'Total Outstanding Payment:', 'Remaining Balance (Rs.)': summary.outstandingBalance.toFixed(2) });

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
