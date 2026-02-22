import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { ReportService } from '../../core/services/report.service';
import { ExpenseService } from '../../core/services/expense.service';
import { CategoryService } from '../../core/services/category.service';
import { BudgetService } from '../../core/services/budget.service';
import { CurrencyService } from '../../core/services/currency.service';
import { PdfExportService } from '../../core/services/pdf-export.service';
import { ChartComponent } from '../../shared/components/chart/chart.component';

interface ReportData {
  totalExpenses: number;
  totalCategories: number;
  averageExpense: number;
  topCategory: string;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    ReactiveFormsModule,
    ChartComponent
  ],
  template: `
    <div class="reports-container">
      <div class="reports-header">
        <div class="header-content">
          <h1>Reports & Analytics</h1>
          <p>Analyze your spending patterns and financial insights</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="exportReportAsPdf()" [disabled]="loading" class="btn-with-icon">
            <mat-icon>picture_as_pdf</mat-icon>
            Export PDF
          </button>
          <button mat-raised-button color="primary" (click)="refreshReports()" [disabled]="loading" class="btn-with-icon">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <form [formGroup]="filterForm" class="filters-form">

            <mat-form-field appearance="outline">
              <mat-label>Time Period</mat-label>
              <mat-select formControlName="timePeriod">
                <mat-option value="thisMonth">This Month</mat-option>
                <mat-option value="lastMonth">Last Month</mat-option>
                <mat-option value="last3Months">Last 3 Months</mat-option>
                <mat-option value="last6Months">Last 6 Months</mat-option>
                <mat-option value="thisYear">This Year</mat-option>
                <mat-option value="custom">Custom Range</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="filterForm.get('timePeriod')?.value === 'custom'">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" *ngIf="filterForm.get('timePeriod')?.value === 'custom'">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
        <p>Generating reports...</p>
      </div>

      <!-- Reports Content -->
      <div class="reports-content" *ngIf="!loading && reportData" id="report-content">
        <!-- Summary Cards -->
        <div class="summary-cards">
          <mat-card class="summary-card total-expenses">
            <mat-card-content>
              <div class="summary-icon">
                <mat-icon>account_balance_wallet</mat-icon>
              </div>
              <div class="summary-info">
                <h3>Total Expenses</h3>
                <p class="summary-value">{{ formatCurrency(reportData.totalExpenses) }}</p>
                <span class="summary-label">Current period</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card avg-expense">
            <mat-card-content>
              <div class="summary-icon">
                <mat-icon>trending_up</mat-icon>
              </div>
              <div class="summary-info">
                <h3>Average Expense</h3>
                <p class="summary-value">{{ formatCurrency(reportData.averageExpense) }}</p>
                <span class="summary-label">Per transaction</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card categories">
            <mat-card-content>
              <div class="summary-icon">
                <mat-icon>category</mat-icon>
              </div>
              <div class="summary-info">
                <h3>Categories Used</h3>
                <p class="summary-value">{{ reportData.totalCategories }}</p>
                <span class="summary-label">Active categories</span>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="summary-card top-category">
            <mat-card-content>
              <div class="summary-icon">
                <mat-icon>star</mat-icon>
              </div>
              <div class="summary-info">
                <h3>Top Category</h3>
                <p class="summary-value">{{ reportData.topCategory }}</p>
                <span class="summary-label">Highest spending</span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <!-- Chart Visualization -->
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-card-title>{{ getReportTitle() }}</mat-card-title>
              <mat-card-subtitle>{{ getReportSubtitle() }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper" *ngIf="chartData; else noChartData">
                <app-chart 
                  [chartData]="chartData"
                  [chartType]="currentChartType"
                  [width]="500"
                  [height]="400"
                  [showLegend]="true"
                  [containerClass]="currentChartType">
                </app-chart>
              </div>
              <ng-template #noChartData>
                <div class="no-data-message">
                  <mat-icon>bar_chart</mat-icon>
                  <p>No chart data available</p>
                </div>
              </ng-template>
            </mat-card-content>
          </mat-card>

          <!-- Category Breakdown -->
          <mat-card class="breakdown-card">
            <mat-card-header>
              <mat-card-title>Data Breakdown</mat-card-title>
              <mat-card-subtitle>Detailed analysis</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="category-breakdown" *ngIf="reportData.categoryBreakdown.length > 0; else noCategories">
                <div class="breakdown-item" *ngFor="let item of reportData.categoryBreakdown">
                  <div class="breakdown-color" [style.background-color]="item.color"></div>
                  <div class="breakdown-info">
                    <div class="breakdown-category">{{ item.category }}</div>
                    <div class="breakdown-amount">{{ formatCurrency(item.amount) }}</div>
                  </div>
                  <div class="breakdown-percentage">{{ item.percentage.toFixed(1) }}%</div>
                </div>
              </div>
              <ng-template #noCategories>
                <div class="no-data-message">
                  <mat-icon>category</mat-icon>
                  <p>No category data available</p>
                </div>
              </ng-template>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && !reportData">
        <mat-icon>assessment</mat-icon>
        <h3>No Data Available</h3>
        <p>No expenses found for the selected period. Add some expenses to see reports.</p>
        <button mat-raised-button color="primary" routerLink="/expenses/add" class="btn-with-icon">
          <mat-icon>add</mat-icon>
          Add Expense
        </button>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      background: var(--background-color, #fafafa);
      min-height: 100vh;
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .reports-container {
      background: var(--background-color-dark, #121212);
    }

    .reports-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 32px;
      background: var(--surface-color, #ffffff);
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .reports-header {
      background: var(--surface-color-dark, #1e1e1e);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .header-content h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
      color: #667eea;
    }

    :host-context(.dark-theme) .header-content h1 {
      color: #bb86fc;
    }

    .header-content p {
      color: var(--text-secondary, #666);
      margin: 8px 0 0 0;
      font-size: 1.1rem;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .header-content p {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .filters-card {
      margin-bottom: 32px;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      background: var(--surface-color, #ffffff);
    }

    :host-context(.dark-theme) .filters-card {
      background: var(--surface-color-dark, #1e1e1e);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
    }

    .filters-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      align-items: end;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      color: var(--text-secondary, #666);
    }

    :host-context(.dark-theme) .loading-container {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .summary-card {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      background: var(--surface-color, #ffffff);
    }

    .summary-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    :host-context(.dark-theme) .summary-card {
      background: var(--surface-color-dark, #1e1e1e);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .summary-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
    }

    .summary-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .total-expenses .summary-icon {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
    }

    .avg-expense .summary-icon {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      color: white;
    }

    .categories .summary-icon {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: white;
    }

    .top-category .summary-icon {
      background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
      color: white;
    }

    .summary-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .summary-info h3 {
      margin: 0 0 8px 0;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-secondary, #666);
    }

    :host-context(.dark-theme) .summary-info h3 {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .summary-value {
      margin: 0 0 4px 0;
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-primary, #1a1a1a);
    }

    :host-context(.dark-theme) .summary-value {
      color: var(--text-primary-dark, #ffffff);
    }

    .summary-label {
      font-size: 0.875rem;
      color: var(--text-tertiary, #999);
    }

    :host-context(.dark-theme) .summary-label {
      color: var(--text-tertiary-dark, rgba(255, 255, 255, 0.5));
    }

    .charts-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 32px;
      margin-bottom: 32px;
    }

    .chart-card {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      background: var(--surface-color, #ffffff);
    }

    :host-context(.dark-theme) .chart-card {
      background: var(--surface-color-dark, #1e1e1e);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .chart-wrapper {
      min-height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .breakdown-card {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      background: var(--surface-color, #ffffff);
      width: 100%;
    }

    :host-context(.dark-theme) .breakdown-card {
      background: var(--surface-color-dark, #1e1e1e);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .category-breakdown {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-radius: 12px;
      background: var(--background-color, #fafafa);
      transition: all 0.3s ease;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .breakdown-item:hover {
      background: var(--hover-color, #f0f0f0);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    :host-context(.dark-theme) .breakdown-item {
      background: var(--background-color-dark, #2a2a2a);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .breakdown-item:hover {
      background: var(--hover-color-dark, #333);
    }

    .breakdown-color {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      flex-shrink: 0;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .breakdown-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .breakdown-category {
      font-weight: 600;
      font-size: 1rem;
      color: var(--text-primary, #1a1a1a);
    }

    :host-context(.dark-theme) .breakdown-category {
      color: var(--text-primary-dark, #ffffff);
    }

    .breakdown-amount {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-secondary, #666);
    }

    :host-context(.dark-theme) .breakdown-amount {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .breakdown-percentage {
      font-weight: 700;
      font-size: 1.2rem;
      color: var(--primary-color, #2196f3);
      min-width: 60px;
      text-align: right;
    }

    .no-data-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
      color: var(--text-secondary, #666);
    }

    .no-data-message mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-data-message p {
      margin: 0;
      font-size: 1rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      text-align: center;
      color: var(--text-secondary, #666);
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 24px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 16px 0;
      color: var(--text-primary, #1a1a1a);
    }

    :host-context(.dark-theme) .empty-state h3 {
      color: var(--text-primary-dark, #ffffff);
    }

    .empty-state p {
      margin: 0 0 24px 0;
      max-width: 400px;
    }

    @media (max-width: 768px) {
      .reports-container {
        padding: 16px;
      }

      .reports-header {
        flex-direction: column;
        gap: 20px;
        text-align: center;
        padding: 24px;
      }

      .header-content h1 {
        font-size: 2rem;
      }

      .header-actions {
        flex-direction: row;
        justify-content: center;
        gap: 12px;
      }

      .filters-form {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .summary-cards {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .summary-card mat-card-content {
        padding: 20px;
        flex-direction: column;
        text-align: center;
        gap: 16px;
      }

      .summary-icon {
        width: 50px;
        height: 50px;
      }

      .summary-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .breakdown-item {
        padding: 16px;
        gap: 12px;
      }

      .breakdown-color {
        width: 20px;
        height: 20px;
      }

      .breakdown-percentage {
        font-size: 1rem;
        min-width: 50px;
      }
    }

    @media (max-width: 480px) {
      .reports-header {
        padding: 16px;
      }

      .header-content h1 {
        font-size: 1.8rem;
      }

      .header-actions {
        flex-direction: column;
        width: 100%;
      }

      .header-actions button {
        width: 100%;
      }

      .breakdown-item {
        padding: 12px;
        gap: 10px;
      }

      .breakdown-info {
        gap: 4px;
      }

      .breakdown-category {
        font-size: 0.9rem;
      }

      .breakdown-amount {
        font-size: 0.8rem;
      }
    }
  `]
})
export class ReportsComponent implements OnInit, OnDestroy {
  filterForm: FormGroup;
  reportData: ReportData | null = null;
  chartData: any = null;
  currentChartType: 'pie' | 'doughnut' | 'bar' | 'line' = 'pie';
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private expenseService: ExpenseService,
    private categoryService: CategoryService,
    private budgetService: BudgetService,
    private currencyService: CurrencyService,
    private pdfExportService: PdfExportService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      timePeriod: ['thisMonth'],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.setupFilterSubscriptions();
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterSubscriptions(): void {
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300)
      )
      .subscribe(() => {
        this.loadReports();
      });
  }

  loadReports(): void {
    this.loading = true;
    
    // Get date range based on selected time period
    const dateRange = this.getDateRange();
    const reportType = 'expense_summary'; // Fixed to expense summary only
    
    console.log('=== MAKING QUICK REPORT API CALL ===');
    console.log('Report type:', reportType);
    console.log('Date range:', dateRange);
    
    // Get recommended chart type and groupBy for expense summary
    const chartType = this.reportService.getRecommendedChartType(reportType);
    const groupBy = this.reportService.getRecommendedGroupBy(reportType);
    
    // Use generateQuickReport to get expense summary data
    const quickReportRequest = {
      type: reportType,
      dateRange: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      },
      chartType: chartType,
      groupBy: groupBy
    };
    
    this.reportService.generateQuickReport(quickReportRequest).subscribe({
      next: (response) => {
        console.log('=== QUICK REPORT API RESPONSE RECEIVED ===', response);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        if (response.success && response.data) {
          this.processReportData(response.data);
        } else {
          this.handleNoData();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('=== QUICK REPORT API ERROR ===', error);
        this.snackBar.open('Failed to load reports', 'Close', { duration: 3000 });
        this.handleNoData();
        this.loading = false;
      }
    });
  }

  private getDateRange(): { startDate: Date; endDate: Date } {
    const now = new Date();
    const timePeriod = this.filterForm.get('timePeriod')?.value;
    
    switch (timePeriod) {
      case 'thisMonth':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
      case 'lastMonth':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          endDate: new Date(now.getFullYear(), now.getMonth(), 0)
        };
      case 'last3Months':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
          endDate: now
        };
      case 'last6Months':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth() - 6, 1),
          endDate: now
        };
      case 'thisYear':
        return {
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: now
        };
      case 'custom':
        return {
          startDate: this.filterForm.get('startDate')?.value || new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: this.filterForm.get('endDate')?.value || now
        };
      default:
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: now
        };
    }
  }

  private processReportData(data: any): void {
    // Process the real data from the API
    const summary = data.summary || {};
    let chartData = data.chartData || { labels: [], datasets: [] };
    const tableData = data.tableData || [];
    
    // Set current chart type for expense summary
    const reportType = 'expense_summary';
    this.currentChartType = this.reportService.getRecommendedChartType(reportType) as 'pie' | 'doughnut' | 'bar' | 'line';
    
    // Calculate category breakdown from table data if available
    let categoryBreakdown: any[] = [];
    
    if (tableData && Array.isArray(tableData) && tableData.length > 0) {
      // Group table data by category to calculate totals
      const categoryTotals = new Map<string, number>();
      
      tableData.forEach((item: any) => {
        const category = item.category || 'Uncategorized';
        const amount = item.amount || 0;
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
      });
      
      // Generate colors for categories
      const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ];
      
      // Create category breakdown
      let colorIndex = 0;
      categoryTotals.forEach((amount, category) => {
        const percentage = summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0;
        categoryBreakdown.push({
          category: category,
          amount: amount,
          percentage: percentage,
          color: colors[colorIndex % colors.length]
        });
        colorIndex++;
      });
      
      // Sort by amount descending
      categoryBreakdown.sort((a: any, b: any) => b.amount - a.amount);
      
      // Generate chart data if it's empty
      if (!chartData.labels || chartData.labels.length === 0) {
        chartData = {
          labels: categoryBreakdown.map(item => item.category),
          datasets: [{
            label: 'Expenses',
            data: categoryBreakdown.map(item => item.amount),
            backgroundColor: categoryBreakdown.map(item => item.color),
            borderColor: categoryBreakdown.map(item => item.color),
            borderWidth: 1
          }]
        };
      }
    } else if (chartData.labels && chartData.labels.length > 0) {
      // Fallback to chart data if no table data
      categoryBreakdown = chartData.labels.map((label: string, index: number) => {
        const amount = chartData.datasets[0]?.data[index] || 0;
        const color = chartData.datasets[0]?.backgroundColor[index] || '#9E9E9E';
        const percentage = summary.totalExpenses > 0 ? (amount / summary.totalExpenses) * 100 : 0;
        
        return {
          category: label,
          amount: amount,
          percentage: percentage,
          color: color
        };
      });
    }
    
    // Set chart data for visualization
    this.chartData = chartData.labels && chartData.labels.length > 0 ? chartData : null;

    this.reportData = {
      totalExpenses: summary.totalExpenses || 0,
      totalCategories: categoryBreakdown.length,
      averageExpense: summary.averageExpense || 0,
      topCategory: categoryBreakdown[0]?.category || 'No expenses',
      categoryBreakdown: categoryBreakdown
    };
  }

  private handleNoData(): void {
    this.reportData = null;
    this.chartData = null;
  }

  getReportTitle(): string {
    return 'Expense Summary';
  }

  getReportSubtitle(): string {
    const timePeriod = this.filterForm.get('timePeriod')?.value || 'thisMonth';
    
    let periodText = '';
    switch (timePeriod) {
      case 'thisMonth': periodText = 'This Month'; break;
      case 'lastMonth': periodText = 'Last Month'; break;
      case 'last3Months': periodText = 'Last 3 Months'; break;
      case 'last6Months': periodText = 'Last 6 Months'; break;
      case 'thisYear': periodText = 'This Year'; break;
      case 'custom': periodText = 'Custom Period'; break;
      default: periodText = 'Current Period';
    }
    
    return `${periodText} - ${this.reportService.getChartTypeDisplayName(this.currentChartType)}`;
  }

  formatCurrency(amount: number): string {
    return this.reportService.formatCurrency(amount);
  }

  refreshReports(): void {
    this.snackBar.open('Refreshing reports...', '', { duration: 1000 });
    this.loadReports();
  }

  async exportReportAsPdf(): Promise<void> {
    if (!this.reportData) {
      this.snackBar.open('No data to export', 'Close', { duration: 3000 });
      return;
    }

    try {
      // Show loading message
      this.snackBar.open('Generating PDF...', '', { duration: 2000 });

      // Load PDF libraries if not already loaded
      await this.pdfExportService.loadPdfLibraries();

      // Try to export the entire report content as shown in UI
      const reportElement = document.getElementById('report-content');
      if (reportElement) {
        await this.pdfExportService.exportReportToPdf('report-content', 'expense-report');
      } else {
        // Fallback: Create custom PDF with available data
        const chartCanvas = this.getChartCanvas();
        await this.pdfExportService.exportCustomReportToPdf(this.reportData, chartCanvas);
      }

      this.snackBar.open('PDF exported successfully', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      this.snackBar.open('Failed to export PDF', 'Close', { duration: 3000 });
    }
  }

  private getChartCanvas(): HTMLCanvasElement | undefined {
    // Try to get the chart canvas from the chart component
    const chartElement = document.querySelector('app-chart canvas') as HTMLCanvasElement;
    return chartElement || undefined;
  }

  private generateCSVContent(): string {
    if (!this.reportData) return '';

    const headers = ['Category', 'Amount', 'Percentage'];
    const rows = this.reportData.categoryBreakdown.map(item => 
      [item.category, item.amount.toString(), item.percentage.toFixed(1) + '%']
    );

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

}
