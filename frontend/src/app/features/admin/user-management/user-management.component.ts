import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AdminService, UserFilters } from '../../../core/services/admin.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  template: `
    <div class="user-management-container">
      <div class="user-management-header">
        <div class="header-content">
          <h1>User Management</h1>
          <p>Manage user accounts and permissions</p>
        </div>
        <button mat-icon-button routerLink="/admin">
          <mat-icon>arrow_back</mat-icon>
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <form [formGroup]="filterForm" class="filters-form">
            <mat-form-field appearance="outline">
              <mat-label>Search Users</mat-label>
              <input matInput formControlName="search" placeholder="Search by name or email...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role">
                <mat-option value="">All Roles</mat-option>
                <mat-option value="admin">Admin</mat-option>
                <mat-option value="user">User</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="isActive">
                <mat-option value="">All Status</mat-option>
                <mat-option [value]="true">Active</mat-option>
                <mat-option [value]="false">Inactive</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-stroked-button type="button" (click)="clearFilters()">
              <mat-icon>clear</mat-icon>
              Clear
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Users Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="loading-container" *ngIf="loading">
            <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
            <p>Loading users...</p>
          </div>

          <div class="empty-state" *ngIf="!loading && users.length === 0">
            <mat-icon>people</mat-icon>
            <h3>No users found</h3>
            <p *ngIf="hasActiveFilters()">Try adjusting your filters</p>
            <p *ngIf="!hasActiveFilters()">No users in the system</p>
          </div>

          <div class="table-container" *ngIf="!loading && users.length > 0">
            <table mat-table [dataSource]="users" class="users-table">
              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let user">
                  <div class="user-info">
                    <span class="name">{{ user.name }}</span>
                    <span class="email">{{ user.email }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Role Column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip class="role-chip" [class]="user.role">
                    {{ user.role | titlecase }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip class="status-chip" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Verified Column -->
              <ng-container matColumnDef="verified">
                <th mat-header-cell *matHeaderCellDef>Verified</th>
                <td mat-cell *matCellDef="let user">
                  <mat-icon [style.color]="user.isVerified ? '#4caf50' : '#f44336'">
                    {{ user.isVerified ? 'verified' : 'cancel' }}
                  </mat-icon>
                </td>
              </ng-container>

              <!-- Last Login Column -->
              <ng-container matColumnDef="lastLogin">
                <th mat-header-cell *matHeaderCellDef>Last Login</th>
                <td mat-cell *matCellDef="let user">
                  {{ formatDate(user.lastLogin) || 'Never' }}
                </td>
              </ng-container>

              <!-- Joined Column -->
              <ng-container matColumnDef="joined">
                <th mat-header-cell *matHeaderCellDef>Joined</th>
                <td mat-cell *matCellDef="let user">
                  {{ formatDate(user.createdAt) }}
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let user">
                  <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #actionMenu="matMenu">
                    <button mat-menu-item (click)="toggleUserStatus(user)">
                      <mat-icon>{{ user.isActive ? 'block' : 'check_circle' }}</mat-icon>
                      <span>{{ user.isActive ? 'Deactivate' : 'Activate' }}</span>
                    </button>
                    <button mat-menu-item (click)="changeUserRole(user)" [disabled]="user.role === 'admin'">
                      <mat-icon>admin_panel_settings</mat-icon>
                      <span>{{ user.role === 'admin' ? 'Admin User' : 'Make Admin' }}</span>
                    </button>
                    <button mat-menu-item (click)="viewUserDetails(user)">
                      <mat-icon>visibility</mat-icon>
                      <span>View Details</span>
                    </button>
                    <button mat-menu-item (click)="deleteUser(user)" [disabled]="user.role === 'admin'">
                      <mat-icon color="warn">delete</mat-icon>
                      <span>Delete User</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Pagination -->
            <mat-paginator
              [length]="totalUsers"
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
    .user-management-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .user-management-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-content h1 {
      margin: 0;
      color: #333;
    }

    .header-content p {
      color: #666;
      margin: 8px 0 0 0;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      align-items: end;
    }

    .table-card {
      min-height: 400px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: #666;
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
      margin: 4px 0;
    }

    .table-container {
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
      min-width: 800px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-info .name {
      font-weight: 500;
      color: #333;
    }

    .user-info .email {
      font-size: 14px;
      color: #666;
    }

    .role-chip {
      font-size: 11px;
      min-height: 20px;
      line-height: 20px;
    }

    .role-chip.admin {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .role-chip.user {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .status-chip {
      font-size: 11px;
      min-height: 20px;
      line-height: 20px;
    }

    .status-chip.active {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-chip.inactive {
      background-color: #ffebee;
      color: #c62828;
    }

    @media (max-width: 768px) {
      .user-management-container {
        padding: 16px;
      }

      .user-management-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .filters-form {
        grid-template-columns: 1fr;
      }

      .users-table {
        min-width: 600px;
      }
    }
  `]
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filterForm: FormGroup;
  loading = true;
  totalUsers = 0;
  currentPage = 1;
  pageSize = 25;
  displayedColumns: string[] = ['name', 'role', 'status', 'verified', 'lastLogin', 'joined', 'actions'];
  private destroy$ = new Subject<void>();

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      role: [''],
      isActive: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.setupFilterSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsers(): void {
    this.loading = true;
    const filters = this.buildFilters();
    
    this.adminService.getUsers(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.users = response.data?.users || [];
          this.totalUsers = response.data?.pagination?.totalUsers || 0;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
          this.loading = false;
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
        this.loadUsers();
      });
  }

  private buildFilters(): UserFilters {
    const formValue = this.filterForm.value;
    const filters: UserFilters = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (formValue.search) {
      filters.search = formValue.search;
    }
    if (formValue.role) {
      filters.role = formValue.role;
    }
    if (formValue.isActive !== '') {
      filters.isActive = formValue.isActive;
    }

    return filters;
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  clearFilters(): void {
    this.filterForm.reset();
  }

  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return Object.values(formValue).some(value => value !== null && value !== '');
  }

  toggleUserStatus(user: User): void {
    this.adminService.updateUserStatus(user._id, !user.isActive)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(
            `User ${user.isActive ? 'deactivated' : 'activated'} successfully`,
            'Close',
            { duration: 3000 }
          );
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error updating user status:', error);
          this.snackBar.open('Error updating user status', 'Close', { duration: 3000 });
        }
      });
  }

  changeUserRole(user: User): void {
    if (user.role === 'admin') {
      this.snackBar.open('Cannot modify admin users', 'Close', { duration: 3000 });
      return;
    }

    const newRole = user.role === 'user' ? 'admin' : 'user';
    if (confirm(`Are you sure you want to make ${user.name} an ${newRole}?`)) {
      this.adminService.updateUserRole(user._id, newRole)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open(
              `User role updated to ${newRole} successfully`,
              'Close',
              { duration: 3000 }
            );
            this.loadUsers();
          },
          error: (error) => {
            console.error('Error updating user role:', error);
            this.snackBar.open('Error updating user role', 'Close', { duration: 3000 });
          }
        });
    }
  }

  viewUserDetails(user: User): void {
    this.adminService.getUserDetails(user._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const userDetails = response.data;
          alert(`User Details:\n\nName: ${userDetails?.user.name}\nEmail: ${userDetails?.user.email}\nRole: ${userDetails?.user.role}\nStatus: ${userDetails?.user.isActive ? 'Active' : 'Inactive'}\nVerified: ${userDetails?.user.isVerified ? 'Yes' : 'No'}\nJoined: ${this.formatDate(userDetails?.user.createdAt)}\nLast Login: ${this.formatDate(userDetails?.user.lastLogin) || 'Never'}`);
        },
        error: (error) => {
          console.error('Error loading user details:', error);
          this.snackBar.open('Error loading user details', 'Close', { duration: 3000 });
        }
      });
  }

  deleteUser(user: User): void {
    if (user.role === 'admin') {
      this.snackBar.open('Cannot delete admin users', 'Close', { duration: 3000 });
      return;
    }

    if (confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      this.adminService.deleteUser(user._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
            this.loadUsers();
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.snackBar.open('Error deleting user', 'Close', { duration: 3000 });
          }
        });
    }
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
