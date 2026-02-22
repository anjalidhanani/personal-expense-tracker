import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

import { AuthService } from '../../core/services/auth.service';
import { ExpenseService } from '../../core/services/expense.service';
import { CategoryService } from '../../core/services/category.service';
import { CurrencyService } from '../../core/services/currency.service';
import { User } from '../../core/models/user.model';
import { ExpenseStats, Expense, Category } from '../../core/models/expense.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    RouterModule
  ],
  template: `
    <div class="modern-dashboard">
      <div class="dashboard-header">
        <div class="header-content">
          <h1>Welcome back, {{ currentUser?.name }}! 👋</h1>
          <p class="subtitle">Here's your financial overview</p>
        </div>
        <div class="header-actions">
          <button mat-fab color="primary" routerLink="/expenses/add" class="quick-add-btn">
            <mat-icon>add</mat-icon>
          </button>
        </div>
      </div>

      <div class="loading-container" *ngIf="loading">
        <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
        <p>Loading your dashboard...</p>
      </div>

      <div class="dashboard-content" *ngIf="!loading">
        <!-- Stats Overview -->
        <div class="stats-grid">
          <div class="glass-card stat-card gradient-card">
            <div class="stat-icon">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <div class="stat-info">
              <h3>Total Expenses</h3>
              <div class="stat-value">{{ formatCurrency(stats?.total?.totalAmount || 0) }}</div>
              <span class="stat-label">All time</span>
            </div>
          </div>

          <div class="glass-card stat-card">
            <div class="stat-icon success">
              <mat-icon>receipt_long</mat-icon>
            </div>
            <div class="stat-info">
              <h3>Transactions</h3>
              <div class="stat-value">{{ stats?.total?.count || 0 }}</div>
              <span class="stat-label">Total records</span>
            </div>
          </div>

          <div class="glass-card stat-card">
            <div class="stat-icon warning">
              <mat-icon>category</mat-icon>
            </div>
            <div class="stat-info">
              <h3>Categories</h3>
              <div class="stat-value">{{ categories.length || 0 }}</div>
              <span class="stat-label">Available</span>
            </div>
          </div>
        </div>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content stat-card-with-icon">
              <div class="stat-icon stat-icon-container">
                <mat-icon color="accent">receipt_long</mat-icon>
              </div>
              <div class="stat-details">
                <h3>Transactions</h3>
                <p class="stat-value">{{ stats?.total?.count || 0 }}</p>
                <p class="stat-subtitle">Total records</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content stat-card-with-icon">
              <div class="stat-icon stat-icon-container">
                <mat-icon color="warn">category</mat-icon>
              </div>
              <div class="stat-details">
                <h3>Categories</h3>
                <p class="stat-value">{{ categories.length || 0 }}</p>
                <p class="stat-subtitle">Available</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Quick Actions -->
        <mat-card class="action-card">
          <mat-card-header>
            <mat-card-title>Quick Actions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-buttons action-buttons-container">
              <button mat-raised-button color="primary" routerLink="/expenses/add" class="btn-with-icon">
                <mat-icon>add</mat-icon>
                Add Expense
              </button>
              <button mat-stroked-button routerLink="/expenses" class="btn-with-icon">
                <mat-icon>list</mat-icon>
                View All
              </button>
              <button mat-stroked-button routerLink="/categories" class="btn-with-icon">
                <mat-icon>category</mat-icon>
                Categories
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Recent Expenses -->
        <div class="glass-card recent-expenses-card">
          <div class="card-header">
            <div class="header-info">
              <h2>Recent Expenses</h2>
              <p>Your latest transactions</p>
            </div>
            <button mat-icon-button routerLink="/expenses" class="view-all-btn">
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
          
          <div class="expenses-list">
            <div class="expense-item">
              <div class="expense-icon entertainment">
                <mat-icon>restaurant</mat-icon>
              </div>
              <div class="expense-details">
                <h3>Pizza</h3>
                <p class="expense-meta">Entertainment • Feb 4</p>
              </div>
              <div class="expense-amount">
                <span class="amount">₹2,000.00</span>
              </div>
            </div>
            
            <div class="expense-item">
              <div class="expense-icon shopping">
                <mat-icon>shopping_bag</mat-icon>
              </div>
              <div class="expense-details">
                <h3>Hard Drive</h3>
                <p class="expense-meta">Shopping • Feb 3</p>
              </div>
              <div class="expense-amount">
                <span class="amount">₹100.00</span>
              </div>
            </div>
          </div>
          
          <div class="card-footer">
            <button mat-stroked-button routerLink="/expenses" class="view-all-button">
              <mat-icon>list</mat-icon>
              View All Expenses
            </button>
          </div>
        </div>

        <!-- Category Breakdown Chart -->
        <mat-card class="category-breakdown-card">
          <mat-card-header>
            <mat-card-title>Category Breakdown</mat-card-title>
            <mat-card-subtitle>This month's expenses by category</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="empty-state" *ngIf="!stats?.categoryBreakdown || stats?.categoryBreakdown?.length === 0">
              <mat-icon>pie_chart</mat-icon>
              <p>No category data available</p>
            </div>
            
            <div class="chart-container" *ngIf="hasCategoryBreakdown()">
              <canvas #categoryChart width="400" height="400"></canvas>
            </div>
            
            <div class="category-legend" *ngIf="hasCategoryBreakdown()">
              <div class="legend-item" *ngFor="let category of stats?.categoryBreakdown">
                <div class="legend-color" [style.background-color]="category.color || '#666'"></div>
                <span class="legend-label">{{ category.name }}</span>
                <span class="legend-amount">{{ formatCurrency(category.totalAmount) }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Monthly Trend Chart -->
        <mat-card class="monthly-trend-card">
          <mat-card-header>
            <mat-card-title>Monthly Trend</mat-card-title>
            <mat-card-subtitle>Expense trends over the last 6 months</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="empty-state" *ngIf="!monthlyTrend || monthlyTrend.length === 0">
              <mat-icon>trending_up</mat-icon>
              <p>No trend data available</p>
            </div>
            
            <div class="chart-container" *ngIf="monthlyTrend && monthlyTrend.length > 0">
              <canvas #trendChart width="400" height="200"></canvas>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Admin Panel Link -->
      <div class="admin-section" *ngIf="currentUser?.role === 'admin'">
        <mat-card>
          <mat-card-content>
            <div class="admin-content">
              <mat-icon color="primary">admin_panel_settings</mat-icon>
              <div>
                <h3>Admin Panel</h3>
                <p>Manage users and system settings</p>
              </div>
              <button mat-raised-button color="primary" routerLink="/admin" class="btn-with-icon">
                <mat-icon>admin_panel_settings</mat-icon>
                Open Admin Panel
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .modern-dashboard {
      padding: 0;
      min-height: 100vh;
      background-color: var(--background-color);
      position: relative;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2rem;
      background: var(--surface-color);
      border-bottom: 1px solid var(--border-color);
      position: relative;
      z-index: 10;
    }

    .header-content h1 {
      margin: 0;
      color: var(--text-primary);
      font-weight: 700;
      font-size: 2rem;
      position: relative;
    }

    .subtitle {
      color: var(--text-secondary);
      margin: 0.5rem 0 0 0;
      font-size: 1rem;
      font-weight: 400;
    }

    .quick-add-btn {
      background: var(--primary-color) !important;
      color: white !important;
      border: none !important;
      box-shadow: var(--shadow) !important;
      transition: all 0.2s ease !important;
    }

    .quick-add-btn:hover {
      transform: translateY(-1px) !important;
      box-shadow: var(--shadow-lg) !important;
    }

    .dashboard-content {
      padding: 2rem;
      position: relative;
      z-index: 1;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      min-height: 120px;
      transition: all 0.2s ease;
      position: relative;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--shadow);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
      border-color: var(--primary-color);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-color);
      position: relative;
      z-index: 2;
      transition: all 0.2s ease;
    }

    .stat-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: white;
    }

    .stat-icon.success {
      background: var(--success-color);
    }

    .stat-icon.warning {
      background: var(--warn-color);
    }

    .stat-info {
      flex: 1;
      position: relative;
      z-index: 2;
    }

    .stat-info h3 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-value {
      font-size: 1.875rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      margin-top: 0.25rem;
      font-weight: 400;
    }

    /* Recent Expenses Card - Clean Style */
    .recent-expenses-card {
      grid-column: span 2;
      padding: 0;
      overflow: hidden;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--shadow);
      position: relative;
      transition: all 0.2s ease;
    }

    .recent-expenses-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
      border-color: var(--primary-color);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-info h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: white;
    }

    .header-info p {
      margin: 0.25rem 0 0 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .view-all-btn {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.2s ease;
    }

    .view-all-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }

    .expenses-list {
      padding: 0;
    }

    .expense-item {
      display: flex;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 0, 128, 0.1);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      cursor: pointer;
    }

    .expense-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 0;
      background: linear-gradient(90deg, rgba(255, 0, 128, 0.1), rgba(0, 255, 255, 0.1));
      transition: width 0.3s ease;
    }

    .expense-item:hover::before {
      width: 100%;
    }

    .expense-item:hover {
      background: rgba(255, 0, 128, 0.05);
      transform: translateX(8px) scale(1.02);
      box-shadow: 0 5px 15px rgba(255, 0, 128, 0.2);
    }

    .expense-item:last-child {
      border-bottom: none;
    }

    .expense-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 1.25rem;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      animation: icon-float 6s ease-in-out infinite;
    }

    .expense-icon::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      border-radius: inherit;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .expense-item:hover .expense-icon {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 0 20px currentColor;
    }

    .expense-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
      position: relative;
      z-index: 1;
      filter: drop-shadow(0 0 8px currentColor);
    }

    .expense-icon.entertainment {
      background: linear-gradient(135deg, #ff0080 0%, #ff4081 100%);
      box-shadow: 0 0 15px rgba(255, 0, 128, 0.3);
    }

    .expense-icon.shopping {
      background: linear-gradient(135deg, #00ffff 0%, #0080ff 100%);
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
    }

    .expense-details {
      flex: 1;
    }

    .expense-details h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
    }

    .expense-item:hover .expense-details h3 {
      color: #00ffff;
      text-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
    }

    .expense-meta {
      margin: 0.25rem 0 0 0;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 300;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .expense-amount {
      text-align: right;
      position: relative;
    }

    .expense-amount .amount {
      font-size: 1.2rem;
      font-weight: 800;
      color: #00ffff;
      filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.3));
      transition: all 0.3s ease;
    }

    .expense-item:hover .expense-amount .amount {
      transform: scale(1.1);
      filter: drop-shadow(0 0 15px rgba(0, 255, 255, 0.5));
    }

    .card-footer {
      padding: 1rem 1.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .view-all-button {
      width: 100%;
      color: white !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
      background: rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(10px) !important;
      transition: all 0.2s ease !important;
    }

    .view-all-button:hover {
      background: rgba(255, 255, 255, 0.2) !important;
      border-color: rgba(255, 255, 255, 0.5) !important;
      transform: translateY(-1px) !important;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .modern-dashboard {
        padding: 0;
      }

      .dashboard-header {
        padding: 1rem;
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .header-content h1 {
        font-size: 1.5rem;
      }

      .dashboard-content {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .recent-expenses-card {
        grid-column: span 1;
      }

      .card-header {
        padding: 1rem;
      }

      .expense-item {
        padding: 0.75rem 1rem;
      }

      .expense-icon {
        width: 40px;
        height: 40px;
        margin-right: 0.75rem;
      }

      .expense-icon mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .expense-details h3 {
        font-size: 0.9rem;
      }

      .expense-meta {
        font-size: 0.8rem;
      }

      .expense-amount .amount {
        font-size: 1rem;
      }
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .stat-card {
      min-height: 120px;
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
    }

    .stat-details h3 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-details .stat-value {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .stat-details .stat-subtitle {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .action-card {
      grid-column: span 1;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .action-buttons button {
      justify-content: flex-start;
    }

    .recent-card {
      grid-column: span 2;
      min-height: 300px;
    }

    .chart-card {
      grid-column: span 2;
      min-height: 300px;
    }

    .empty-state,
    .chart-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #999;
      text-align: center;
    }

    .empty-state mat-icon,
    .chart-placeholder mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .empty-state p,
    .chart-placeholder p {
      margin: 4px 0;
    }

    .empty-subtitle,
    .chart-subtitle {
      font-size: 14px;
      margin-bottom: 16px !important;
    }

    .admin-section {
      margin-top: 24px;
    }

    .admin-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .admin-content mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .admin-content div {
      flex: 1;
    }

    .admin-content h3 {
      margin: 0 0 4px 0;
      color: #333;
    }

    .admin-content p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .recent-card,
      .chart-card {
        grid-column: span 1;
      }

      .action-buttons {
        flex-direction: row;
        flex-wrap: wrap;
      }

      .admin-content {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;
  
  currentUser: User | null = null;
  stats: ExpenseStats | null = null;
  recentExpenses: Expense[] = [];
  categories: Category[] = [];
  monthlyTrend: any[] = [];
  loading = true;
  displayedColumns: string[] = ['description', 'amount', 'category', 'date'];
  private destroy$ = new Subject<void>();
  private categoryChart: Chart | null = null;
  private trendChart: Chart | null = null;

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private categoryService: CategoryService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserSync();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Destroy charts to prevent memory leaks
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }
    if (this.trendChart) {
      this.trendChart.destroy();
    }
  }

  private loadDashboardData(): void {
    this.loading = true;
    
    const statsRequest = this.expenseService.getExpenseStats();
    const recentExpensesRequest = this.expenseService.getExpenses({ limit: 2, sortBy: 'date', sortOrder: 'desc' });
    const categoriesRequest = this.categoryService.getCategories();
    const trendRequest = this.expenseService.getMonthlyTrend();
    
    forkJoin({
      stats: statsRequest,
      recentExpenses: recentExpensesRequest,
      categories: categoriesRequest,
      trend: trendRequest
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    )
    .subscribe({
      next: (responses) => {
        this.stats = responses.stats.data;
        this.recentExpenses = responses.recentExpenses.data?.expenses || [];
        this.categories = responses.categories.data?.categories || [];
        this.monthlyTrend = responses.trend.data || [];
        
        // Initialize charts after data is loaded
        setTimeout(() => {
          this.initializeCharts();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        // Handle specific API errors gracefully
        if (error.message && error.message.includes('Validation failed')) {
          console.warn('Dashboard API validation error - some data may not be available');
        }
        // Set default values to prevent UI errors
        this.stats = {
          total: { totalAmount: 0, count: 0 },
          categoryBreakdown: [],
          monthly: [],
          recent: []
        };
        this.categories = [];
        this.monthlyTrend = [];
      }
    });
  }

  private initializeCharts(): void {
    this.initializeCategoryChart();
    this.initializeTrendChart();
  }

  private initializeCategoryChart(): void {
    if (!this.categoryChartRef?.nativeElement || !this.stats?.categoryBreakdown) {
      return;
    }

    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const categoryBreakdown = this.stats.categoryBreakdown;
    const data = {
      labels: categoryBreakdown.map((cat: any) => cat.name),
      datasets: [{
        data: categoryBreakdown.map((cat: any) => cat.totalAmount),
        backgroundColor: categoryBreakdown.map((cat: any) => cat.color || this.getRandomColor()),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = this.formatCurrency(context.parsed);
                const totalExpenses = this.stats?.totalExpenses || context.parsed;
                const percentage = ((context.parsed / totalExpenses) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.categoryChart = new Chart(ctx, config);
  }

  private initializeTrendChart(): void {
    if (!this.trendChartRef?.nativeElement || !this.monthlyTrend?.length) {
      return;
    }

    const ctx = this.trendChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy existing chart
    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const data = {
      labels: this.monthlyTrend.map(item => item.month),
      datasets: [{
        label: 'Monthly Expenses',
        data: this.monthlyTrend.map(item => item.totalAmount),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const yValue = context.parsed?.y || 0;
                return `Expenses: ${this.formatCurrency(yValue)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(Number(value))
            }
          }
        }
      }
    };

    this.trendChart = new Chart(ctx, config);
  }

  private getRandomColor(): string {
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  formatCurrency(amount: number): string {
    return this.currencyService.formatCurrency(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  getCategoryName(categoryId: string | Category): string {
    if (typeof categoryId === 'object') {
      return categoryId.name;
    }
    const category = this.categories.find(c => c._id === categoryId);
    return category?.name || 'Unknown';
  }

  getCategoryIcon(categoryId: string | Category): string {
    if (typeof categoryId === 'object') {
      return categoryId.icon;
    }
    const category = this.categories.find(c => c._id === categoryId);
    return category?.icon || 'help';
  }

  getCategoryColor(categoryId: string | Category): string {
    if (typeof categoryId === 'object') {
      return categoryId.color;
    }
    const category = this.categories.find(c => c._id === categoryId);
    return category?.color || '#666';
  }

  getPercentage(amount: number): number {
    if (!this.stats?.total?.totalAmount) return 0;
    return (amount / this.stats.total.totalAmount) * 100;
  }

  hasRecentExpenses(): boolean {
    return !!(this.stats?.recent && this.stats.recent.length > 0);
  }

  hasCategoryBreakdown(): boolean {
    return !!(this.stats?.categoryBreakdown && this.stats.categoryBreakdown.length > 0);
  }
}
