import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { filter } from 'rxjs/operators';

import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';
import { User } from './core/models/user.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatCardModule,
    MatRippleModule,
    MatDividerModule,
    ThemeToggleComponent
  ],
  template: `
    <div class="modern-app-container" *ngIf="!isAuthPage">
      <!-- Modern Top Navigation -->
      <header class="top-nav">
        <div class="nav-content">
          <div class="nav-brand">
            <div class="brand-icon">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <span class="brand-text">ExpenseFlow</span>
          </div>
          
          <!-- Desktop Navigation -->
          <nav class="desktop-nav" *ngIf="!isMobile">
            <a routerLink="/dashboard" routerLinkActive="nav-active" class="nav-link" matTooltip="Dashboard">
              <mat-icon>dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            <a routerLink="/expenses" routerLinkActive="nav-active" class="nav-link" matTooltip="Expenses">
              <mat-icon>receipt_long</mat-icon>
              <span>Expenses</span>
            </a>
            <a routerLink="/categories" routerLinkActive="nav-active" class="nav-link" matTooltip="Categories">
              <mat-icon>category</mat-icon>
              <span>Categories</span>
            </a>
            <a routerLink="/budgets" routerLinkActive="nav-active" class="nav-link" matTooltip="Budgets">
              <mat-icon>savings</mat-icon>
              <span>Budgets</span>
            </a>
            <a routerLink="/reports" routerLinkActive="nav-active" class="nav-link" matTooltip="Reports">
              <mat-icon>analytics</mat-icon>
              <span>Reports</span>
            </a>
          </nav>
          
          <!-- Mobile Navigation Button -->
          <button mat-icon-button *ngIf="isMobile" (click)="toggleMobileMenu()" class="mobile-menu-btn">
            <mat-icon>{{ mobileMenuOpen ? 'close' : 'menu' }}</mat-icon>
          </button>
          
          <!-- User Menu -->
          <div class="user-section">
            <app-theme-toggle></app-theme-toggle>
            <button mat-icon-button [matMenuTriggerFor]="userMenu" *ngIf="currentUser" class="user-avatar" matTooltip="User Menu">
              <mat-icon>account_circle</mat-icon>
            </button>
            
            <mat-menu #userMenu="matMenu" class="user-dropdown">
              <div class="user-info">
                <mat-icon>person</mat-icon>
                <div class="user-details">
                  <span class="user-name">{{ currentUser?.name }}</span>
                  <span class="user-email">{{ currentUser?.email }}</span>
                </div>
              </div>
              <mat-divider></mat-divider>
              <button mat-menu-item routerLink="/profile">
                <mat-icon>settings</mat-icon>
                <span>Settings</span>
              </button>
              <button mat-menu-item routerLink="/admin" *ngIf="currentUser?.role === 'admin'">
                <mat-icon>admin_panel_settings</mat-icon>
                <span>Admin Panel</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()" class="logout-btn">
                <mat-icon>logout</mat-icon>
                <span>Sign Out</span>
              </button>
            </mat-menu>
          </div>
        </div>
      </header>
      
      <!-- Mobile Navigation Overlay -->
      <div class="mobile-nav-overlay" *ngIf="isMobile && mobileMenuOpen" (click)="toggleMobileMenu()">
        <nav class="mobile-nav" (click)="$event.stopPropagation()">
          <a routerLink="/dashboard" routerLinkActive="nav-active" class="mobile-nav-link" (click)="toggleMobileMenu()">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          <a routerLink="/expenses" routerLinkActive="nav-active" class="mobile-nav-link" (click)="toggleMobileMenu()">
            <mat-icon>receipt_long</mat-icon>
            <span>Expenses</span>
          </a>
          <a routerLink="/categories" routerLinkActive="nav-active" class="mobile-nav-link" (click)="toggleMobileMenu()">
            <mat-icon>category</mat-icon>
            <span>Categories</span>
          </a>
          <a routerLink="/budgets" routerLinkActive="nav-active" class="mobile-nav-link" (click)="toggleMobileMenu()">
            <mat-icon>savings</mat-icon>
            <span>Budgets</span>
          </a>
          <a routerLink="/reports" routerLinkActive="nav-active" class="mobile-nav-link" (click)="toggleMobileMenu()">
            <mat-icon>analytics</mat-icon>
            <span>Reports</span>
          </a>
        </nav>
      </div>

      <!-- Main Content -->
      <main class="modern-main-content">
        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
      
      <!-- Floating Action Button -->
      <button mat-fab class="floating-action-btn" routerLink="/expenses/add" matTooltip="Add Expense" [matTooltipPosition]="'left'">
        <mat-icon>add</mat-icon>
      </button>
    </div>

    <div class="auth-container" *ngIf="isAuthPage">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .modern-app-container {
      min-height: 100vh;
      background: var(--background-color);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Clean Minimal Navigation */
    .top-nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: var(--surface-color);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      transition: all 0.2s ease;
    }

    .nav-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 64px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 20px;
    }

    .brand-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: var(--primary-color);
      border-radius: 8px;
      color: white;
      transition: all 0.2s ease;
    }

    .brand-icon:hover {
      transform: scale(1.05);
    }

    .brand-text {
      color: var(--text-primary);
    }

    /* Desktop Navigation */
    .desktop-nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--text-secondary);
      font-weight: 500;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-link:hover {
      color: var(--text-primary);
      background: var(--hover-color);
    }

    .nav-link.nav-active {
      background: var(--primary-color);
      color: white;
    }

    .nav-link mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* User Section */
    .user-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--hover-color);
      transition: all 0.2s ease;
    }

    .user-avatar:hover {
      background: var(--primary-color);
      color: white;
      transform: scale(1.05);
    }

    /* Mobile Navigation */
    .mobile-menu-btn {
      width: 40px;
      height: 40px;
      border-radius: 8px;
    }

    .mobile-nav-overlay {
      position: fixed;
      top: 64px;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }

    .mobile-nav {
      position: absolute;
      top: 0;
      right: 0;
      width: 280px;
      height: 100%;
      background: var(--surface-color);
      padding: 24px;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
      animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mobile-nav-link {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      margin-bottom: 8px;
      border-radius: 12px;
      text-decoration: none;
      color: var(--text-primary);
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .mobile-nav-link:hover,
    .mobile-nav-link.nav-active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    /* Main Content */
    .modern-main-content {
      margin-top: 64px;
      min-height: calc(100vh - 64px);
      background: var(--background-color);
    }

    .content-wrapper {
      max-width: 1400px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    /* Floating Action Button */
    .floating-action-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 100;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .floating-action-btn:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
    }

    /* User Menu Dropdown */
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 600;
      font-size: 14px;
    }

    .user-email {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .logout-btn {
      color: var(--warn-color) !important;
    }

    /* Auth Container */
    .auth-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .nav-content {
        padding: 0 16px;
      }

      .content-wrapper {
        padding: 24px 16px;
      }

      .floating-action-btn {
        bottom: 16px;
        right: 16px;
      }

      .brand-text {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .mobile-nav {
        width: 100%;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'ExpenseFlow';
  currentUser: User | null = null;
  isAuthPage = false;
  isMobile = false;
  mobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit() {
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Check if current route is auth page
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isAuthPage = event.url.startsWith('/auth');
    });

    // Initialize auth state
    this.authService.initializeAuthState();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.mobileMenuOpen = false;
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  logout() {
    if (this.authService) {
      this.authService.logout();
    } else {
      // Fallback if authService is undefined
      localStorage.removeItem('expense_tracker_token');
      localStorage.removeItem('expense_tracker_user');
      this.router.navigate(['/auth/login']);
    }
  }
}
