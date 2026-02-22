export interface Report {
  _id?: string;
  userId?: string;
  name: string;
  description?: string;
  type: 'expense_summary' | 'category_breakdown' | 'monthly_trends' | 'budget_analysis' | 'custom';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters: {
    categories?: string[];
    paymentMethods?: string[];
    amountRange?: {
      min?: number;
      max?: number;
    };
    tags?: string[];
  };
  chartType: 'pie' | 'bar' | 'line' | 'doughnut' | 'area';
  groupBy: 'category' | 'date' | 'payment_method' | 'tag' | 'month' | 'week';
  isScheduled: boolean;
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextRunDate?: Date;
  emailRecipients?: string[];
  isPublic: boolean;
  isFavorite: boolean;
  lastGenerated?: Date;
  generationCount: number;
  reportData?: {
    summary: {
      totalExpenses: number;
      totalTransactions: number;
      averageExpense: number;
      highestExpense: number;
      lowestExpense: number;
    };
    chartData: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string[];
        borderColor: string[];
      }>;
    };
    tableData: Array<{
      date: Date;
      description: string;
      category: string;
      amount: number;
      paymentMethod: string;
    }>;
  };
  settings: {
    currency: string;
    dateFormat: string;
    includeSubcategories: boolean;
    showPercentages: boolean;
    showTrends: boolean;
  };
  status?: 'never_generated' | 'fresh' | 'recent' | 'stale';
  durationDays?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuickReportRequest {
  type?: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters?: any;
  chartType?: string;
  groupBy?: string;
}

export interface DashboardSummary {
  period: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalExpenses: number;
    totalTransactions: number;
    averageExpense: number;
    highestExpense: number;
    lowestExpense: number;
  };
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
    }>;
  };
  tableData: Array<{
    date: Date;
    description: string;
    category: string;
    amount: number;
    paymentMethod: string;
  }>;
}

export interface ReportResponse {
  success: boolean;
  data: Report | Report[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardSummaryResponse {
  success: boolean;
  data: DashboardSummary;
  message?: string;
}
