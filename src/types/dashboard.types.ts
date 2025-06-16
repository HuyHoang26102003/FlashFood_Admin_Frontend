export interface IncomeData {
  date: string;
  order_count: number;
  total_amount: number;
}

export interface OrderStats {
  date: string;
  total: number;
  cancelled: number;
  delivered: number;
}

export interface MetricData {
  metric: number;
  changeType: "real" | "percentage";
  monthlyChanges: number;
}

export interface UserGrowthData {
  date: string;
  customer: number;
  customer_care: number;
  driver: number;
  restaurant: number;
}

export interface DashboardData {
  average_customer_satisfaction: MetricData;
  average_delivery_time: MetricData;
  churn_rate: MetricData;
  created_at: string;
  gross_from_promotion: MetricData;
  gross_income: IncomeData[];
  id: string;
  net_income: IncomeData[];
  order_cancellation_rate: MetricData;
  order_stats: OrderStats[];
  order_volume: MetricData;
  period_end: string;
  period_start: string;
  period_type: string;
  sold_promotions: number;
  total_users: number;
  updated_at: string;
  user_growth_rate: UserGrowthData[];
} 