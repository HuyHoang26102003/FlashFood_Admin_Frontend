import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStats, MetricData } from "@/types/dashboard.types";

interface DashboardTableProps {
  orderStats?: OrderStats[];
  churn_rate?: MetricData;
  average_delivery_time?: MetricData;
  average_customer_satisfaction?: MetricData;
  order_cancellation_rate?: MetricData;
  order_volume?: MetricData;
  gross_from_promotion?: MetricData;
  sold_promotions?: MetricData;
  total_users?: MetricData;
  period_type?: string;
}

export function DashboardTable({
  churn_rate,
  average_delivery_time,
  average_customer_satisfaction,
  order_cancellation_rate,
  order_volume,
  gross_from_promotion,
  sold_promotions,
  total_users,
  period_type,
}: DashboardTableProps) {
  // Create table data based on real metrics when available, or fallback to sample data
  const tableData = [
    {
      metric: "Average Delivery Time",
      value:
        average_delivery_time !== undefined && average_delivery_time.metric > 0
          ? `${Math.round(average_delivery_time.metric / 60)} minutes`
          : "N/A",
      changePercent: average_delivery_time?.monthlyChanges ? parseFloat((average_delivery_time.monthlyChanges / 60).toFixed(1)) : 0,
      changeType: average_delivery_time?.changeType || "real",
      description: "Average time taken for delivery (converted from seconds)",
      isPositiveChange: (average_delivery_time?.monthlyChanges || 0) <= 0,
    },
    {
      metric: "Overall Customer Satisfaction",
      value:
        average_customer_satisfaction !== undefined && average_customer_satisfaction.metric > 0
          ? `${average_customer_satisfaction.metric.toFixed(1)}/5`
          : "Not Available",
      changePercent: average_customer_satisfaction?.monthlyChanges || 0,
      changeType: average_customer_satisfaction?.changeType || "real",
      description: "Aggregate rating based on customer feedback",
      isPositiveChange: (average_customer_satisfaction?.monthlyChanges || 0) >= 0,
    },
    {
      metric: "Churn Rate",
      value:
        churn_rate !== undefined ? `${(churn_rate.metric * 100).toFixed(1)}%` : "N/A",
      changePercent: churn_rate?.monthlyChanges ? (churn_rate.monthlyChanges) : 0,
      changeType: churn_rate?.changeType || "percentage",
      description: "Percentage of users who are not active for 1 month",
      isPositiveChange: (churn_rate?.monthlyChanges || 0) <= 0,
    },
    {
      metric: "Order Cancellation Rate",
      value:
        order_cancellation_rate !== undefined
          ? `${(order_cancellation_rate.metric * 100).toFixed(1)}%`
          : "N/A",
      changePercent: order_cancellation_rate?.monthlyChanges ? (order_cancellation_rate.monthlyChanges) : 0,
      changeType: order_cancellation_rate?.changeType || "percentage",
      description: "Percentage of orders canceled before delivery",
      isPositiveChange: (order_cancellation_rate?.monthlyChanges || 0) <= 0,
    },
    {
      metric: "Order Volume",
      value:
        order_volume !== undefined
          ? `${order_volume.metric.toLocaleString()} Orders`
          : "N/A",
      changePercent: order_volume?.monthlyChanges || 0,
      changeType: order_volume?.changeType || "real",
      description: "Total number of orders placed within a specific timeframe",
      isPositiveChange: (order_volume?.monthlyChanges || 0) >= 0,
    },
    {
      metric: "Gross from Promotions",
      value:
        gross_from_promotion !== undefined
          ? `$${gross_from_promotion.metric.toFixed(2)}`
          : "N/A",
      changePercent: gross_from_promotion?.monthlyChanges || 0,
      changeType: gross_from_promotion?.changeType || "real",
      description: "Total revenue generated from promotional campaigns",
      isPositiveChange: (gross_from_promotion?.monthlyChanges || 0) >= 0,
    },
    {
      metric: "Sold Promotions",
      value:
        sold_promotions !== undefined
          ? `${sold_promotions.metric.toLocaleString()} Promotions`
          : "N/A",
      changePercent: sold_promotions?.monthlyChanges || 0,
      changeType: sold_promotions?.changeType || "real",
      description: "Number of promotional offers successfully sold",
      isPositiveChange: true,
    },
    {
      metric: "Total Users",
      value:
        total_users !== undefined
          ? `${total_users.metric.toLocaleString()} Users`
          : "N/A",
      changePercent: total_users?.monthlyChanges || 0,
      changeType: total_users?.changeType || "real",
      description: "Total number of registered users across all categories",
      isPositiveChange: true,
    },
  ];

  return (
    <Table className="overflow-hidden card">
      <TableCaption>
        Statistics of essential performance metrics to evaluate FlashFood health
        {period_type && ` (${period_type} period)`}.
      </TableCaption>
      <TableHeader className="bg-info-100 ">
        <TableRow className="font-semibold">
          <TableHead>Metric</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Monthly Change</TableHead>
          <TableHead>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableData.map((item) => (
          <TableRow key={item.metric}>
            <TableCell className="font-medium text-primary-700">
              {item.metric}
            </TableCell>
            <TableCell className="font-bold">{item.value}</TableCell>
            <TableCell
              className={`${
                item.isPositiveChange ? "text-success-700" : "text-danger-500"
              }`}
            >{`${item.changePercent > 0 ? "+" : ""}${Number(
              item.changePercent
            ).toFixed(2)}${item.changeType === "percentage" ? "%" : ""}`}</TableCell>
            <TableCell className="text-neutral-500">
              {item.description}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
