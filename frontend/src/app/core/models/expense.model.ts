export interface Expense {
  _id: string;
  userId: string;
  categoryId: string | Category;
  amount: number;
  description: string;
  date: Date;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet' | 'other';
  tags: string[];
  receipt?: string;
  location?: string;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextRecurringDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExpenseRequest {
  categoryId: string;
  amount: number;
  description: string;
  date?: Date;
  paymentMethod?: string;
  tags?: string[];
  location?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: string;
}

export interface UpdateExpenseRequest extends Partial<CreateExpenseRequest> {}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
  categoryId?: string;
  description?: string;
  paymentMethod?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseStats {
  total: {
    totalAmount: number;
    count: number;
  };
  categoryBreakdown: CategoryExpenseStats[];
  monthly: MonthlyExpenseStats[];
  recent: Expense[];
  totalExpenses?: number;
  recentUsers?: any[];
}

export interface CategoryBreakdownStats {
  name: string;
  totalAmount: number;
  percentage: number;
  color?: string;
  icon?: string;
}

export interface CategoryExpenseStats {
  _id: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  name: string;
  color: string;
  icon: string;
  totalAmount: number;
  count: number;
}

export interface MonthlyExpenseStats {
  _id: {
    month: number;
    year: number;
  };
  totalAmount: number;
  count: number;
}

export interface ExpenseResponse {
  success: boolean;
  message?: string;
  data: {
    expenses: Expense[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalExpenses: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface ExpenseStatsResponse {
  success: boolean;
  data: ExpenseStats;
}
