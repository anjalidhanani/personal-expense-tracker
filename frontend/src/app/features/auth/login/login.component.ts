import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Welcome Back</mat-card-title>
          <mat-card-subtitle>Sign in to your expense tracker</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" required>
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" required>
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" 
                    class="full-width login-button" 
                    [disabled]="loginForm.invalid || isLoading">
              <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
              <span *ngIf="!isLoading">Sign In</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="text-center">
            Don't have an account? 
            <a routerLink="/auth/register" class="register-link">Sign up here</a>
          </p>
        </mat-card-actions>

        <mat-card-footer>
          <div class="demo-credentials">
            <h4>Demo Credentials:</h4>
            <p><strong>Admin:</strong> admin&#64;expensetracker.com / admin123</p>
            <p><strong>User:</strong> Create a new account or use admin credentials</p>
          </div>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--login-bg-light, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
      padding: 20px;
      transition: background 0.3s ease;
    }

    /* Dark theme background */
    :host-context(.dark-theme) .login-container {
      background: var(--login-bg-dark, linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%));
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
      background: var(--surface-color, #ffffff);
      color: var(--text-color, #000000);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .login-card {
      background: var(--surface-color-dark, #2d2d2d);
      color: var(--text-color-dark, #ffffff);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .login-button {
      height: 48px;
      margin-top: 16px;
      transition: all 0.3s ease;
    }

    .text-center {
      text-align: center;
      margin: 16px 0;
      color: var(--text-secondary, rgba(0, 0, 0, 0.7));
    }

    :host-context(.dark-theme) .text-center {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    .register-link {
      color: var(--primary-color, #3f51b5);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .register-link {
      color: var(--primary-color-dark, #7c4dff);
    }

    .register-link:hover {
      text-decoration: underline;
      opacity: 0.8;
    }

    .demo-credentials {
      background: var(--demo-bg-light, rgba(0, 0, 0, 0.05));
      border: 1px solid var(--demo-border-light, rgba(0, 0, 0, 0.1));
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .demo-credentials {
      background: var(--demo-bg-dark, rgba(255, 255, 255, 0.05));
      border: 1px solid var(--demo-border-dark, rgba(255, 255, 255, 0.1));
    }

    .demo-credentials h4 {
      margin: 0 0 8px 0;
      color: var(--text-primary, #333);
      font-size: 14px;
      font-weight: 600;
    }

    :host-context(.dark-theme) .demo-credentials h4 {
      color: var(--text-primary-dark, #ffffff);
    }

    .demo-credentials p {
      margin: 4px 0;
      font-size: 13px;
      color: var(--text-secondary, #666);
      line-height: 1.4;
    }

    :host-context(.dark-theme) .demo-credentials p {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.8));
    }

    .demo-credentials strong {
      color: var(--text-primary, #333);
      font-weight: 600;
    }

    :host-context(.dark-theme) .demo-credentials strong {
      color: var(--text-primary-dark, #ffffff);
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 24px;
    }

    mat-card-title {
      color: var(--text-primary, #333);
      font-size: 24px;
      font-weight: 600;
    }

    :host-context(.dark-theme) mat-card-title {
      color: var(--text-primary-dark, #ffffff);
    }

    mat-card-subtitle {
      color: var(--text-secondary, #666);
      margin-top: 8px;
    }

    :host-context(.dark-theme) mat-card-subtitle {
      color: var(--text-secondary-dark, rgba(255, 255, 255, 0.7));
    }

    mat-spinner {
      margin-right: 8px;
    }

    /* Form field styling improvements for dark theme */
    :host-context(.dark-theme) ::ng-deep .mat-mdc-form-field {
      --mdc-outlined-text-field-label-text-color: rgba(255, 255, 255, 0.7);
      --mdc-outlined-text-field-input-text-color: #ffffff;
    }

    /* Enhance card appearance */
    .login-card {
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }

    :host-context(.dark-theme) .login-card {
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Responsive improvements */
    @media (max-width: 480px) {
      .login-container {
        padding: 16px;
      }
      
      .login-card {
        padding: 16px;
        max-width: 100%;
      }
      
      .demo-credentials {
        padding: 12px;
      }
      
      .demo-credentials h4 {
        font-size: 13px;
      }
      
      .demo-credentials p {
        font-size: 12px;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  returnUrl: string = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Get return URL from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    // If user is already authenticated, redirect to dashboard
    if (this.authService.isAuthenticated) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const credentials: LoginRequest = this.loginForm.value;

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.snackBar.open('Login successful!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // Check user role and route accordingly
            if (response.data?.user?.role === 'admin') {
              this.router.navigate(['/admin']);
            } else {
              this.router.navigate([this.returnUrl]);
            }
          }
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage = error.message || 'Login failed';
          
          // Show special styling for deactivated account message
          const isDeactivated = errorMessage.includes('deactivated') || errorMessage.includes('contact support');
          
          this.snackBar.open(errorMessage, 'Close', {
            duration: isDeactivated ? 8000 : 5000,
            panelClass: isDeactivated ? ['error-snackbar', 'deactivated-account'] : ['error-snackbar']
          });
        }
      });
    }
  }
}
