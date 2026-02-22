import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { BudgetService, Budget, BudgetCreateRequest } from '../../core/services/budget.service';
import { CategoryService } from '../../core/services/category.service';
import { CurrencyService } from '../../core/services/currency.service';
import { Category } from '../../core/models/expense.model';

@Component({
  selector: 'app-budget-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSliderModule,
    MatSnackBarModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: {
      parse: {
        dateInput: 'MM/DD/YYYY',
      },
      display: {
        dateInput: 'MM/DD/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
      },
    }},
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' }
  ],
  template: `
    <div class="budget-form-container">
      <h2 mat-dialog-title>{{ isEdit ? 'Edit Budget' : 'Create Budget' }}</h2>
      
      <form [formGroup]="budgetForm" (ngSubmit)="onSubmit()" class="budget-form">
        <mat-dialog-content>
          <div class="form-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Budget Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g., Monthly Food Budget">
              <mat-error *ngIf="budgetForm.get('name')?.hasError('required')">
                Budget name is required
              </mat-error>
              <mat-error *ngIf="budgetForm.get('name')?.hasError('minlength')">
                Budget name must be at least 3 characters long
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Category</mat-label>
              <mat-select formControlName="categoryId">
                <mat-option *ngFor="let category of categories" [value]="category._id">
                  <div class="category-option">
                    <div class="category-color" [style.background-color]="category.color"></div>
                    <span>{{ category.name }}</span>
                  </div>
                </mat-option>
              </mat-select>
              <mat-error *ngIf="budgetForm.get('categoryId')?.hasError('required')">
                Category is required
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Budget Amount</mat-label>
              <input matInput type="number" formControlName="amount" placeholder="0.00">
              <span matPrefix>{{ getCurrencySymbol() }}</span>
              <mat-error *ngIf="budgetForm.get('amount')?.hasError('required')">
                Amount is required
              </mat-error>
              <mat-error *ngIf="budgetForm.get('amount')?.hasError('min')">
                Amount must be greater than 0
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Period</mat-label>
              <mat-select formControlName="period">
                <mat-option value="daily">Daily</mat-option>
                <mat-option value="weekly">Weekly</mat-option>
                <mat-option value="monthly">Monthly</mat-option>
                <mat-option value="yearly">Yearly</mat-option>
              </mat-select>
              <mat-error *ngIf="budgetForm.get('period')?.hasError('required')">
                Period is required
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
              <mat-error *ngIf="budgetForm.get('startDate')?.hasError('required')">
                Start date is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
              <mat-error *ngIf="budgetForm.get('endDate')?.hasError('required')">
                End date is required
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <div class="slider-container">
              <label class="slider-label">Alert Threshold: {{ budgetForm.get('alertThreshold')?.value }}%</label>
              <mat-slider 
                min="0" 
                max="100" 
                step="5" 
                discrete
                [displayWith]="formatSliderLabel">
                <input matSliderThumb formControlName="alertThreshold">
              </mat-slider>
              <div class="slider-help">
                Alert threshold: {{ budgetForm.get('alertThreshold')?.value || 80 }}% of budget spent
              </div>
            </div>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description (Optional)</mat-label>
              <textarea 
                matInput 
                formControlName="description" 
                rows="3"
                placeholder="Add notes about this budget...">
              </textarea>
              <mat-error *ngIf="budgetForm.get('description')?.hasError('maxlength')">
                Description cannot exceed 200 characters
              </mat-error>
            </mat-form-field>
          </div>

        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            [disabled]="budgetForm.invalid || loading">
            {{ loading ? 'Saving...' : (isEdit ? 'Update Budget' : 'Create Budget') }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .budget-form-container {
      width: 100%;
      max-width: 600px;
      background: var(--surface-color, #ffffff);
      color: var(--text-color, #000000);
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .budget-form-container {
      background: var(--surface-color-dark, #1e1e1e);
      color: var(--text-color-dark, #ffffff);
    }

    .budget-form {
      width: 100%;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      align-items: flex-start;
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      width: calc(50% - 8px);
    }

    .category-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .category-color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    .slider-container {
      width: 100%;
    }

    .slider-label {
      display: block;
      font-weight: 500;
      color: var(--text-primary, rgba(0, 0, 0, 0.87));
      margin-bottom: 8px;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .slider-label {
      color: var(--text-primary-dark, rgba(255, 255, 255, 0.87));
    }

    .slider-help {
      font-size: 0.75rem;
      color: var(--text-secondary, rgba(0, 0, 0, 0.6));
      margin-top: 8px;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .slider-help {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.6));
    }


    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin: 0;
    }

    /* Material Design component overrides for dark theme */
    :host-context(.dark-theme) ::ng-deep .mat-mdc-dialog-surface {
      background: var(--surface-color-dark, #1e1e1e);
      color: var(--text-color-dark, #ffffff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-dialog-title {
      color: var(--text-primary-dark, #ffffff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-form-field {
      --mdc-outlined-text-field-label-text-color: rgba(255, 255, 255, 0.7);
      --mdc-outlined-text-field-input-text-color: #ffffff;
      --mdc-outlined-text-field-outline-color: rgba(255, 255, 255, 0.3);
      --mdc-outlined-text-field-hover-outline-color: rgba(255, 255, 255, 0.5);
      --mdc-outlined-text-field-focused-outline-color: var(--primary-color-dark, #7c4dff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-select-panel {
      background: var(--surface-color-dark, #2d2d2d);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-option {
      color: var(--text-color-dark, #ffffff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-option:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-checkbox .mdc-checkbox__native-control:enabled:not(:checked):not(:indeterminate):not([data-indeterminate=true]) ~ .mdc-checkbox__background {
      border-color: rgba(255, 255, 255, 0.7);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-checkbox .mdc-form-field > label {
      color: var(--text-color-dark, #ffffff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-mdc-slider {
      --mdc-slider-handle-color: var(--primary-color-dark, #7c4dff);
      --mdc-slider-focus-handle-color: var(--primary-color-dark, #7c4dff);
      --mdc-slider-hover-handle-color: var(--primary-color-dark, #7c4dff);
      --mdc-slider-active-track-color: var(--primary-color-dark, #7c4dff);
      --mdc-slider-inactive-track-color: rgba(255, 255, 255, 0.3);
      --mdc-slider-with-tick-marks-inactive-container-color: rgba(255, 255, 255, 0.3);
      --mdc-slider-with-tick-marks-active-container-color: var(--primary-color-dark, #7c4dff);
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
      }
      
      .half-width {
        width: 100%;
      }
    }
  `]
})
export class BudgetFormComponent implements OnInit {
  budgetForm: FormGroup;
  categories: Category[] = [];
  loading = false;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private currencyService: CurrencyService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<BudgetFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Budget | null
  ) {
    this.isEdit = !!data;
    this.budgetForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    if (this.data) {
      this.populateForm(this.data);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      categoryId: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1), Validators.max(10000000)]],
      period: ['monthly', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [this.getDefaultEndDate(), Validators.required],
      alertThreshold: [80, [Validators.min(0), Validators.max(100)]],
      description: ['', Validators.maxLength(200)]
    });
  }

  getDefaultEndDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 1); // Default to 1 month from now
    return date;
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        if (response.success && response.data?.categories) {
          this.categories = response.data.categories.filter(cat => cat.isActive);
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
        // Fallback to empty array if categories fail to load
        this.categories = [];
      }
    });
  }

  populateForm(budget: Budget): void {
    this.budgetForm.patchValue({
      name: budget.name,
      categoryId: budget.categoryId,
      amount: budget.amount,
      period: budget.period,
      startDate: new Date(budget.startDate),
      endDate: budget.endDate ? new Date(budget.endDate) : this.getDefaultEndDate(),
      alertThreshold: budget.alertThreshold,
      description: budget.description || ''
    });
  }

  onSubmit(): void {
    if (this.budgetForm.valid) {
      this.loading = true;
      const formValue = this.budgetForm.value;
      
      const budgetData: BudgetCreateRequest = {
        name: formValue.name,
        categoryId: formValue.categoryId,
        amount: Number(formValue.amount),
        period: formValue.period,
        startDate: formValue.startDate ? new Date(formValue.startDate).toISOString() : new Date().toISOString(),
        endDate: formValue.endDate ? new Date(formValue.endDate).toISOString() : this.getDefaultEndDate().toISOString(),
        alertThreshold: Number(formValue.alertThreshold || 80),
        isActive: true,
        description: formValue.description || '',
        notifications: {
          email: false,
          push: false
        }
      };

      console.log('Sending budget data:', budgetData);
      console.log('Form values:', formValue);

      const operation = this.isEdit
        ? this.budgetService.updateBudget(this.data!._id!, budgetData)
        : this.budgetService.createBudget(budgetData);

      operation.subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open(
              `Budget ${this.isEdit ? 'updated' : 'created'} successfully`,
              'Close',
              { duration: 3000 }
            );
            this.dialogRef.close(true);
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error saving budget:', error);
          console.error('Error details:', error.error);
          
          let errorMessage = `Failed to ${this.isEdit ? 'update' : 'create'} budget`;
          if (error.error?.errors && error.error.errors.length > 0) {
            errorMessage = error.error.errors[0].msg || errorMessage;
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  formatSliderLabel(value: number): string {
    return `${value}%`;
  }

  getCurrencySymbol(): string {
    return this.currencyService.getCurrencySymbol();
  }
}
