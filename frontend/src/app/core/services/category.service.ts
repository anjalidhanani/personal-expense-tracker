import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Category } from '../models/expense.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon: string;
  color: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  /**
   * Get all categories
   */
  getCategories(): Observable<ApiResponse<{ categories: Category[] }>> {
    return this.http.get<ApiResponse<{ categories: Category[] }>>(this.apiUrl);
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: string): Observable<ApiResponse<{ category: Category }>> {
    return this.http.get<ApiResponse<{ category: Category }>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new category
   */
  createCategory(categoryData: CreateCategoryRequest): Observable<ApiResponse<{ category: Category }>> {
    return this.http.post<ApiResponse<{ category: Category }>>(this.apiUrl, categoryData);
  }

  /**
   * Update category
   */
  updateCategory(id: string, categoryData: UpdateCategoryRequest): Observable<ApiResponse<{ category: Category }>> {
    return this.http.put<ApiResponse<{ category: Category }>>(`${this.apiUrl}/${id}`, categoryData);
  }

  /**
   * Delete category
   */
  deleteCategory(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Toggle category active status
   */
  toggleCategoryStatus(id: string): Observable<ApiResponse<{ category: Category }>> {
    return this.http.patch<ApiResponse<{ category: Category }>>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}
