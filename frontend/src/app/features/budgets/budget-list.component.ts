import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { BudgetService, Budget } from '../../core/services/budget.service';
import { BudgetFormComponent } from './budget-form.component';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="budget-list-container">
      <div class="header">
        <h1>Budget Management</h1>
        <div class="header-actions">
          <button mat-icon-button (click)="refreshBudgets()" matTooltip="Refresh budgets" [disabled]="loading">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-raised-button color="primary" (click)="openBudgetForm()" class="btn-with-icon">
            <mat-icon>add</mat-icon>
            Create Budget
          </button>
        </div>
      </div>

      <div class="filter-chips" *ngIf="budgets.length > 0">
        <mat-chip-listbox>
          <mat-chip-option 
            [selected]="selectedPeriod === 'all'" 
            (click)="filterByPeriod('all')">
            All Periods
          </mat-chip-option>
          <mat-chip-option 
            [selected]="selectedPeriod === 'monthly'" 
            (click)="filterByPeriod('monthly')">
            Monthly
          </mat-chip-option>
          <mat-chip-option 
            [selected]="selectedPeriod === 'weekly'" 
            (click)="filterByPeriod('weekly')">
            Weekly
          </mat-chip-option>
          <mat-chip-option 
            [selected]="selectedPeriod === 'yearly'" 
            (click)="filterByPeriod('yearly')">
            Yearly
          </mat-chip-option>
        </mat-chip-listbox>
      </div>

      <div class="budget-grid" *ngIf="filteredBudgets.length > 0; else noBudgets">
        <mat-card *ngFor="let budget of filteredBudgets" class="budget-card" [class.inactive]="!budget.isActive">
          <mat-card-header>
            <div mat-card-avatar 
                 [style.background-color]="budget.categoryId_populated?.color || '#2196F3'"
                 class="category-avatar">
              <mat-icon>{{ budget.categoryId_populated?.icon || 'category' }}</mat-icon>
            </div>
            <mat-card-title>
              {{ budget.name }}
              <mat-chip *ngIf="!budget.isActive" class="status-chip inactive-chip chip-with-icon">
                <mat-icon>pause</mat-icon>
                Inactive
              </mat-chip>
            </mat-card-title>
            <mat-card-subtitle>
              {{ budget.categoryId_populated?.name }} • {{ getPeriodDisplayName(budget.period) }}
            </mat-card-subtitle>
            <div class="card-actions">
              <button mat-icon-button [matMenuTriggerFor]="budgetMenu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #budgetMenu="matMenu">
                <button mat-menu-item (click)="editBudget(budget)" class="menu-item-with-icon">
                  <mat-icon>edit</mat-icon>
                  Edit
                </button>
                <button mat-menu-item (click)="toggleBudgetStatus(budget)" class="menu-item-with-icon">
                  <mat-icon>{{ budget.isActive ? 'pause' : 'play_arrow' }}</mat-icon>
                  {{ budget.isActive ? 'Deactivate' : 'Activate' }}
                </button>
                <button mat-menu-item (click)="deleteBudget(budget)" class="delete-action menu-item-with-icon">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </mat-menu>
            </div>
          </mat-card-header>

          <mat-card-content>
            <div class="budget-progress">
              <div class="progress-header">
                <span class="spent-amount">
                  {{ formatCurrency(budget.spentAmount || 0) }}
                </span>
                <span class="total-amount">
                  of {{ formatCurrency(budget.amount) }}
                </span>
              </div>
              
              <mat-progress-bar 
                mode="determinate" 
                [value]="budget.percentageUsed || 0"
                [color]="getProgressBarColor(budget.percentageUsed || 0, budget.alertThreshold)">
              </mat-progress-bar>
              
              <div class="progress-footer">
                <span class="percentage">{{ budget.percentageUsed || 0 }}% used</span>
                <span class="remaining" 
                      [class.negative]="(budget.remainingAmount || 0) < 0">
                  {{ formatCurrency(budget.remainingAmount || 0) }} remaining
                </span>
              </div>
            </div>

            <div class="budget-status">
              <mat-chip 
                [style.background-color]="getBudgetStatusColor(budget.percentageUsed || 0, budget.alertThreshold)"
                [style.color]="'white'"
                class="chip-with-icon">
                <mat-icon matChipAvatar>
                  {{ getBudgetStatusIcon(budget.percentageUsed || 0, budget.alertThreshold) }}
                </mat-icon>
                {{ getBudgetStatusText(budget.percentageUsed || 0, budget.alertThreshold) }}
              </mat-chip>
            </div>

            <div class="budget-details" *ngIf="budget.description">
              <p class="description">{{ budget.description }}</p>
            </div>

            <div class="budget-dates">
              <small class="date-range">
                {{ formatDate(budget.startDate) }} - {{ budget.endDate ? formatDate(budget.endDate) : 'Ongoing' }}
              </small>
              <small class="days-remaining" *ngIf="budget.daysRemaining !== undefined">
                {{ getDaysRemainingText(budget.daysRemaining) }}
              </small>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <ng-template #noBudgets>
        <div class="empty-state">
          <mat-icon class="empty-icon">account_balance_wallet</mat-icon>
          <h2>No Budgets Found</h2>
          <p>Create your first budget to start tracking your spending limits.</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .budget-list-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      background: var(--background-color, #fafafa);
      color: var(--text-color, #000000);
      min-height: 100vh;
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .budget-list-container {
      background: var(--background-color-dark, #121212);
      color: var(--text-color-dark, #ffffff);
    }

    .header {
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

    :host-context(.dark-theme) .header {
      background: var(--surface-color-dark, #1e1e1e);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
      color: #4caf50;
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .header h1 {
      color: #66bb6a;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .filter-chips {
      margin-bottom: 20px;
    }

    .budget-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 28px;
    }

    .budget-card {
      position: relative;
      background: var(--surface-color, #ffffff);
      color: var(--text-color, #000000);
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      border: 2px solid transparent;
      overflow: hidden;
    }

    .budget-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      transition: height 0.3s ease;
    }

    .budget-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .budget-card:hover::before {
      height: 8px;
    }

    .budget-card.inactive {
      opacity: 0.7;
      background: var(--surface-disabled, #f8f8f8);
      border: 2px dashed var(--border-color, #ddd);
    }

    .budget-card.inactive::before {
      background: linear-gradient(135deg, #bbb 0%, #999 100%);
    }

    :host-context(.dark-theme) .budget-card {
      background: var(--surface-color-dark, #1e1e1e);
      color: var(--text-color-dark, #ffffff);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .budget-card.inactive {
      background: var(--surface-disabled-dark, #2a2a2a);
      border: 2px dashed #555;
      opacity: 0.5;
    }

    .budget-card mat-card-header {
      position: relative;
    }

    .card-actions {
      position: absolute;
      top: 8px;
      right: 8px;
    }

    .category-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    }

    .budget-card:hover .category-avatar {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }

    .budget-card.inactive .category-avatar {
      opacity: 0.5;
      filter: grayscale(50%);
    }

    .status-chip {
      margin-left: 8px;
      font-size: 11px;
      height: 20px;
      line-height: 20px;
    }

    .inactive-chip {
      background-color: #ff9800;
      color: white;
    }

    .inactive-chip mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      margin-right: 4px;
    }

    :host-context(.dark-theme) .inactive-chip {
      background-color: #f57c00;
      color: white;
    }

    .budget-progress {
      margin: 16px 0;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .spent-amount {
      font-weight: 600;
      color: var(--text-primary, #333);
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .spent-amount {
      color: var(--text-primary-dark, #ffffff);
    }

    .total-amount {
      color: var(--text-secondary, #666);
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .total-amount {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .progress-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 0.875rem;
    }

    .percentage {
      color: var(--text-secondary, #666);
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .percentage {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .remaining {
      color: #4CAF50;
    }

    .remaining.negative {
      color: #F44336;
    }

    .budget-status {
      margin: 16px 0;
    }

    .budget-details {
      margin: 12px 0;
    }

    .description {
      color: var(--text-secondary, #666);
      font-size: 0.875rem;
      margin: 0;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .description {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .budget-dates {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color, #eee);
      transition: border-color 0.3s ease;
    }

    :host-context(.dark-theme) .budget-dates {
      border-top: 1px solid var(--border-color-dark, rgba(255, 255, 255, 0.1));
    }

    .date-range, .days-remaining {
      color: var(--text-secondary, #666);
      font-size: 0.75rem;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .date-range,
    :host-context(.dark-theme) .days-remaining {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--text-disabled, #ccc);
      margin-bottom: 16px;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .empty-icon {
      color: var(--text-disabled-dark, rgba(255, 255, 255, 0.3));
    }

    .empty-state h2 {
      color: var(--text-secondary, #666);
      margin-bottom: 8px;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .empty-state h2 {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .empty-state p {
      color: var(--text-tertiary, #999);
      margin-bottom: 24px;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .empty-state p {
      color: var(--text-tertiary-dark, rgba(255, 255, 255, 0.5));
    }

    .delete-action {
      color: #F44336;
    }

    /* Material Design component overrides for dark theme */
    :host-context(.dark-theme) ::ng-deep .mat-mdc-card {
      background: var(--surface-color-dark, #1e1e1e);
      color: var(--text-color-dark, #ffffff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-card-title {
      color: var(--text-primary-dark, #ffffff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-card-subtitle {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-chip {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-chip.mat-mdc-chip-selected {
      background: var(--primary-color-dark, #7c4dff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-progress-bar .mdc-linear-progress__buffer {
      background-color: rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 768px) {
      .budget-grid {
        grid-template-columns: 1fr;
      }
      
      .header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .budget-list-container {
        padding: 16px;
      }
    }
  `]
})
export class BudgetListComponent implements OnInit {
  budgets: Budget[] = [];
  filteredBudgets: Budget[] = [];
  selectedPeriod: string = 'all';
  loading = true;

  constructor(
    private budgetService: BudgetService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadBudgets();
  }

  loadBudgets(): void {
    this.loading = true;
    this.budgetService.getBudgets().subscribe({
      next: (response) => {
        console.log('Budget API response:', response);
        if (response.success && Array.isArray(response.data)) {
          console.log('Loaded budgets:', response.data);
          response.data.forEach(budget => {
            console.log(`Budget "${budget.name}": spent=${budget.spentAmount}, total=${budget.amount}, percentage=${budget.percentageUsed}%`);
          });
          this.budgets = response.data;
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading budgets:', error);
        this.snackBar.open('Failed to load budgets', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  refreshBudgets(): void {
    this.snackBar.open('Refreshing budgets...', '', { duration: 1000 });
    console.log('Refreshing budgets - before reload');
    this.loadBudgets();
  }

  filterByPeriod(period: string): void {
    this.selectedPeriod = period;
    this.applyFilters();
  }

  applyFilters(): void {
    if (this.selectedPeriod === 'all') {
      this.filteredBudgets = [...this.budgets];
    } else {
      this.filteredBudgets = this.budgets.filter(budget => budget.period === this.selectedPeriod);
    }
  }

  openBudgetForm(budget?: Budget): void {
    const dialogRef = this.dialog.open(BudgetFormComponent, {
      width: '600px',
      data: budget || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBudgets();
      }
    });
  }

  editBudget(budget: Budget): void {
    this.openBudgetForm(budget);
  }

  toggleBudgetStatus(budget: Budget): void {
    this.budgetService.toggleBudgetStatus(budget._id!).subscribe({
      next: (response) => {
        if (response.success) {
          budget.isActive = !budget.isActive;
          this.snackBar.open(
            `Budget ${budget.isActive ? 'activated' : 'deactivated'}`, 
            'Close', 
            { duration: 3000 }
          );
        }
      },
      error: (error) => {
        console.error('Error toggling budget status:', error);
        this.snackBar.open('Failed to update budget status', 'Close', { duration: 3000 });
      }
    });
  }

  deleteBudget(budget: Budget): void {
    if (confirm(`Are you sure you want to delete the budget "${budget.name}"?`)) {
      this.budgetService.deleteBudget(budget._id!).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadBudgets();
            this.snackBar.open('Budget deleted successfully', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error deleting budget:', error);
          this.snackBar.open('Failed to delete budget', 'Close', { duration: 3000 });
        }
      });
    }
  }

  // Helper methods
  formatCurrency(amount: number): string {
    return this.budgetService.formatCurrency(amount);
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  }

  getPeriodDisplayName(period: string): string {
    return this.budgetService.getPeriodDisplayName(period);
  }

  getDaysRemainingText(days: number): string {
    return this.budgetService.getDaysRemainingText(days);
  }

  getProgressBarColor(percentage: number, threshold: number): 'primary' | 'accent' | 'warn' {
    if (percentage >= 100) return 'warn';
    if (percentage >= threshold) return 'accent';
    return 'primary';
  }

  getBudgetStatusColor(percentage: number, threshold: number): string {
    if (percentage >= 100) return '#F44336';
    if (percentage >= threshold) return '#FF9800';
    return '#4CAF50';
  }

  getBudgetStatusIcon(percentage: number, threshold: number): string {
    if (percentage >= 100) return 'error';
    if (percentage >= threshold) return 'warning';
    return 'check_circle';
  }

  getBudgetStatusText(percentage: number, threshold: number): string {
    if (percentage >= 100) return 'Over Budget';
    if (percentage >= threshold) return 'Warning';
    return 'On Track';
  }
}
