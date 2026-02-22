import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrencyService } from './currency.service';

export interface Budget {
  _id?: string;
  userId?: string;
  categoryId: string;
  name: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  alertThreshold: number;
  isActive: boolean;
  description?: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
  spentAmount?: number;
  remainingAmount?: number;
  percentageUsed?: number;
  status?: 'on_track' | 'warning' | 'exceeded';
  daysRemaining?: number;
  categoryId_populated?: {
    _id: string;
    name: string;
    color: string;
    icon: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BudgetCreateRequest {
  name: string;
  categoryId: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  alertThreshold: number;
  isActive: boolean;
  description?: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
}

export interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  category: string;
  percentageUsed: number;
  status: string;
  remainingAmount: number;
}

export interface BudgetResponse {
  success: boolean;
  data: Budget | Budget[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BudgetAlertsResponse {
  success: boolean;
  data: BudgetAlert[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = `${environment.apiUrl}/budgets`;

  constructor(
    private http: HttpClient,
    private currencyService: CurrencyService
  ) {}

  // Get all budgets with optional filters
  getBudgets(params?: {
    period?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }): Observable<BudgetResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.period) httpParams = httpParams.set('period', params.period);
      if (params.active !== undefined) httpParams = httpParams.set('active', params.active.toString());
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<BudgetResponse>(this.apiUrl, { params: httpParams });
  }

  // Get active budgets
  getActiveBudgets(): Observable<BudgetResponse> {
    return this.http.get<BudgetResponse>(`${this.apiUrl}/active`);
  }

  // Get budget alerts
  getBudgetAlerts(): Observable<BudgetAlertsResponse> {
    return this.http.get<BudgetAlertsResponse>(`${this.apiUrl}/alerts`);
  }

  // Get budgets by period
  getBudgetsByPeriod(period: string): Observable<BudgetResponse> {
    return this.http.get<BudgetResponse>(`${this.apiUrl}/period/${period}`);
  }

  // Get specific budget
  getBudget(id: string): Observable<BudgetResponse> {
    return this.http.get<BudgetResponse>(`${this.apiUrl}/${id}`);
  }

  // Create new budget
  createBudget(budget: BudgetCreateRequest): Observable<BudgetResponse> {
    return this.http.post<BudgetResponse>(this.apiUrl, budget);
  }

  // Update budget
  updateBudget(id: string, budget: Partial<BudgetCreateRequest>): Observable<BudgetResponse> {
    return this.http.put<BudgetResponse>(`${this.apiUrl}/${id}`, budget);
  }

  // Delete budget
  deleteBudget(id: string): Observable<BudgetResponse> {
    return this.http.delete<BudgetResponse>(`${this.apiUrl}/${id}`);
  }

  // Toggle budget active status
  toggleBudgetStatus(id: string): Observable<BudgetResponse> {
    return this.http.patch<BudgetResponse>(`${this.apiUrl}/${id}/toggle`, {});
  }

  // Helper methods for budget calculations
  calculateBudgetStatus(budget: Budget): 'on_track' | 'warning' | 'exceeded' {
    const percentage = budget.percentageUsed || 0;
    if (percentage >= 100) return 'exceeded';
    if (percentage >= budget.alertThreshold) return 'warning';
    return 'on_track';
  }

  getBudgetStatusColor(status: string): string {
    switch (status) {
      case 'on_track': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'exceeded': return '#F44336';
      default: return '#9E9E9E';
    }
  }

  getBudgetStatusIcon(status: string): string {
    switch (status) {
      case 'on_track': return 'check_circle';
      case 'warning': return 'warning';
      case 'exceeded': return 'error';
      default: return 'help';
    }
  }

  formatCurrency(amount: number): string {
    return this.currencyService.formatCurrency(amount);
  }

  getDaysRemainingText(days: number): string {
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  }

  getPeriodDisplayName(period: string): string {
    switch (period) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return period;
    }
  }

  // Validation helpers
  validateBudgetData(budget: Partial<Budget>): string[] {
    const errors: string[] = [];

    if (!budget.name || budget.name.trim().length < 3) {
      errors.push('Budget name must be at least 3 characters long');
    }

    if (!budget.categoryId) {
      errors.push('Category is required');
    }

    if (!budget.amount || budget.amount <= 0) {
      errors.push('Budget amount must be greater than 0');
    }

    if (budget.amount && budget.amount > 10000000) {
      errors.push('Budget amount cannot exceed 10,000,000');
    }

    if (!budget.period) {
      errors.push('Budget period is required');
    }

    if (budget.alertThreshold !== undefined && (budget.alertThreshold < 0 || budget.alertThreshold > 100)) {
      errors.push('Alert threshold must be between 0 and 100');
    }

    return errors;
  }
}
