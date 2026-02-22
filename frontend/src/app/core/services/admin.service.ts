import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalExpenses: number;
  totalAmount: number;
  recentUsers: User[];
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  /**
   * Get admin dashboard statistics
   */
  getAdminStats(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.apiUrl}/stats`);
  }

  /**
   * Get all users with filters
   */
  getUsers(filters?: UserFilters): Observable<ApiResponse<{ users: User[], pagination: any }>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<{ users: User[], pagination: any }>>(`${this.apiUrl}/users`, { params });
  }

  /**
   * Update user status (activate/deactivate)
   */
  updateUserStatus(userId: string, isActive: boolean): Observable<ApiResponse<{ user: User }>> {
    return this.http.patch<ApiResponse<{ user: User }>>(`${this.apiUrl}/users/${userId}/status`, { isActive });
  }

  /**
   * Update user role
   */
  updateUserRole(userId: string, role: string): Observable<ApiResponse<{ user: User }>> {
    return this.http.patch<ApiResponse<{ user: User }>>(`${this.apiUrl}/users/${userId}/role`, { role });
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * Get user details with expenses
   */
  getUserDetails(userId: string): Observable<ApiResponse<{ user: User, expenseStats: any }>> {
    return this.http.get<ApiResponse<{ user: User, expenseStats: any }>>(`${this.apiUrl}/users/${userId}`);
  }
}
