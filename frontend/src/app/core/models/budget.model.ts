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
