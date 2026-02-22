import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { AdminService, AdminStats } from '../../../core/services/admin.service';
import { User } from '../../../core/models/user.model';
import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    RouterModule
  ],
  template: `
    <div class="admin-dashboard-container">
      <div class="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>System overview and management</p>
        <div class="header-actions">
          <button mat-raised-button color="primary" routerLink="/admin/users">
            <mat-icon>people</mat-icon>
            Manage Users
          </button>
        </div>
      </div>

      <div class="loading-container" *ngIf="loading">
        <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
        <p>Loading admin dashboard...</p>
      </div>

      <div class="admin-dashboard-content" *ngIf="!loading">
        <!-- Statistics Cards -->
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon color="primary">people</mat-icon>
                </div>
                <div class="stat-details">
                  <h3>Total Users</h3>
                  <p class="stat-value">{{ stats?.totalUsers || 0 }}</p>
                  <p class="stat-subtitle">Registered accounts</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon color="accent">verified_user</mat-icon>
                </div>
                <div class="stat-details">
                  <h3>Active Users</h3>
                  <p class="stat-value">{{ stats?.activeUsers || 0 }}</p>
                  <p class="stat-subtitle">Currently active</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon color="warn">receipt_long</mat-icon>
                </div>
                <div class="stat-details">
                  <h3>Total Expenses</h3>
                  <p class="stat-value">{{ stats?.totalExpenses || 0 }}</p>
                  <p class="stat-subtitle">System-wide</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-content">
                <div class="stat-icon">
                  <mat-icon style="color: #4caf50">account_balance_wallet</mat-icon>
                </div>
                <div class="stat-details">
                  <h3>Total Amount</h3>
                  <p class="stat-value">{{ formatCurrency(stats?.totalAmount || 0) }}</p>
                  <p class="stat-subtitle">All expenses</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Recent Users -->
        <mat-card class="recent-users-card">
          <mat-card-header>
            <mat-card-title>Recent Users</mat-card-title>
            <mat-card-subtitle>Latest registered accounts</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="empty-state" *ngIf="!stats?.recentUsers || stats?.recentUsers?.length === 0">
              <mat-icon>people</mat-icon>
              <p>No recent users</p>
            </div>
            
            <div class="table-container" *ngIf="hasRecentUsers()">
              <table mat-table [dataSource]="stats?.recentUsers || []" class="users-table">
                <!-- Name Column -->
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let user">{{ user.name }}</td>
                </ng-container>

                <!-- Email Column -->
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>Email</th>
                  <td mat-cell *matCellDef="let user">{{ user.email }}</td>
                </ng-container>

                <!-- Role Column -->
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>Role</th>
                  <td mat-cell *matCellDef="let user">
                    <span class="role-badge" [class]="user.role">{{ user.role | titlecase }}</span>
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let user">
                    <span class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </ng-container>

                <!-- Joined Column -->
                <ng-container matColumnDef="joined">
                  <th mat-header-cell *matHeaderCellDef>Joined</th>
                  <td mat-cell *matCellDef="let user">{{ formatDate(user.createdAt) }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
            
            <div class="view-all-container" *ngIf="hasRecentUsers()">
              <button mat-stroked-button routerLink="/admin/users">View All Users</button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Quick Actions -->
        <mat-card class="quick-actions-card">
          <mat-card-header>
            <mat-card-title>Quick Actions</mat-card-title>
            <mat-card-subtitle>Common administrative tasks</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="actions-grid">
              <button mat-raised-button color="primary" routerLink="/admin/users">
                <mat-icon>people</mat-icon>
                <div class="action-content">
                  <span class="action-title">User Management</span>
                  <span class="action-subtitle">Manage user accounts and permissions</span>
                </div>
              </button>
              
              <button mat-raised-button routerLink="/categories">
                <mat-icon>category</mat-icon>
                <div class="action-content">
                  <span class="action-title">Categories</span>
                  <span class="action-subtitle">Manage expense categories</span>
                </div>
              </button>
              
              <button mat-raised-button routerLink="/expenses">
                <mat-icon>receipt_long</mat-icon>
                <div class="action-content">
                  <span class="action-title">View Expenses</span>
                  <span class="action-subtitle">Browse all system expenses</span>
                </div>
              </button>
              
              <button mat-raised-button routerLink="/dashboard">
                <mat-icon>dashboard</mat-icon>
                <div class="action-content">
                  <span class="action-title">Dashboard</span>
                  <span class="action-subtitle">Return to main dashboard</span>
                </div>
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .admin-dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .admin-dashboard-header div {
      text-align: left;
    }

    .admin-dashboard-header h1 {
      margin: 0;
      color: #333;
    }

    .admin-dashboard-header p {
      color: #666;
      margin: 8px 0 0 0;
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      transition: transform 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .stat-details h3 {
      margin: 0 0 8px 0;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }

    .stat-value {
      margin: 0;
      font-size: 32px;
      font-weight: 600;
      color: #333;
      line-height: 1;
    }

    .stat-subtitle {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: #999;
    }

    .recent-users-card {
      margin-bottom: 32px;
    }

    .table-container {
      overflow-x: auto;
    }

    .users-table {
      width: 100%;
      min-width: 600px;
    }

    .role-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .role-badge.admin {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .role-badge.user {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.active {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-badge.inactive {
      background-color: #ffebee;
      color: #c62828;
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
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .view-all-container {
      display: flex;
      justify-content: center;
      padding-top: 16px;
    }

    .quick-actions-card {
      margin-bottom: 32px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .actions-grid button {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      text-align: left;
      height: auto;
      min-height: 80px;
    }

    .action-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .action-title {
      font-weight: 600;
      font-size: 16px;
    }

    .action-subtitle {
      font-size: 14px;
      opacity: 0.8;
    }

    @media (max-width: 768px) {
      .admin-dashboard-container {
        padding: 16px;
      }

      .admin-dashboard-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .actions-grid {
        grid-template-columns: 1fr;
      }

      .users-table {
        min-width: 500px;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats: AdminStats | null = null;
  loading = true;
  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'joined'];
  private destroy$ = new Subject<void>();

  constructor(
    private adminService: AdminService,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.loadAdminStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAdminStats(): void {
    this.loading = true;
    this.adminService.getAdminStats()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.stats = response.data || null;
        },
        error: (error) => {
          console.error('Error loading admin stats:', error);
        }
      });
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

  hasRecentUsers(): boolean {
    return !!(this.stats?.recentUsers && this.stats.recentUsers.length > 0);
  }
}
