import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../core/services/auth.service';
import { CurrencyService } from '../../core/services/currency.service';
import { User, ChangePasswordRequest } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <div class="loading-container" *ngIf="loading">
        <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
        <p>Loading profile...</p>
      </div>

      <mat-tab-group *ngIf="!loading" class="profile-tabs">
        <!-- Profile Information Tab -->
        <mat-tab label="Profile Information">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Personal Information</mat-card-title>
                <mat-card-subtitle>Update your basic profile details</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Full Name *</mat-label>
                      <input matInput formControlName="name" placeholder="Enter your full name">
                      <mat-error *ngIf="profileForm.get('name')?.hasError('required')">
                        Name is required
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Email Address</mat-label>
                      <input matInput formControlName="email" readonly>
                      <mat-hint>Email cannot be changed</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Role</mat-label>
                      <input matInput [value]="currentUser?.role | titlecase" readonly>
                      <mat-hint>Role is managed by administrators</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Member Since</mat-label>
                      <input matInput [value]="formatDate(currentUser?.createdAt)" readonly>
                    </mat-form-field>
                  </div>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" [disabled]="profileForm.invalid || submittingProfile">
                      <mat-icon *ngIf="submittingProfile">hourglass_empty</mat-icon>
                      <mat-icon *ngIf="!submittingProfile">save</mat-icon>
                      {{ submittingProfile ? 'Updating...' : 'Update Profile' }}
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Preferences Tab -->
        <mat-tab label="Preferences">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Application Preferences</mat-card-title>
                <mat-card-subtitle>Customize your app experience</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="preferencesForm" (ngSubmit)="updatePreferences()">
                  <div class="form-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Default Currency</mat-label>
                      <mat-select formControlName="currency">
                        <mat-option *ngFor="let currency of availableCurrencies" [value]="currency.code">
                          {{ currency.code }} - {{ currency.name }}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Date Format</mat-label>
                      <mat-select formControlName="dateFormat">
                        <mat-option value="MM/DD/YYYY">MM/DD/YYYY (US)</mat-option>
                        <mat-option value="DD/MM/YYYY">DD/MM/YYYY (UK)</mat-option>
                        <mat-option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</mat-option>
                      </mat-select>
                    </mat-form-field>

                  </div>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" [disabled]="preferencesForm.invalid || submittingPreferences">
                      <mat-icon *ngIf="submittingPreferences">hourglass_empty</mat-icon>
                      <mat-icon *ngIf="!submittingPreferences">save</mat-icon>
                      {{ submittingPreferences ? 'Saving...' : 'Save Preferences' }}
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Security Tab -->
        <mat-tab label="Security">
          <div class="tab-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>Change Password</mat-card-title>
                <mat-card-subtitle>Update your account password</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                  <div class="form-grid">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Current Password *</mat-label>
                      <input matInput type="password" formControlName="currentPassword" placeholder="Enter current password">
                      <mat-error *ngIf="passwordForm.get('currentPassword')?.hasError('required')">
                        Current password is required
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>New Password *</mat-label>
                      <input matInput type="password" formControlName="newPassword" placeholder="Enter new password">
                      <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('required')">
                        New password is required
                      </mat-error>
                      <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('minlength')">
                        Password must be at least 6 characters
                      </mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Confirm New Password *</mat-label>
                      <input matInput type="password" formControlName="confirmPassword" placeholder="Confirm new password">
                      <mat-error *ngIf="passwordForm.get('confirmPassword')?.hasError('required')">
                        Please confirm your password
                      </mat-error>
                      <mat-error *ngIf="passwordForm.hasError('passwordMismatch')">
                        Passwords do not match
                      </mat-error>
                    </mat-form-field>
                  </div>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit" [disabled]="passwordForm.invalid || submittingPassword">
                      <mat-icon *ngIf="submittingPassword">hourglass_empty</mat-icon>
                      <mat-icon *ngIf="!submittingPassword">lock</mat-icon>
                      {{ submittingPassword ? 'Changing...' : 'Change Password' }}
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>

            <!-- Account Information -->
            <mat-card class="account-info-card">
              <mat-card-header>
                <mat-card-title>Account Information</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Account Status:</span>
                    <span class="value" [class.active]="currentUser?.isActive">
                      {{ currentUser?.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="label">Email Verified:</span>
                    <span class="value" [class.verified]="currentUser?.isVerified">
                      {{ currentUser?.isVerified ? 'Verified' : 'Not Verified' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="label">Last Login:</span>
                    <span class="value">{{ formatDate(currentUser?.lastLogin) || 'Never' }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .profile-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .profile-header h1 {
      margin: 0;
      color: var(--text-primary);
    }

    .profile-header p {
      color: var(--text-secondary);
      margin: 8px 0 0 0;
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

    .profile-tabs {
      margin-top: 24px;
    }

    .tab-content {
      padding: 24px 0;
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

    .form-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 16px;
    }

    .account-info-card {
      margin-top: 24px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item .label {
      font-weight: 500;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .info-item .value {
      font-weight: 600;
      color: var(--text-primary);
    }

    .info-item .value.active {
      color: var(--success-color);
    }

    .info-item .value.verified {
      color: var(--primary-color);
    }

    @media (max-width: 768px) {
      .profile-container {
        padding: 16px;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .full-width {
        grid-column: span 1;
      }

      .info-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  profileForm: FormGroup;
  preferencesForm: FormGroup;
  passwordForm: FormGroup;
  availableCurrencies: any[] = [];
  loading = true;
  submittingProfile = false;
  submittingPreferences = false;
  submittingPassword = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private currencyService: CurrencyService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: [{ value: '', disabled: true }]
    });

    this.preferencesForm = this.fb.group({
      currency: ['USD'],
      dateFormat: ['MM/DD/YYYY']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Load available currencies
    this.availableCurrencies = this.currencyService.getAllCurrencies();
    
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.populateForms(user);
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private populateForms(user: User): void {
    this.profileForm.patchValue({
      name: user.name,
      email: user.email
    });

    if (user.preferences) {
      this.preferencesForm.patchValue({
        currency: user.preferences.currency || 'USD',
        dateFormat: user.preferences.dateFormat || 'MM/DD/YYYY'
      });
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.submittingProfile = true;
    const profileData = {
      name: this.profileForm.get('name')?.value
    };

    this.authService.updateProfile(profileData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
          this.submittingProfile = false;
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.snackBar.open('Error updating profile', 'Close', { duration: 3000 });
          this.submittingProfile = false;
        }
      });
  }

  updatePreferences(): void {
    if (this.preferencesForm.invalid) {
      this.markFormGroupTouched(this.preferencesForm);
      return;
    }

    this.submittingPreferences = true;
    const preferencesData = {
      preferences: this.preferencesForm.value
    };

    this.authService.updateProfile(preferencesData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Preferences saved successfully', 'Close', { duration: 3000 });
          this.submittingPreferences = false;
        },
        error: (error) => {
          console.error('Error updating preferences:', error);
          this.snackBar.open('Error saving preferences', 'Close', { duration: 3000 });
          this.submittingPreferences = false;
        }
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.submittingPassword = true;
    const passwordData: ChangePasswordRequest = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value
    };

    this.authService.changePassword(passwordData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
          this.passwordForm.reset();
          this.submittingPassword = false;
        },
        error: (error) => {
          console.error('Error changing password:', error);
          this.snackBar.open('Error changing password', 'Close', { duration: 3000 });
          this.submittingPassword = false;
        }
      });
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }
}
