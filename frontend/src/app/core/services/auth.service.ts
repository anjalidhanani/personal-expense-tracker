import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { User, LoginRequest, RegisterRequest, AuthResponse, ChangePasswordRequest } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private readonly TOKEN_KEY = 'expense_tracker_token';
  private readonly USER_KEY = 'expense_tracker_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Initialize authentication state from localStorage
   */
  initializeAuthState(): void {
    const token = this.getToken();
    const userData = localStorage.getItem(this.USER_KEY);
    
    if (token && userData) {
      try {
        const user: User = JSON.parse(userData);
        this.currentUserSubject.next(user);
        
        // Verify token is still valid by making a request to /auth/me
        this.getCurrentUser().subscribe({
          next: (response) => {
            // Token is valid, user data updated
          },
          error: (error) => {
            // Token is invalid, clear auth data
            console.warn('Token validation failed during initialization:', error);
            this.logout();
          }
        });
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        this.logout();
      }
    }
  }

  /**
   * Get current user value
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUserValue;
  }

  /**
   * Check if current user is admin
   */
  get isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.user);
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, userData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.setAuthData(response.data.token, response.data.user);
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Logout user
   */
  logout(): void {
    // Clear local storage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Clear current user
    this.currentUserSubject.next(null);
    
    // Navigate to login
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): Observable<ApiResponse<{ user: User }>> {
    return this.http.get<ApiResponse<{ user: User }>>(`${environment.apiUrl}/auth/me`)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data.user);
            localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update user profile
   */
  updateProfile(profileData: Partial<User>): Observable<ApiResponse<{ user: User }>> {
    return this.http.put<ApiResponse<{ user: User }>>(`${environment.apiUrl}/auth/profile`, profileData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data.user);
            localStorage.setItem(this.USER_KEY, JSON.stringify(response.data.user));
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Change user password
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${environment.apiUrl}/auth/change-password`, passwordData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get current user synchronously from BehaviorSubject
   */
  getCurrentUserSync(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Set authentication data in localStorage and update current user
   */
  private setAuthData(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Handle 401 Unauthorized errors
    if (error.status === 401) {
      // Token might be expired, clear auth data without navigation
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      this.currentUserSubject.next(null);
      // Navigate to login after a short delay to avoid circular dependencies
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 0);
    }

    return throwError(() => new Error(errorMessage));
  }
}
