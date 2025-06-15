export interface IncomeData {
  date: string;
  total_amount: number;
}

export interface OrderStats {
  date: string;
  cancelled: number;
  completed: number;
}

export interface UserGrowthData {
  date: string;
  customer: number;
  customer_care: number;
  driver: number;
  restaurant: number;
}

export interface DashboardData {
  average_customer_satisfaction: number;
  average_delivery_time: number;
  churn_rate: number;
  created_at: string;
  gross_from_promotion: string;
  gross_income: IncomeData[];
  id: string;
  net_income: IncomeData[];
  order_cancellation_rate: number;
  order_stats: OrderStats[];
  order_volume: number;
  period_end: string;
  period_start: string;
  period_type: string;
  sold_promotions: number;
  total_users: number;
  updated_at: string;
  user_growth_rate: UserGrowthData[];
} 