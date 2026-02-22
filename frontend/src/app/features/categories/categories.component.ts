import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CategoryService, CreateCategoryRequest, UpdateCategoryRequest } from '../../core/services/category.service';
import { Category } from '../../core/models/expense.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatChipsModule
  ],
  template: `
    <div class="categories-container">
      <div class="categories-header">
        <h1>Categories</h1>
        <p>Manage your expense categories</p>
        <button mat-raised-button color="primary" (click)="openCategoryDialog()" class="btn-with-icon">
          <mat-icon>add</mat-icon>
          Add Category
        </button>
      </div>

      <div class="loading-container" *ngIf="loading">
        <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
        <p>Loading categories...</p>
      </div>

      <div class="categories-grid" *ngIf="!loading">
        <mat-card *ngFor="let category of categories" class="category-card" [class.inactive-category]="!category.isActive" (click)="viewCategoryExpenses(category)">
          <mat-card-header>
            <div mat-card-avatar class="category-avatar" [style.background-color]="category.color" [class.inactive-avatar]="!category.isActive">
              <mat-icon [class.inactive-icon]="!category.isActive">{{ category.icon }}</mat-icon>
            </div>
            <mat-card-title [class.inactive-text]="!category.isActive">
              {{ category.name }}
              <mat-chip *ngIf="!category.isActive" class="inactive-chip">Inactive</mat-chip>
            </mat-card-title>
            <mat-card-subtitle [class.inactive-text]="!category.isActive">{{ category.description || 'No description' }}</mat-card-subtitle>
            <div class="card-actions">
              <button mat-icon-button [matMenuTriggerFor]="categoryMenu" aria-label="Category options" [class.inactive-button]="!category.isActive" (click)="$event.stopPropagation()">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #categoryMenu="matMenu">
                <button mat-menu-item (click)="editCategory(category)" [disabled]="!category.isActive" class="menu-item-with-icon">
                  <mat-icon>edit</mat-icon>
                  <span>Edit</span>
                </button>
                <button mat-menu-item (click)="toggleCategoryStatus(category)" class="menu-item-with-icon">
                  <mat-icon>{{ category.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
                  <span>{{ category.isActive ? 'Deactivate' : 'Activate' }}</span>
                </button>
                <button mat-menu-item (click)="deleteCategory(category)" class="menu-item-with-icon">
                  <mat-icon color="warn">delete</mat-icon>
                  <span>Delete</span>
                </button>
              </mat-menu>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="category-info">
              <div class="info-item">
                <span class="label">Status:</span>
                <span class="value" [class.active]="category.isActive" [class.inactive]="!category.isActive">
                  {{ category.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="info-item" *ngIf="category.isDefault">
                <span class="label">Type:</span>
                <span class="value default">Default Category</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="categories.length === 0">
          <mat-icon>category</mat-icon>
          <h3>No categories found</h3>
          <p>Start by creating your first custom category</p>
          <button mat-raised-button color="primary" (click)="openCategoryDialog()" class="btn-with-icon">
            <mat-icon>add</mat-icon>
            Add Category
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .categories-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      background: var(--background-color, #fafafa);
      min-height: 100vh;
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .categories-container {
      background: var(--background-color-dark, #121212);
    }

    .categories-header {
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

    :host-context(.dark-theme) .categories-header {
      background: var(--surface-color-dark, #1e1e1e);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .categories-header div {
      text-align: left;
    }

    .categories-header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
      color: #667eea;
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .categories-header h1 {
      color: #bb86fc;
    }

    .categories-header p {
      color: var(--text-secondary, #666);
      margin: 8px 0 0 0;
      font-size: 1.1rem;
      font-weight: 400;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .categories-header p {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
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

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 28px;
    }

    .category-card {
      transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
      cursor: pointer;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      background: var(--surface-color, #ffffff);
      border: 2px solid transparent;
      overflow: hidden;
      position: relative;
    }

    .category-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      transition: height 0.3s ease;
    }

    .category-card:hover::before {
      height: 8px;
    }

    :host-context(.dark-theme) .category-card {
      background: var(--surface-color-dark, #1e1e1e);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    :host-context(.dark-theme) .category-card::before {
      background: linear-gradient(135deg, #bb86fc 0%, #03dac6 100%);
    }

    .category-card.inactive-category {
      opacity: 0.7;
      background: var(--surface-disabled, #f8f8f8);
      border: 2px dashed var(--border-color, #ddd);
    }

    .category-card.inactive-category::before {
      background: linear-gradient(135deg, #bbb 0%, #999 100%);
    }

    :host-context(.dark-theme) .category-card.inactive-category {
      background: var(--surface-disabled-dark, #2a2a2a);
      border: 2px dashed var(--border-color-dark, #555);
    }

    .inactive-avatar {
      opacity: 0.5;
      filter: grayscale(50%);
    }

    .inactive-icon {
      opacity: 0.7;
    }

    .inactive-text {
      color: var(--text-secondary) !important;
      opacity: 0.8;
    }

    .inactive-button {
      opacity: 0.6;
    }

    .inactive-chip {
      background-color: var(--warn-color);
      color: white;
      font-size: 10px;
      height: 18px;
      margin-left: 8px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .category-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 12px 40px rgba(0,0,0,0.15);
    }

    :host-context(.dark-theme) .category-card:hover {
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
    }

    .category-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    }

    .category-card:hover .category-avatar {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }

    .category-avatar mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .card-actions {
      margin-left: auto;
    }

    .category-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-item .label {
      font-weight: 500;
      color: #666;
    }

    .info-item .value {
      font-weight: 600;
    }

    .info-item .value.active {
      color: #4caf50;
    }

    .info-item .value.inactive {
      color: #f44336;
    }

    .info-item .value.default {
      color: #2196f3;
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: #666;
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
      color: #333;
    }

    .empty-state p {
      margin: 4px 0 16px 0;
    }

    @media (max-width: 768px) {
      .categories-container {
        padding: 16px;
      }

      .categories-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .categories-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  `]
})
export class CategoriesComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  loading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.categories = response.data?.categories || [];
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.snackBar.open('Error loading categories', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  openCategoryDialog(category?: Category): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      data: { category }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  editCategory(category: Category): void {
    this.openCategoryDialog(category);
  }

  toggleCategoryStatus(category: Category): void {
    this.categoryService.toggleCategoryStatus(category._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(
            `Category ${category.isActive ? 'deactivated' : 'activated'} successfully`,
            'Close',
            { duration: 3000 }
          );
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error updating category status:', error);
          this.snackBar.open('Error updating category status', 'Close', { duration: 3000 });
        }
      });
  }

  deleteCategory(category: Category): void {
    // Special warning for Others category
    if (category.name === 'Others' || category.name === 'Other') {
      this.snackBar.open('Cannot delete the "Others" category as it serves as the default fallback category.', 'Close', { duration: 5000 });
      return;
    }

    const confirmMessage = `Are you sure you want to delete "${category.name}"?\n\nNote: If this category has expenses, they will be automatically moved to the "Others" category.`;
    
    if (confirm(confirmMessage)) {
      this.categoryService.deleteCategory(category._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.data?.reassignedExpenses) {
              this.snackBar.open(
                `Category deleted successfully. ${response.data.reassignedExpenses} expense(s) moved to "${response.data.newCategoryName}".`,
                'Close',
                { duration: 5000 }
              );
            } else {
              this.snackBar.open('Category deleted successfully', 'Close', { duration: 3000 });
            }
            this.loadCategories();
          },
          error: (error) => {
            console.error('Error deleting category:', error);
            const errorMessage = error.error?.message || 'Error deleting category';
            this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
          }
        });
    }
  }

  viewCategoryExpenses(category: Category): void {
    // Navigate to expenses page with category filter
    this.router.navigate(['/expenses'], {
      queryParams: { category: category._id }
    });
  }
}

// Category Dialog Component
@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.category ? 'Edit Category' : 'Add Category' }}</h2>
    <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-fields">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Category Name *</mat-label>
            <input matInput formControlName="name" placeholder="Enter category name">
            <mat-error *ngIf="categoryForm.get('name')?.hasError('required')">
              Category name is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Enter description..."></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Icon *</mat-label>
            <mat-select formControlName="icon">
                <mat-option *ngFor="let icon of availableIcons" [value]="icon.value" class="select-option-with-icon">
                  <mat-icon class="option-icon">{{ icon.value }}</mat-icon>
                  {{ icon.label }}
                </mat-option>
            </mat-select>
            <mat-error *ngIf="categoryForm.get('icon')?.hasError('required')">
              Icon is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Color *</mat-label>
            <mat-select formControlName="color">
                <mat-option *ngFor="let color of availableColors" [value]="color.value">
                  <div class="color-option category-option-with-icon">
                    <div class="color-preview category-color-indicator" [style.background-color]="color.value"></div>
                    <span>{{ color.label }}</span>
                  </div>
                </mat-option>
            </mat-select>
            <mat-error *ngIf="categoryForm.get('color')?.hasError('required')">
              Color is required
            </mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="categoryForm.invalid || submitting">
          {{ submitting ? 'Saving...' : (data.category ? 'Update' : 'Create') }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      min-width: 400px;
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

    .color-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .color-preview {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #ddd;
    }

    @media (max-width: 768px) {
      .form-fields {
        grid-template-columns: 1fr;
      }

      .full-width {
        grid-column: span 1;
      }
    }
  `]
})
export class CategoryDialogComponent implements OnInit {
  categoryForm: FormGroup;
  submitting = false;

  availableIcons = [
    { value: 'restaurant', label: 'Food & Dining' },
    { value: 'directions_car', label: 'Transportation' },
    { value: 'shopping_cart', label: 'Shopping' },
    { value: 'home', label: 'Home & Utilities' },
    { value: 'local_hospital', label: 'Healthcare' },
    { value: 'school', label: 'Education' },
    { value: 'movie', label: 'Entertainment' },
    { value: 'flight', label: 'Travel' },
    { value: 'fitness_center', label: 'Fitness' },
    { value: 'pets', label: 'Pets' },
    { value: 'work', label: 'Work' },
    { value: 'savings', label: 'Savings' },
    { value: 'receipt', label: 'Bills' },
    { value: 'category', label: 'Other' }
  ];

  availableColors = [
    { value: '#f44336', label: 'Red' },
    { value: '#e91e63', label: 'Pink' },
    { value: '#9c27b0', label: 'Purple' },
    { value: '#673ab7', label: 'Deep Purple' },
    { value: '#3f51b5', label: 'Indigo' },
    { value: '#2196f3', label: 'Blue' },
    { value: '#03a9f4', label: 'Light Blue' },
    { value: '#00bcd4', label: 'Cyan' },
    { value: '#009688', label: 'Teal' },
    { value: '#4caf50', label: 'Green' },
    { value: '#8bc34a', label: 'Light Green' },
    { value: '#cddc39', label: 'Lime' },
    { value: '#ffeb3b', label: 'Yellow' },
    { value: '#ffc107', label: 'Amber' },
    { value: '#ff9800', label: 'Orange' },
    { value: '#ff5722', label: 'Deep Orange' }
  ];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private dialogRef: MatDialogRef<CategoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { category?: Category },
    private snackBar: MatSnackBar
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      icon: ['category', Validators.required],
      color: ['#2196f3', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data.category) {
      this.categoryForm.patchValue({
        name: this.data.category.name,
        description: this.data.category.description || '',
        icon: this.data.category.icon,
        color: this.data.category.color
      });
    }
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.categoryForm.value;
    const categoryData = {
      name: formValue.name,
      description: formValue.description,
      icon: formValue.icon,
      color: formValue.color
    };

    const request = this.data.category
      ? this.categoryService.updateCategory(this.data.category._id, categoryData as UpdateCategoryRequest)
      : this.categoryService.createCategory(categoryData as CreateCategoryRequest);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          `Category ${this.data.category ? 'updated' : 'created'} successfully`,
          'Close',
          { duration: 3000 }
        );
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error saving category:', error);
        this.snackBar.open(
          `Error ${this.data.category ? 'updating' : 'creating'} category`,
          'Close',
          { duration: 3000 }
        );
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach(key => {
      this.categoryForm.get(key)?.markAsTouched();
    });
  }
}
