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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { ReportService, Report } from '../../core/services/report.service';
import { CategoryService } from '../../core/services/category.service';
import { CurrencyService } from '../../core/services/currency.service';

@Component({
  selector: 'app-report-form',
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
    MatCheckboxModule,
    MatSnackBarModule,
    MatStepperModule,
    MatChipsModule
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
    <div class="report-form-container">
      <h2 mat-dialog-title>{{ isEdit ? 'Edit Report' : 'Create Report' }}</h2>
      
      <mat-stepper [linear]="true" #stepper>
        <!-- Basic Information Step -->
        <mat-step [stepControl]="basicInfoForm" label="Basic Information">
          <form [formGroup]="basicInfoForm" class="step-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Report Name</mat-label>
                <input matInput formControlName="name" placeholder="e.g., Monthly Expense Analysis">
                <mat-error *ngIf="basicInfoForm.get('name')?.hasError('required')">
                  Report name is required
                </mat-error>
                <mat-error *ngIf="basicInfoForm.get('name')?.hasError('minlength')">
                  Report name must be at least 3 characters long
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Report Type</mat-label>
                <mat-select formControlName="type">
                  <mat-option value="expense_summary">Expense Summary</mat-option>
                  <mat-option value="category_breakdown">Category Breakdown</mat-option>
                  <mat-option value="monthly_trends">Monthly Trends</mat-option>
                  <mat-option value="budget_analysis">Budget Analysis</mat-option>
                  <mat-option value="custom">Custom Report</mat-option>
                </mat-select>
                <mat-error *ngIf="basicInfoForm.get('type')?.hasError('required')">
                  Report type is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Chart Type</mat-label>
                <mat-select formControlName="chartType">
                  <mat-option value="pie">Pie Chart</mat-option>
                  <mat-option value="bar">Bar Chart</mat-option>
                  <mat-option value="line">Line Chart</mat-option>
                  <mat-option value="doughnut">Doughnut Chart</mat-option>
                  <mat-option value="area">Area Chart</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description (Optional)</mat-label>
                <textarea 
                  matInput 
                  formControlName="description" 
                  rows="3"
                  placeholder="Describe what this report analyzes...">
                </textarea>
                <mat-error *ngIf="basicInfoForm.get('description')?.hasError('maxlength')">
                  Description cannot exceed 300 characters
                </mat-error>
              </mat-form-field>
            </div>

            <div class="step-actions">
              <button mat-raised-button color="primary" matStepperNext>Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Date Range Step -->
        <mat-step [stepControl]="dateRangeForm" label="Date Range">
          <form [formGroup]="dateRangeForm" class="step-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
                <mat-error *ngIf="dateRangeForm.get('startDate')?.hasError('required')">
                  Start date is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
                <mat-error *ngIf="dateRangeForm.get('endDate')?.hasError('required')">
                  End date is required
                </mat-error>
                <mat-error *ngIf="dateRangeForm.get('endDate')?.hasError('dateRange')">
                  End date must be after start date
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Group By</mat-label>
                <mat-select formControlName="groupBy">
                  <mat-option value="category">Category</mat-option>
                  <mat-option value="date">Date</mat-option>
                  <mat-option value="payment_method">Payment Method</mat-option>
                  <mat-option value="tag">Tag</mat-option>
                  <mat-option value="month">Month</mat-option>
                  <mat-option value="week">Week</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="quick-ranges">
              <h4>Quick Date Ranges</h4>
              <div class="range-buttons">
                <button mat-stroked-button type="button" (click)="setDateRange('thisMonth')">
                  This Month
                </button>
                <button mat-stroked-button type="button" (click)="setDateRange('lastMonth')">
                  Last Month
                </button>
                <button mat-stroked-button type="button" (click)="setDateRange('last3Months')">
                  Last 3 Months
                </button>
                <button mat-stroked-button type="button" (click)="setDateRange('thisYear')">
                  This Year
                </button>
              </div>
            </div>

            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" matStepperNext>Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Filters Step -->
        <mat-step [stepControl]="filtersForm" label="Filters">
          <form [formGroup]="filtersForm" class="step-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Categories (Optional)</mat-label>
                <mat-select formControlName="categories" multiple>
                  <mat-option *ngFor="let category of categories" [value]="category._id">
                    <div class="category-option">
                      <div class="category-color" [style.background-color]="category.color"></div>
                      <span>{{ category.name }}</span>
                    </div>
                  </mat-option>
                </mat-select>
                <mat-hint>Leave empty to include all categories</mat-hint>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Payment Methods (Optional)</mat-label>
                <mat-select formControlName="paymentMethods" multiple>
                  <mat-option value="cash">Cash</mat-option>
                  <mat-option value="credit_card">Credit Card</mat-option>
                  <mat-option value="debit_card">Debit Card</mat-option>
                  <mat-option value="bank_transfer">Bank Transfer</mat-option>
                  <mat-option value="digital_wallet">Digital Wallet</mat-option>
                  <mat-option value="other">Other</mat-option>
                </mat-select>
                <mat-hint>Leave empty to include all payment methods</mat-hint>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Min Amount (Optional)</mat-label>
                <input matInput type="number" formControlName="minAmount" placeholder="0.00">
                <span matPrefix>{{ getCurrencySymbol() }}</span>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Max Amount (Optional)</mat-label>
                <input matInput type="number" formControlName="maxAmount" placeholder="1000.00">
                <span matPrefix>{{ getCurrencySymbol() }}</span>
              </mat-form-field>
            </div>

            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-raised-button color="primary" matStepperNext>Next</button>
            </div>
          </form>
        </mat-step>

        <!-- Settings Step -->
        <mat-step [stepControl]="settingsForm" label="Settings">
          <form [formGroup]="settingsForm" class="step-form">
            <div class="settings-section">
              <h4>Report Settings</h4>
              <div class="checkbox-group">
                <mat-checkbox formControlName="isPublic">
                  Make report public
                </mat-checkbox>
                <mat-checkbox formControlName="isFavorite">
                  Add to favorites
                </mat-checkbox>
              </div>
            </div>

            <div class="settings-section">
              <h4>Display Settings</h4>
              <div class="checkbox-group">
                <mat-checkbox formControlName="showPercentages">
                  Show percentages
                </mat-checkbox>
                <mat-checkbox formControlName="showTrends">
                  Show trends
                </mat-checkbox>
                <mat-checkbox formControlName="includeSubcategories">
                  Include subcategories
                </mat-checkbox>
              </div>
            </div>

            <div class="settings-section">
              <h4>Scheduling (Optional)</h4>
              <mat-checkbox formControlName="isScheduled" (change)="onScheduleToggle($event)">
                Schedule this report
              </mat-checkbox>
              
              <div *ngIf="settingsForm.get('isScheduled')?.value" class="schedule-options">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Frequency</mat-label>
                  <mat-select formControlName="scheduleFrequency">
                    <mat-option value="daily">Daily</mat-option>
                    <mat-option value="weekly">Weekly</mat-option>
                    <mat-option value="monthly">Monthly</mat-option>
                    <mat-option value="quarterly">Quarterly</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email Recipients (Optional)</mat-label>
                  <input matInput formControlName="emailRecipients" placeholder="email1@example.com, email2@example.com">
                  <mat-hint>Separate multiple emails with commas</mat-hint>
                </mat-form-field>
              </div>
            </div>

            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button 
                mat-raised-button 
                color="primary" 
                (click)="onSubmit()"
                [disabled]="!isFormValid() || loading">
                {{ loading ? 'Saving...' : (isEdit ? 'Update Report' : 'Create Report') }}
              </button>
            </div>
          </form>
        </mat-step>
      </mat-stepper>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="onCancel()">Cancel</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .report-form-container {
      width: 100%;
      max-width: 800px;
      background: var(--surface-color, #ffffff);
      color: var(--text-color, #000000);
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .report-form-container {
      background: var(--surface-color-dark, #1e1e1e);
      color: var(--text-color-dark, #ffffff);
    }

    .step-form {
      padding: 20px 0;
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

    .quick-ranges {
      margin: 20px 0;
    }

    .quick-ranges h4 {
      margin: 0 0 12px 0;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary, rgba(0, 0, 0, 0.87));
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .quick-ranges h4 {
      color: var(--text-primary-dark, rgba(255, 255, 255, 0.87));
    }

    .range-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .settings-section {
      margin-bottom: 24px;
    }

    .settings-section h4 {
      margin: 0 0 12px 0;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary, rgba(0, 0, 0, 0.87));
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .settings-section h4 {
      color: var(--text-primary-dark, rgba(255, 255, 255, 0.87));
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .schedule-options {
      margin-top: 16px;
      padding-left: 32px;
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color, #eee);
      transition: border-color 0.3s ease;
    }

    :host-context(.dark-theme) .step-actions {
      border-top: 1px solid var(--border-color-dark, rgba(255, 255, 255, 0.1));
    }

    .dialog-actions {
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

    :host-context(.dark-theme) ::ng-deep .mat-stepper-horizontal {
      background: transparent;
    }

    :host-context(.dark-theme) ::ng-deep .mat-step-header {
      color: var(--text-color-dark, #ffffff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-step-header .mat-step-icon {
      background-color: rgba(255, 255, 255, 0.1);
      color: var(--text-color-dark, #ffffff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-step-header .mat-step-icon-selected {
      background-color: var(--primary-color-dark, #7c4dff);
      color: #ffffff;
    }

    :host-context(.dark-theme) ::ng-deep .mat-step-header .mat-step-label {
      color: var(--text-color-dark, #ffffff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-step-header .mat-step-label.mat-step-label-selected {
      color: var(--primary-color-dark, #7c4dff);
    }

    :host-context(.dark-theme) ::ng-deep .mat-horizontal-stepper-header::before,
    :host-context(.dark-theme) ::ng-deep .mat-horizontal-stepper-header::after {
      border-top-color: rgba(255, 255, 255, 0.3);
    }

    :host-context(.dark-theme) ::ng-deep .mat-horizontal-content-container {
      background: transparent;
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
      }
      
      .half-width {
        width: 100%;
      }

      .range-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class ReportFormComponent implements OnInit {
  basicInfoForm!: FormGroup;
  dateRangeForm!: FormGroup;
  filtersForm!: FormGroup;
  settingsForm!: FormGroup;
  
  categories: any[] = [];
  loading = false;
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private categoryService: CategoryService,
    private currencyService: CurrencyService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ReportFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Report | null
  ) {
    this.isEdit = !!data;
    this.createForms();
  }

  ngOnInit(): void {
    this.loadCategories();
    if (this.data) {
      this.populateForms(this.data);
    }
  }

  createForms(): void {
    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      type: ['expense_summary', Validators.required],
      chartType: ['bar'],
      description: ['', Validators.maxLength(300)]
    });

    this.dateRangeForm = this.fb.group({
      startDate: [this.getDefaultStartDate(), Validators.required],
      endDate: [new Date(), Validators.required],
      groupBy: ['category']
    });

    this.filtersForm = this.fb.group({
      categories: [[]],
      paymentMethods: [[]],
      minAmount: [null],
      maxAmount: [null]
    });

    this.settingsForm = this.fb.group({
      isPublic: [false],
      isFavorite: [false],
      showPercentages: [true],
      showTrends: [true],
      includeSubcategories: [true],
      isScheduled: [false],
      scheduleFrequency: [''],
      emailRecipients: ['']
    });

    // Add custom validator for date range
    this.dateRangeForm.get('endDate')?.setValidators([
      Validators.required,
      this.dateRangeValidator.bind(this)
    ]);
  }

  dateRangeValidator(control: any) {
    const startDate = this.dateRangeForm?.get('startDate')?.value;
    const endDate = control.value;
    
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      return { dateRange: true };
    }
    return null;
  }

  getDefaultStartDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response: any) => {
        if (response.success && Array.isArray(response.data)) {
          this.categories = response.data;
        } else {
          console.warn('Failed to load categories, using empty array');
          this.categories = [];
        }
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.categories = [];
      }
    });
  }

  populateForms(report: Report): void {
    this.basicInfoForm.patchValue({
      name: report.name,
      type: report.type,
      chartType: report.chartType,
      description: report.description || ''
    });

    this.dateRangeForm.patchValue({
      startDate: new Date(report.dateRange.startDate),
      endDate: new Date(report.dateRange.endDate),
      groupBy: report.groupBy
    });

    this.filtersForm.patchValue({
      categories: report.filters.categories || [],
      paymentMethods: report.filters.paymentMethods || [],
      minAmount: report.filters.amountRange?.min || null,
      maxAmount: report.filters.amountRange?.max || null
    });

    this.settingsForm.patchValue({
      isPublic: report.isPublic,
      isFavorite: report.isFavorite,
      showPercentages: report.settings?.showPercentages ?? true,
      showTrends: report.settings?.showTrends ?? true,
      includeSubcategories: report.settings?.includeSubcategories ?? true,
      isScheduled: report.isScheduled,
      scheduleFrequency: report.scheduleFrequency || '',
      emailRecipients: report.emailRecipients?.join(', ') || ''
    });
  }

  setDateRange(range: string): void {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (range) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last3Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    this.dateRangeForm.patchValue({
      startDate,
      endDate
    });
  }

  onScheduleToggle(event: any): void {
    if (!event.checked) {
      this.settingsForm.patchValue({
        scheduleFrequency: '',
        emailRecipients: ''
      });
    }
  }

  isFormValid(): boolean {
    return this.basicInfoForm.valid && 
           this.dateRangeForm.valid && 
           this.filtersForm.valid && 
           this.settingsForm.valid;
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.loading = true;
    
    const basicInfo = this.basicInfoForm.value;
    const dateRange = this.dateRangeForm.value;
    const filters = this.filtersForm.value;
    const settings = this.settingsForm.value;

    const reportData: Omit<Report, '_id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: basicInfo.name,
      description: basicInfo.description,
      type: basicInfo.type,
      dateRange: {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      },
      filters: {
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        paymentMethods: filters.paymentMethods.length > 0 ? filters.paymentMethods : undefined,
        amountRange: (filters.minAmount || filters.maxAmount) ? {
          min: filters.minAmount || undefined,
          max: filters.maxAmount || undefined
        } : undefined
      },
      chartType: basicInfo.chartType,
      groupBy: dateRange.groupBy,
      isScheduled: settings.isScheduled,
      scheduleFrequency: settings.isScheduled ? settings.scheduleFrequency : undefined,
      emailRecipients: settings.emailRecipients ? 
        settings.emailRecipients.split(',').map((email: string) => email.trim()).filter((email: string) => email) : 
        undefined,
      isPublic: settings.isPublic,
      isFavorite: settings.isFavorite,
      generationCount: 0,
      settings: {
        currency: 'USD',
        dateFormat: 'MM/dd/yyyy',
        includeSubcategories: settings.includeSubcategories,
        showPercentages: settings.showPercentages,
        showTrends: settings.showTrends
      }
    };

    const operation = this.isEdit
      ? this.reportService.updateReport(this.data!._id!, reportData)
      : this.reportService.createReport(reportData);

    operation.subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open(
            `Report ${this.isEdit ? 'updated' : 'created'} successfully`,
            'Close',
            { duration: 3000 }
          );
          this.dialogRef.close(true);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error saving report:', error);
        this.snackBar.open(
          `Failed to ${this.isEdit ? 'update' : 'create'} report`,
          'Close',
          { duration: 3000 }
        );
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getCurrencySymbol(): string {
    return this.currencyService.getCurrencySymbol();
  }
}
