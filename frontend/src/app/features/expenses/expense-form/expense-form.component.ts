import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, startWith, map } from 'rxjs/operators';

import { ExpenseService } from '../../../core/services/expense.service';
import { CategoryService } from '../../../core/services/category.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { Expense, Category, CreateExpenseRequest, UpdateExpenseRequest } from '../../../core/models/expense.model';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  template: `
    <div class="expense-form-container">
      <div class="expense-form-header">
        <h1>{{ isEditMode ? 'Edit Expense' : 'Add Expense' }}</h1>
        <button mat-icon-button routerLink="/expenses">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="loading-container" *ngIf="loading">
        <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
        <p>{{ isEditMode ? 'Loading expense...' : 'Loading form...' }}</p>
      </div>

      <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()" *ngIf="!loading">
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Expense Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="form-grid">
              <!-- Amount -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Amount *</mat-label>
                <input matInput type="number" formControlName="amount" placeholder="0.00" step="0.01">
                <span matPrefix>{{ getCurrencySymbol() }}&nbsp;</span>
                <mat-error *ngIf="expenseForm.get('amount')?.hasError('required')">
                  Amount is required
                </mat-error>
                <mat-error *ngIf="expenseForm.get('amount')?.hasError('min')">
                  Amount must be greater than 0
                </mat-error>
              </mat-form-field>

              <!-- Description -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description *</mat-label>
                <input matInput formControlName="description" placeholder="What did you spend on?">
                <mat-error *ngIf="expenseForm.get('description')?.hasError('required')">
                  Description is required
                </mat-error>
              </mat-form-field>

              <!-- Category -->
              <mat-form-field appearance="outline">
                <mat-label>Category *</mat-label>
                <mat-select formControlName="categoryId">
                  <mat-option *ngFor="let category of categories" [value]="category._id">
                    <mat-icon [style.color]="category.color" class="option-icon">{{ category.icon }}</mat-icon>
                    {{ category.name }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="expenseForm.get('categoryId')?.hasError('required')">
                  Category is required
                </mat-error>
              </mat-form-field>

              <!-- Date -->
              <mat-form-field appearance="outline">
                <mat-label>Date *</mat-label>
                <input matInput [matDatepicker]="datePicker" formControlName="date">
                <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
                <mat-datepicker #datePicker></mat-datepicker>
                <mat-error *ngIf="expenseForm.get('date')?.hasError('required')">
                  Date is required
                </mat-error>
              </mat-form-field>

              <!-- Payment Method -->
              <mat-form-field appearance="outline">
                <mat-label>Payment Method</mat-label>
                <mat-select formControlName="paymentMethod">
                  <mat-option value="cash">Cash</mat-option>
                  <mat-option value="credit_card">Credit Card</mat-option>
                  <mat-option value="debit_card">Debit Card</mat-option>
                  <mat-option value="bank_transfer">Bank Transfer</mat-option>
                  <mat-option value="digital_wallet">Digital Wallet</mat-option>
                  <mat-option value="other">Other</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Location -->
              <mat-form-field appearance="outline">
                <mat-label>Location</mat-label>
                <input matInput formControlName="location" placeholder="Where did you spend?">
              </mat-form-field>
            </div>

            <!-- Tags -->
            <div class="tags-section">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tags</mat-label>
                <mat-chip-grid #chipGrid>
                  <mat-chip-row *ngFor="let tag of tags; let i = index" (removed)="removeTag(i)">
                    {{ tag }}
                    <button matChipRemove>
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </mat-chip-row>
                </mat-chip-grid>
                <input matInput
                       [matChipInputFor]="chipGrid"
                       [matAutocomplete]="tagAutocomplete"
                       formControlName="tagInput"
                       (matChipInputTokenEnd)="addTag($event)">
                <mat-autocomplete #tagAutocomplete="matAutocomplete" (optionSelected)="selectTag($event)">
                  <mat-option *ngFor="let tag of filteredTags | async" [value]="tag">
                    {{ tag }}
                  </mat-option>
                </mat-autocomplete>
              </mat-form-field>
            </div>

            <!-- Notes -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notes</mat-label>
              <textarea matInput formControlName="notes" rows="3" placeholder="Additional notes..."></textarea>
            </mat-form-field>

            <!-- Recurring Options -->
            <div class="recurring-section">
              <mat-checkbox formControlName="isRecurring">
                Make this a recurring expense
              </mat-checkbox>
              
              <mat-form-field appearance="outline" *ngIf="expenseForm.get('isRecurring')?.value">
                <mat-label>Recurring Pattern</mat-label>
                <mat-select formControlName="recurringPattern">
                  <mat-option value="daily">Daily</mat-option>
                  <mat-option value="weekly">Weekly</mat-option>
                  <mat-option value="monthly">Monthly</mat-option>
                  <mat-option value="yearly">Yearly</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Form Actions -->
        <div class="form-actions">
          <button mat-stroked-button type="button" routerLink="/expenses">
            Cancel
          </button>
          <button mat-raised-button color="primary" type="submit" [disabled]="expenseForm.invalid || submitting">
            <mat-icon *ngIf="submitting">hourglass_empty</mat-icon>
            <mat-icon *ngIf="!submitting">{{ isEditMode ? 'update' : 'save' }}</mat-icon>
            {{ submitting ? 'Saving...' : (isEditMode ? 'Update Expense' : 'Save Expense') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .expense-form-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .expense-form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .expense-form-header h1 {
      margin: 0;
      color: var(--text-primary);
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

    .form-card {
      margin-bottom: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .full-width {
      grid-column: span 2;
    }

    .option-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      margin-right: 8px !important;
      vertical-align: middle !important;
    }

    mat-option {
      display: flex !important;
      align-items: center !important;
    }

    .tags-section {
      margin-bottom: 24px;
    }

    .recurring-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 0;
    }

    .form-actions button {
      min-width: 120px;
    }

    @media (max-width: 768px) {
      .expense-form-container {
        padding: 16px;
      }

      .expense-form-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .form-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .full-width {
        grid-column: span 1;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class ExpenseFormComponent implements OnInit, OnDestroy {
  expenseForm: FormGroup;
  categories: Category[] = [];
  tags: string[] = [];
  allTags: string[] = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'health', 'education', 'travel'];
  filteredTags: any;
  loading = true;
  submitting = false;
  isEditMode = false;
  expenseId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private categoryService: CategoryService,
    private currencyService: CurrencyService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.expenseForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', Validators.required],
      categoryId: ['', Validators.required],
      date: [new Date(), Validators.required],
      paymentMethod: ['cash'],
      location: [''],
      notes: [''],
      isRecurring: [false],
      recurringPattern: ['monthly'],
      tagInput: ['']
    });

    this.filteredTags = this.expenseForm.get('tagInput')?.valueChanges.pipe(
      startWith(''),
      map((value: string) => this.filterTags(value))
    );
  }

  ngOnInit(): void {
    this.expenseId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.expenseId;
    
    this.loadCategories();
    
    if (this.isEditMode) {
      this.loadExpense();
    } else {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
          this.snackBar.open('Error loading categories', 'Close', { duration: 3000 });
        }
      });
  }

  private loadExpense(): void {
    if (!this.expenseId) return;
    
    this.expenseService.getExpenseById(this.expenseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const expense = response.data?.expense;
          if (expense) {
            this.populateForm(expense);
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading expense:', error);
          this.snackBar.open('Error loading expense', 'Close', { duration: 3000 });
          this.router.navigate(['/expenses']);
        }
      });
  }

  private populateForm(expense: Expense): void {
    this.tags = expense.tags || [];
    this.expenseForm.patchValue({
      amount: expense.amount,
      description: expense.description,
      categoryId: typeof expense.categoryId === 'string' ? expense.categoryId : expense.categoryId._id,
      date: new Date(expense.date),
      paymentMethod: expense.paymentMethod,
      location: expense.location || '',
      notes: expense.notes || '',
      isRecurring: expense.isRecurring,
      recurringPattern: expense.recurringPattern || 'monthly'
    });
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.expenseForm.value;
    
    const expenseData = {
      amount: formValue.amount,
      description: formValue.description,
      categoryId: formValue.categoryId,
      date: formValue.date,
      paymentMethod: formValue.paymentMethod,
      location: formValue.location,
      notes: formValue.notes,
      tags: this.tags,
      isRecurring: formValue.isRecurring,
      recurringPattern: formValue.isRecurring ? formValue.recurringPattern : undefined
    };

    const request = this.isEditMode
      ? this.expenseService.updateExpense(this.expenseId!, expenseData as UpdateExpenseRequest)
      : this.expenseService.createExpense(expenseData as CreateExpenseRequest);

    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(
            `Expense ${this.isEditMode ? 'updated' : 'created'} successfully`,
            'Close',
            { duration: 3000 }
          );
          this.router.navigate(['/expenses']);
        },
        error: (error) => {
          console.error('Error saving expense:', error);
          this.snackBar.open(
            `Error ${this.isEditMode ? 'updating' : 'creating'} expense`,
            'Close',
            { duration: 3000 }
          );
          this.submitting = false;
        }
      });
  }

  addTag(event: any): void {
    const value = (event.value || '').trim();
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
    }
    event.chipInput!.clear();
    this.expenseForm.get('tagInput')?.setValue('');
  }

  removeTag(index: number): void {
    this.tags.splice(index, 1);
  }

  selectTag(event: any): void {
    const value = event.option.value;
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
    }
    this.expenseForm.get('tagInput')?.setValue('');
  }

  private filterTags(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allTags.filter(tag => 
      tag.toLowerCase().includes(filterValue) && !this.tags.includes(tag)
    );
  }

  private markFormGroupTouched(): void {
    Object.keys(this.expenseForm.controls).forEach(key => {
      this.expenseForm.get(key)?.markAsTouched();
    });
  }

  getCurrencySymbol(): string {
    return this.currencyService.getCurrencySymbol();
  }
}
