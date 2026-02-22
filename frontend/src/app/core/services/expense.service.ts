import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { 
  Expense, 
  CreateExpenseRequest, 
  UpdateExpenseRequest, 
  ExpenseFilters, 
  ExpenseResponse,
  ExpenseStats,
  ExpenseStatsResponse
} from '../models/expense.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private apiUrl = `${environment.apiUrl}/expenses`;

  constructor(private http: HttpClient) {}

  /**
   * Get all expenses with optional filters
   */
  getExpenses(filters?: ExpenseFilters): Observable<ExpenseResponse> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ExpenseResponse>(this.apiUrl, { params });
  }

  /**
   * Get expense by ID
   */
  getExpenseById(id: string): Observable<ApiResponse<{ expense: Expense }>> {
    return this.http.get<ApiResponse<{ expense: Expense }>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new expense
   */
  createExpense(expenseData: CreateExpenseRequest): Observable<ApiResponse<{ expense: Expense }>> {
    return this.http.post<ApiResponse<{ expense: Expense }>>(this.apiUrl, expenseData);
  }

  /**
   * Update expense
   */
  updateExpense(id: string, expenseData: UpdateExpenseRequest): Observable<ApiResponse<{ expense: Expense }>> {
    return this.http.put<ApiResponse<{ expense: Expense }>>(`${this.apiUrl}/${id}`, expenseData);
  }

  /**
   * Delete expense
   */
  deleteExpense(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get expense statistics
   */
  getExpenseStats(): Observable<ExpenseStatsResponse> {
    return this.http.get<ExpenseStatsResponse>(`${this.apiUrl}/stats`);
  }

  /**
   * Export expenses to CSV
   */
  exportExpenses(filters?: ExpenseFilters): Observable<Blob> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.apiUrl}/export`, { 
      params,
      responseType: 'blob'
    });
  }

  /**
   * Get expenses by date range
   */
  getExpensesByDateRange(startDate: Date, endDate: Date): Observable<ExpenseResponse> {
    const filters: ExpenseFilters = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
    return this.getExpenses(filters);
  }

  /**
   * Get expenses by category
   */
  getExpensesByCategory(categoryId: string): Observable<ExpenseResponse> {
    const filters: ExpenseFilters = { categoryId };
    return this.getExpenses(filters);
  }

  /**
   * Get monthly trend data
   */
  getMonthlyTrend(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/monthly-trend`)
      .pipe(catchError((error) => {
        console.error('Error fetching monthly trend:', error);
        return throwError(() => error);
      }));
  }
}
