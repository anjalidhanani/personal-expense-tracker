import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/user.model';

@Component({
  selector: 'app-register',
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
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
          <mat-card-subtitle>Join the expense tracker</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="name" required>
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="registerForm.get('name')?.hasError('required')">
                Name is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('name')?.hasError('minlength')">
                Name must be at least 2 characters
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" required>
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" required>
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                Password must be at least 6 characters
              </mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" 
                    class="full-width register-button" 
                    [disabled]="registerForm.invalid || isLoading">
              <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
              <span *ngIf="!isLoading">Create Account</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="text-center">
            Already have an account? 
            <a routerLink="/auth/login" class="login-link">Sign in here</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--login-bg-light, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
      padding: 20px;
      transition: background 0.3s ease;
    }

    /* Dark theme background */
    :host-context(.dark-theme) .register-container {
      background: var(--login-bg-dark, linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%));
    }

    .register-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
      background: var(--surface-color, #ffffff);
      color: var(--text-color, #000000);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    :host-context(.dark-theme) .register-card {
      background: var(--surface-color-dark, #2d2d2d);
      color: var(--text-color-dark, #ffffff);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .register-button {
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

    .login-link {
      color: var(--primary-color, #3f51b5);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease;
    }

    :host-context(.dark-theme) .login-link {
      color: var(--primary-color-dark, #7c4dff);
    }

    .login-link:hover {
      text-decoration: underline;
      opacity: 0.8;
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

    /* Responsive improvements */
    @media (max-width: 480px) {
      .register-container {
        padding: 16px;
      }
      
      .register-card {
        padding: 16px;
        max-width: 100%;
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const userData: RegisterRequest = this.registerForm.value;

      this.authService.register(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.snackBar.open('Registration successful!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(error.message || 'Registration failed', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}
