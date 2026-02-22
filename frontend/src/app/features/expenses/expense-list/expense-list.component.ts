import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ExpenseService } from '../../../core/services/expense.service';
import { CategoryService } from '../../../core/services/category.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { Expense, Category, ExpenseFilters } from '../../../core/models/expense.model';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  template: `
    <div class="expense-list-container">
      <div class="expense-list-header">
        <h1>Expenses</h1>
        <div class="header-actions">
          <button mat-stroked-button (click)="exportExpenses()" [disabled]="loading" class="btn-with-icon">
            <mat-icon>download</mat-icon>
            Export
          </button>
          <button mat-raised-button color="primary" routerLink="/expenses/add" class="btn-with-icon">
            <mat-icon>add</mat-icon>
            Add Expense
          </button>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <form [formGroup]="filterForm" class="filters-form">
            <mat-form-field appearance="outline">
              <mat-label>Search</mat-label>
              <input matInput formControlName="search" placeholder="Search expenses...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="categoryId">
                <mat-option value="">All Categories</mat-option>
                <mat-option *ngFor="let category of categories" [value]="category._id" class="select-option-with-icon">
                  <mat-icon [style.color]="category.color">{{ category.icon }}</mat-icon>
                  {{ category.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Payment Method</mat-label>
              <mat-select formControlName="paymentMethod">
                <mat-option value="">All Methods</mat-option>
                <mat-option value="cash">Cash</mat-option>
                <mat-option value="credit_card">Credit Card</mat-option>
                <mat-option value="debit_card">Debit Card</mat-option>
                <mat-option value="bank_transfer">Bank Transfer</mat-option>
                <mat-option value="digital_wallet">Digital Wallet</mat-option>
                <mat-option value="other">Other</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>

            <button mat-stroked-button type="button" (click)="clearFilters()" class="btn-with-icon">
              <mat-icon>clear</mat-icon>
              Clear
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Expense Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="loading-container" *ngIf="loading">
            <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
            <p>Loading expenses...</p>
          </div>

          <div class="empty-state" *ngIf="!loading && expenses.length === 0">
            <mat-icon>receipt_long</mat-icon>
            <h3>No expenses found</h3>
            <p *ngIf="hasActiveFilters()">Try adjusting your filters or</p>
            <p *ngIf="!hasActiveFilters()">Start by adding your first expense</p>
            <button mat-raised-button color="primary" routerLink="/expenses/add" class="btn-with-icon">
              <mat-icon>add</mat-icon>
              Add Expense
            </button>
          </div>

          <div class="table-container" *ngIf="!loading && expenses.length > 0">
            <table mat-table [dataSource]="expenses" class="expense-table">
              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let expense">{{ formatDate(expense.date) }}</td>
              </ng-container>

              <!-- Category Column -->
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let expense">
                  <div class="category-cell table-cell-with-icon">
                    <mat-icon [style.color]="getCategoryColor(expense.categoryId)">{{ getCategoryIcon(expense.categoryId) }}</mat-icon>
                    <span>{{ getCategoryName(expense.categoryId) }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Description Column -->
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let expense">
                  <div class="description-cell">
                    <span class="description">{{ expense.description }}</span>
                    <span class="location" *ngIf="expense.location">{{ expense.location }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Amount Column -->
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let expense">
                  <span class="amount">{{ formatCurrency(expense.amount) }}</span>
                </td>
              </ng-container>

              <!-- Payment Method Column -->
              <ng-container matColumnDef="paymentMethod">
                <th mat-header-cell *matHeaderCellDef>Payment</th>
                <td mat-cell *matCellDef="let expense">
                  <mat-chip class="payment-chip">{{ formatPaymentMethod(expense.paymentMethod) }}</mat-chip>
                </td>
              </ng-container>

              <!-- Tags Column -->
              <ng-container matColumnDef="tags">
                <th mat-header-cell *matHeaderCellDef>Tags</th>
                <td mat-cell *matCellDef="let expense">
                  <div class="tags-cell">
                    <mat-chip *ngFor="let tag of expense.tags?.slice(0, 2)" class="tag-chip">{{ tag }}</mat-chip>
                    <span *ngIf="expense.tags && expense.tags.length > 2" class="more-tags">+{{ expense.tags.length - 2 }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let expense">
                  <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #actionMenu="matMenu">
                    <button mat-menu-item [routerLink]="['/expenses/edit', expense._id]" class="menu-item-with-icon">
                      <mat-icon>edit</mat-icon>
                      <span>Edit</span>
                    </button>
                    <button mat-menu-item (click)="deleteExpense(expense)" class="menu-item-with-icon">
                      <mat-icon color="warn">delete</mat-icon>
                      <span>Delete</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Pagination -->
            <mat-paginator
              [length]="totalExpenses"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50, 100]"
              [pageIndex]="currentPage - 1"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .expense-list-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      background: var(--background-color, #fafafa);
      min-height: 100vh;
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .expense-list-container {
      background: var(--background-color-dark, #121212);
    }

    .expense-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding: 24px;
      background: var(--surface-color, #ffffff);
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .expense-list-header {
      background: var(--surface-color-dark, #1e1e1e);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
    }

    .expense-list-header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 600;
      color: #667eea;
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .expense-list-header h1 {
      color: #bb86fc;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .filters-card {
      margin-bottom: 24px;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
      background: var(--surface-color, #ffffff);
    }

    :host-context(.dark-theme) .filters-card {
      background: var(--surface-color-dark, #1e1e1e);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
    }

    .filters-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      align-items: end;
      padding: 4px;
    }

    .filters-form button {
      height: 56px;
      margin-bottom: 0;
      align-self: end;
    }

    .table-card {
      min-height: 400px;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
      background: var(--surface-color, #ffffff);
    }

    :host-context(.dark-theme) .table-card {
      background: var(--surface-color-dark, #1e1e1e);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: var(--text-secondary);
    }

    .loading-container mat-progress-spinner {
      margin-bottom: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: var(--text-secondary);
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: var(--text-primary);
    }

    .empty-state p {
      margin: 4px 0;
    }

    .empty-state button {
      margin-top: 16px;
    }

    .table-container {
      overflow-x: auto;
    }

    .expense-table {
      width: 100%;
      min-width: 800px;
      border-radius: 12px;
      overflow: hidden;
    }

    .expense-table th {
      background: var(--primary-color, #2196F3);
      color: white;
      font-weight: 600;
      padding: 16px 12px;
      border-bottom: none;
    }

    :host-context(.dark-theme) .expense-table th {
      background: var(--primary-color-dark, #7c4dff);
    }

    .expense-table td {
      padding: 16px 12px;
      border-bottom: 1px solid var(--border-color, #f0f0f0);
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .expense-table td {
      border-bottom: 1px solid var(--border-color-dark, rgba(255, 255, 255, 0.1));
    }

    .expense-table tr:hover td {
      background: var(--hover-color, #f8f9fa);
      transform: scale(1.01);
    }

    :host-context(.dark-theme) .expense-table tr:hover td {
      background: var(--hover-color-dark, rgba(255, 255, 255, 0.05));
    }

    .category-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .category-cell mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      padding: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
    }

    .description-cell .description {
      display: block;
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--text-primary, #1a1a1a);
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .description-cell .description {
      color: var(--text-primary-dark, #ffffff);
    }

    .description-cell .location {
      display: block;
      font-size: 12px;
      color: var(--text-secondary, #666);
      font-style: italic;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .description-cell .location {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .amount {
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--success-color, #4caf50);
      color: #4caf50;
    }

    .payment-chip {
      font-size: 12px;
      min-height: 24px;
      line-height: 24px;
      padding: 4px 12px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .tags-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .tag-chip {
      font-size: 11px;
      min-height: 20px;
      line-height: 20px;
      padding: 2px 8px;
      border-radius: 10px;
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
      color: #8b4513;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    :host-context(.dark-theme) .tag-chip {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .more-tags {
      font-size: 12px;
      color: var(--text-secondary, #666);
      font-weight: 500;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .more-tags {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    @media (max-width: 768px) {
      .expense-list-container {
        padding: 16px;
      }

      .expense-list-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .header-actions {
        width: 100%;
        justify-content: center;
      }

      .filters-form {
        grid-template-columns: 1fr;
      }

      .expense-table {
        min-width: 600px;
      }
    }
  `]
})
export class ExpenseListComponent implements OnInit, OnDestroy {
  expenses: Expense[] = [];
  categories: Category[] = [];
  loading = true;
  totalExpenses = 0;
  currentPage = 1;
  pageSize = 25;
  filterForm: FormGroup;
  displayedColumns: string[] = ['date', 'category', 'description', 'amount', 'paymentMethod', 'tags', 'actions'];
  private destroy$ = new Subject<void>();

  constructor(
    private expenseService: ExpenseService,
    private categoryService: CategoryService,
    private currencyService: CurrencyService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      categoryId: [''],
      paymentMethod: [''],
      startDate: [null],
      endDate: [null]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.setupQueryParamFilters();
    this.loadExpenses();
    this.setupFilterSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupQueryParamFilters(): void {
    // Check for category query parameter and set the filter
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        console.log('Query params:', params); // Debug log
        if (params['category']) {
          console.log('Setting category filter to:', params['category']); // Debug log
          this.filterForm.patchValue({
            categoryId: params['category']
          });
        }
      });
  }

  private loadCategories(): void {
    this.categoryService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.categories = response.data?.categories || [];
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  private loadExpenses(): void {
    this.loading = true;
    const filters = this.buildFilters();
    
    this.expenseService.getExpenses(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.expenses = response.data.expenses;
          this.totalExpenses = response.data.pagination?.totalExpenses || 0;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading expenses:', error);
          this.loading = false;
          this.snackBar.open('Error loading expenses', 'Close', { duration: 3000 });
        }
      });
  }

  private setupFilterSubscriptions(): void {
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadExpenses();
      });
  }

  private buildFilters(): ExpenseFilters {
    const formValue = this.filterForm.value;
    const filters: ExpenseFilters = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (formValue.search) {
      filters.description = formValue.search;
    }
    if (formValue.categoryId) {
      filters.category = formValue.categoryId;
    }
    if (formValue.paymentMethod) {
      filters.paymentMethod = formValue.paymentMethod;
    }
    if (formValue.startDate) {
      filters.startDate = formValue.startDate.toISOString().split('T')[0];
    }
    if (formValue.endDate) {
      filters.endDate = formValue.endDate.toISOString().split('T')[0];
    }

    console.log('Built filters:', filters); // Debug log
    return filters;
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadExpenses();
  }

  clearFilters(): void {
    this.filterForm.reset();
  }

  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return Object.values(formValue).some(value => value !== null && value !== '');
  }

  exportExpenses(): void {
    const filters = this.buildFilters();
    this.expenseService.exportExpenses(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
          this.snackBar.open('Expenses exported successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error exporting expenses:', error);
          this.snackBar.open('Error exporting expenses', 'Close', { duration: 3000 });
        }
      });
  }

  deleteExpense(expense: Expense): void {
    if (confirm(`Are you sure you want to delete "${expense.description}"?`)) {
      this.expenseService.deleteExpense(expense._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Expense deleted successfully', 'Close', { duration: 3000 });
            this.loadExpenses();
          },
          error: (error) => {
            console.error('Error deleting expense:', error);
            this.snackBar.open('Error deleting expense', 'Close', { duration: 3000 });
          }
        });
    }
  }

  formatCurrency(amount: number): string {
    return this.currencyService.formatCurrency(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatPaymentMethod(method: string): string {
    return method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
}
