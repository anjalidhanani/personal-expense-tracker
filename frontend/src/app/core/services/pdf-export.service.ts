import { Injectable } from '@angular/core';
import { CurrencyService } from './currency.service';

declare var jsPDF: any;
declare var html2canvas: any;

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  constructor(private currencyService: CurrencyService) {}

  async exportReportToPdf(elementId: string, filename: string = 'expense-report'): Promise<void> {
    try {
      // Ensure libraries are loaded
      await this.loadPdfLibraries();

      // Get the element to export
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found for PDF export');
      }

      // Create canvas from the element
      const canvas = await (window as any).html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      // Create PDF using the global jsPDF
      const jsPDF = (window as any).jsPDF || (window as any).jspdf?.jsPDF;
      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`${filename}-${timestamp}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  async exportCustomReportToPdf(reportData: any, chartCanvas?: HTMLCanvasElement): Promise<void> {
    try {
      // Ensure libraries are loaded
      await this.loadPdfLibraries();

      // Create PDF using the global jsPDF
      const jsPDF = (window as any).jsPDF || (window as any).jspdf?.jsPDF;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 295;
      let yPosition = 20;

      // Add title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Expense Summary Report', 20, yPosition);
      yPosition += 15;

      // Add date
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString();
      pdf.text(`Generated on: ${currentDate}`, 20, yPosition);
      yPosition += 20;

      // Add summary section
      if (reportData) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Summary', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        if (reportData.totalExpenses !== undefined) {
          pdf.text(`Total Expenses: ${this.currencyService.formatCurrency(reportData.totalExpenses)}`, 20, yPosition);
          yPosition += 8;
        }
        
        if (reportData.averageExpense !== undefined) {
          pdf.text(`Average Expense: ${this.currencyService.formatCurrency(reportData.averageExpense)}`, 20, yPosition);
          yPosition += 8;
        }
        
        if (reportData.categoriesUsed !== undefined) {
          pdf.text(`Categories Used: ${reportData.categoriesUsed}`, 20, yPosition);
          yPosition += 8;
        }
        
        if (reportData.topCategory) {
          pdf.text(`Top Category: ${reportData.topCategory}`, 20, yPosition);
          yPosition += 15;
        }
      }

      // Add chart if available
      if (chartCanvas) {
        const chartImgData = chartCanvas.toDataURL('image/png');
        const chartWidth = 120;
        const chartHeight = 80;
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Expense Breakdown', 20, yPosition);
        yPosition += 15;
        
        pdf.addImage(chartImgData, 'PNG', 20, yPosition, chartWidth, chartHeight);
        yPosition += chartHeight + 20;
      }

      // Add category breakdown table
      if (reportData?.categoryBreakdown && reportData.categoryBreakdown.length > 0) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Category Breakdown', 20, yPosition);
        yPosition += 15;

        // Table headers
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Category', 20, yPosition);
        pdf.text('Amount', 80, yPosition);
        pdf.text('Percentage', 140, yPosition);
        yPosition += 8;

        // Table data
        pdf.setFont('helvetica', 'normal');
        reportData.categoryBreakdown.forEach((item: any) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.text(item.category, 20, yPosition);
          pdf.text(this.currencyService.formatCurrency(item.amount), 80, yPosition);
          pdf.text(`${item.percentage.toFixed(1)}%`, 140, yPosition);
          yPosition += 8;
        });
      }

      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`expense-report-${timestamp}.pdf`);

    } catch (error) {
      console.error('Error generating custom PDF:', error);
      throw error;
    }
  }

  async loadPdfLibraries(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if libraries are already loaded
      if ((window as any).jsPDF && (window as any).html2canvas) {
        resolve();
        return;
      }

      let jsPdfLoaded = false;
      let html2canvasLoaded = false;

      const checkBothLoaded = () => {
        if (jsPdfLoaded && html2canvasLoaded) {
          resolve();
        }
      };

      // Load jsPDF
      if (!(window as any).jsPDF) {
        const jsPdfScript = document.createElement('script');
        jsPdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        jsPdfScript.onload = () => {
          jsPdfLoaded = true;
          checkBothLoaded();
        };
        jsPdfScript.onerror = () => reject(new Error('Failed to load jsPDF'));
        document.head.appendChild(jsPdfScript);
      } else {
        jsPdfLoaded = true;
      }

      // Load html2canvas
      if (!(window as any).html2canvas) {
        const html2canvasScript = document.createElement('script');
        html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        html2canvasScript.onload = () => {
          html2canvasLoaded = true;
          checkBothLoaded();
        };
        html2canvasScript.onerror = () => reject(new Error('Failed to load html2canvas'));
        document.head.appendChild(html2canvasScript);
      } else {
        html2canvasLoaded = true;
      }

      // If both are already loaded
      if (jsPdfLoaded && html2canvasLoaded) {
        resolve();
      }
    });
  }
}
