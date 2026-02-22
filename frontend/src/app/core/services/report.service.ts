import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrencyService } from './currency.service';

export interface Report {
  _id?: string;
  userId?: string;
  name: string;
  description?: string;
  type: 'expense_summary' | 'category_breakdown' | 'monthly_trends' | 'budget_analysis' | 'income_vs_expense' | 'payment_method_analysis' | 'spending_patterns' | 'budget_performance' | 'expense_forecasting' | 'top_expenses' | 'savings_analysis' | 'yearly_comparison' | 'quarterly_review' | 'weekly_spending' | 'custom';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters: {
    categories?: string[];
    paymentMethods?: string[];
    amountRange?: {
      min?: number;
      max?: number;
    };
    tags?: string[];
  };
  chartType: 'pie' | 'bar' | 'line' | 'doughnut' | 'area';
  groupBy: 'category' | 'date' | 'payment_method' | 'tag' | 'month' | 'week';
  isScheduled: boolean;
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextRunDate?: Date;
  emailRecipients?: string[];
  isPublic: boolean;
  isFavorite: boolean;
  lastGenerated?: Date;
  generationCount: number;
  reportData?: {
    summary: {
      totalExpenses: number;
      totalTransactions: number;
      averageExpense: number;
      highestExpense: number;
      lowestExpense: number;
    };
    chartData: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string[];
        borderColor: string[];
      }>;
    };
    tableData: Array<{
      date: Date;
      description: string;
      category: string;
      amount: number;
      paymentMethod: string;
    }>;
  };
  settings: {
    currency: string;
    dateFormat: string;
    includeSubcategories: boolean;
    showPercentages: boolean;
    showTrends: boolean;
  };
  status?: 'never_generated' | 'fresh' | 'recent' | 'stale';
  durationDays?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuickReportRequest {
  type?: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters?: any;
  chartType?: string;
  groupBy?: string;
}

export interface DashboardSummary {
  period: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalExpenses: number;
    totalTransactions: number;
    averageExpense: number;
    highestExpense: number;
    lowestExpense: number;
  };
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
    }>;
  };
  tableData: Array<{
    date: Date;
    description: string;
    category: string;
    amount: number;
    paymentMethod: string;
  }>;
}

export interface ReportResponse {
  success: boolean;
  data: Report | Report[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardSummaryResponse {
  success: boolean;
  data: DashboardSummary;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient, private currencyService: CurrencyService) {}

  // Get all reports with optional filters
  getReports(params?: {
    type?: string;
    favorite?: boolean;
    scheduled?: boolean;
    page?: number;
    limit?: number;
  }): Observable<ReportResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.type) httpParams = httpParams.set('type', params.type);
      if (params.favorite !== undefined) httpParams = httpParams.set('favorite', params.favorite.toString());
      if (params.scheduled !== undefined) httpParams = httpParams.set('scheduled', params.scheduled.toString());
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ReportResponse>(this.apiUrl, { params: httpParams });
  }

  // Get favorite reports
  getFavoriteReports(): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${this.apiUrl}/favorites`);
  }

  // Get scheduled reports
  getScheduledReports(): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${this.apiUrl}/scheduled`);
  }

  // Get reports by type
  getReportsByType(type: string): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${this.apiUrl}/type/${type}`);
  }

  // Get specific report
  getReport(id: string): Observable<ReportResponse> {
    return this.http.get<ReportResponse>(`${this.apiUrl}/${id}`);
  }

  // Create new report
  createReport(report: Omit<Report, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(this.apiUrl, report);
  }

  // Update report
  updateReport(id: string, report: Partial<Report>): Observable<ReportResponse> {
    return this.http.put<ReportResponse>(`${this.apiUrl}/${id}`, report);
  }

  // Delete report
  deleteReport(id: string): Observable<ReportResponse> {
    return this.http.delete<ReportResponse>(`${this.apiUrl}/${id}`);
  }

  // Generate report data
  generateReport(id: string): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(`${this.apiUrl}/${id}/generate`, {});
  }

  // Toggle report favorite status
  toggleFavorite(id: string): Observable<ReportResponse> {
    return this.http.patch<ReportResponse>(`${this.apiUrl}/${id}/favorite`, {});
  }

  // Toggle report schedule
  toggleSchedule(id: string, scheduleData: {
    isScheduled: boolean;
    scheduleFrequency?: string;
    emailRecipients?: string[];
  }): Observable<ReportResponse> {
    return this.http.patch<ReportResponse>(`${this.apiUrl}/${id}/schedule`, scheduleData);
  }

  // Generate quick report without saving
  generateQuickReport(reportData: QuickReportRequest): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(`${this.apiUrl}/quick-generate`, reportData);
  }

  // Get dashboard summary
  getDashboardSummary(period: string = 'monthly', startDate?: Date, endDate?: Date): Observable<DashboardSummaryResponse> {
    let params = new HttpParams().set('period', period);
    
    if (period === 'custom' && startDate && endDate) {
      params = params.set('startDate', startDate.toISOString());
      params = params.set('endDate', endDate.toISOString());
    }
    
    return this.http.get<DashboardSummaryResponse>(`${this.apiUrl}/dashboard/summary`, { params });
  }

  // Debug endpoint to check database state
  getDebugInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/debug`);
  }

  // Helper methods for report management
  getReportTypeDisplayName(type: string): string {
    switch (type) {
      case 'expense_summary': return 'Expense Summary';
      case 'category_breakdown': return 'Category Breakdown';
      case 'monthly_trends': return 'Monthly Trends';
      case 'budget_analysis': return 'Budget Analysis';
      case 'income_vs_expense': return 'Income vs Expense';
      case 'payment_method_analysis': return 'Payment Method Analysis';
      case 'spending_patterns': return 'Spending Patterns';
      case 'budget_performance': return 'Budget Performance';
      case 'expense_forecasting': return 'Expense Forecasting';
      case 'top_expenses': return 'Top Expenses';
      case 'savings_analysis': return 'Savings Analysis';
      case 'yearly_comparison': return 'Yearly Comparison';
      case 'quarterly_review': return 'Quarterly Review';
      case 'weekly_spending': return 'Weekly Spending';
      case 'custom': return 'Custom Report';
      default: return type;
    }
  }

  getChartTypeDisplayName(chartType: string): string {
    switch (chartType) {
      case 'pie': return 'Pie Chart';
      case 'bar': return 'Bar Chart';
      case 'line': return 'Line Chart';
      case 'doughnut': return 'Doughnut Chart';
      case 'area': return 'Area Chart';
      default: return chartType;
    }
  }

  getGroupByDisplayName(groupBy: string): string {
    switch (groupBy) {
      case 'category': return 'Category';
      case 'date': return 'Date';
      case 'payment_method': return 'Payment Method';
      case 'tag': return 'Tag';
      case 'month': return 'Month';
      case 'week': return 'Week';
      default: return groupBy;
    }
  }

  getScheduleFrequencyDisplayName(frequency: string): string {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      default: return frequency;
    }
  }

  getReportStatusColor(status: string): string {
    switch (status) {
      case 'never_generated': return '#9E9E9E';
      case 'fresh': return '#4CAF50';
      case 'recent': return '#2196F3';
      case 'stale': return '#FF9800';
      default: return '#9E9E9E';
    }
  }

  getReportStatusIcon(status: string): string {
    switch (status) {
      case 'never_generated': return 'help_outline';
      case 'fresh': return 'check_circle';
      case 'recent': return 'schedule';
      case 'stale': return 'warning';
      default: return 'help_outline';
    }
  }

  formatCurrency(amount: number): string {
    return this.currencyService.formatCurrency(amount);
  }

  formatDate(date: Date | string, format: string = 'MM/dd/yyyy'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US');
  }

  calculateDateRangeDuration(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Chart configuration helpers
  getDefaultChartOptions(chartType: string): any {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${context.label}: ${this.formatCurrency(context.parsed)}`;
            }
          }
        }
      }
    };

    switch (chartType) {
      case 'pie':
      case 'doughnut':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: {
              position: 'right'
            }
          }
        };
      case 'line':
      case 'area':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: number) => this.formatCurrency(value)
              }
            }
          }
        };
      case 'bar':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: number) => this.formatCurrency(value)
              }
            }
          },
          plugins: {
            ...baseOptions.plugins,
            legend: {
              display: false
            }
          }
        };
      default:
        return baseOptions;
    }
  }

  // Validation helpers
  validateReportData(report: Partial<Report>): string[] {
    const errors: string[] = [];

    if (!report.name || report.name.trim().length < 3) {
      errors.push('Report name must be at least 3 characters long');
    }

    if (!report.type) {
      errors.push('Report type is required');
    }

    if (!report.dateRange || !report.dateRange.startDate || !report.dateRange.endDate) {
      errors.push('Date range is required');
    }

    if (report.dateRange && report.dateRange.startDate && report.dateRange.endDate) {
      if (new Date(report.dateRange.endDate) <= new Date(report.dateRange.startDate)) {
        errors.push('End date must be after start date');
      }
    }

    if (report.isScheduled && !report.scheduleFrequency) {
      errors.push('Schedule frequency is required for scheduled reports');
    }

    if (report.emailRecipients && report.emailRecipients.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = report.emailRecipients.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        errors.push('Invalid email addresses found');
      }
    }

    return errors;
  }

  // Export helpers
  exportReportData(report: Report, format: 'csv' | 'json' | 'pdf'): void {
    if (!report.reportData) {
      console.error('No report data available for export');
      return;
    }

    switch (format) {
      case 'csv':
        this.exportToCSV(report);
        break;
      case 'json':
        this.exportToJSON(report);
        break;
      case 'pdf':
        // PDF export would require additional library like jsPDF
        console.log('PDF export not implemented yet');
        break;
    }
  }

  private exportToCSV(report: Report): void {
    if (!report.reportData?.tableData) return;

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method'];
    const csvContent = [
      headers.join(','),
      ...report.reportData.tableData.map(row => [
        this.formatDate(row.date),
        `"${row.description}"`,
        row.category,
        row.amount,
        row.paymentMethod
      ].join(','))
    ].join('\n');

    this.downloadFile(csvContent, `${report.name}.csv`, 'text/csv');
  }

  private exportToJSON(report: Report): void {
    const jsonContent = JSON.stringify(report.reportData, null, 2);
    this.downloadFile(jsonContent, `${report.name}.json`, 'application/json');
  }

  private downloadFile(content: string, filename: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Get all available report types
  getAvailableReportTypes(): Array<{value: string, label: string, description: string}> {
    return [
      {
        value: 'expense_summary',
        label: 'Expense Summary',
        description: 'Overview of total expenses, transactions, and key metrics'
      },
      {
        value: 'category_breakdown',
        label: 'Category Breakdown',
        description: 'Expenses grouped by categories with visual breakdown'
      },
      {
        value: 'monthly_trends',
        label: 'Monthly Trends',
        description: 'Monthly spending trends and patterns over time'
      },
      {
        value: 'budget_analysis',
        label: 'Budget Analysis',
        description: 'Compare actual spending against budget allocations'
      },
      {
        value: 'income_vs_expense',
        label: 'Income vs Expense',
        description: 'Compare income and expenses to track financial health'
      },
      {
        value: 'payment_method_analysis',
        label: 'Payment Method Analysis',
        description: 'Breakdown of expenses by payment methods used'
      },
      {
        value: 'spending_patterns',
        label: 'Spending Patterns',
        description: 'Identify recurring spending patterns and habits'
      },
      {
        value: 'budget_performance',
        label: 'Budget Performance',
        description: 'Detailed analysis of budget performance and variances'
      },
      {
        value: 'top_expenses',
        label: 'Top Expenses',
        description: 'Highest individual expenses and spending outliers'
      },
      {
        value: 'savings_analysis',
        label: 'Savings Analysis',
        description: 'Track savings goals and analyze saving patterns'
      },
      {
        value: 'yearly_comparison',
        label: 'Yearly Comparison',
        description: 'Compare expenses across different years'
      },
      {
        value: 'quarterly_review',
        label: 'Quarterly Review',
        description: 'Comprehensive quarterly financial review'
      },
      {
        value: 'weekly_spending',
        label: 'Weekly Spending',
        description: 'Weekly spending patterns and trends'
      },
      {
        value: 'custom',
        label: 'Custom Report',
        description: 'Create a custom report with specific parameters'
      }
    ];
  }

  // Get report type categories for better organization
  getReportTypeCategories(): Array<{category: string, types: string[]}> {
    return [
      {
        category: 'Overview Reports',
        types: ['expense_summary', 'category_breakdown', 'top_expenses']
      },
      {
        category: 'Trend Analysis',
        types: ['monthly_trends', 'weekly_spending', 'yearly_comparison', 'quarterly_review']
      },
      {
        category: 'Budget & Performance',
        types: ['budget_analysis', 'budget_performance', 'savings_analysis']
      },
      {
        category: 'Detailed Analysis',
        types: ['income_vs_expense', 'payment_method_analysis', 'spending_patterns']
      },
      {
        category: 'Custom',
        types: ['custom']
      }
    ];
  }

  // Get recommended chart types for each report type
  getRecommendedChartType(reportType: string): string {
    switch (reportType) {
      case 'expense_summary': return 'bar';
      case 'category_breakdown': return 'pie';
      case 'monthly_trends': return 'line';
      case 'budget_analysis': return 'bar';
      case 'income_vs_expense': return 'bar';
      case 'payment_method_analysis': return 'doughnut';
      case 'spending_patterns': return 'line';
      case 'budget_performance': return 'bar';
      case 'top_expenses': return 'bar';
      case 'savings_analysis': return 'area';
      case 'yearly_comparison': return 'line';
      case 'quarterly_review': return 'bar';
      case 'weekly_spending': return 'line';
      default: return 'bar';
    }
  }

  // Get recommended groupBy for each report type
  getRecommendedGroupBy(reportType: string): string {
    switch (reportType) {
      case 'expense_summary': return 'category';
      case 'category_breakdown': return 'category';
      case 'monthly_trends': return 'month';
      case 'budget_analysis': return 'category';
      case 'income_vs_expense': return 'month';
      case 'payment_method_analysis': return 'payment_method';
      case 'spending_patterns': return 'date';
      case 'budget_performance': return 'category';
      case 'top_expenses': return 'date';
      case 'savings_analysis': return 'month';
      case 'yearly_comparison': return 'month';
      case 'quarterly_review': return 'month';
      case 'weekly_spending': return 'week';
      default: return 'category';
    }
  }
}
