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
import { OrderStats } from "@/types/dashboard.types";

interface DashboardTableProps {
  orderStats?: OrderStats[];
  churn_rate?: number;
  average_delivery_time?: number;
  average_customer_satisfaction?: number;
  order_cancellation_rate?: number;
  order_volume?: number;
  gross_from_promotion?: string;
  sold_promotions?: number;
  total_users?: number;
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
        average_delivery_time !== undefined && average_delivery_time !== 2147483647
          ? `${average_delivery_time} minutes`
          : "N/A",
      changePercent: 0.05,
      description: "Average time taken for delivery",
      isPositiveChange: false,
    },
    {
      metric: "Overall Customer Satisfaction",
      value:
        average_customer_satisfaction !== undefined && average_customer_satisfaction > 0
          ? `${average_customer_satisfaction}/5`
          : "N/A",
      changePercent: -0.02,
      description: "Aggregate rating based on customer feedback",
      isPositiveChange: false,
    },
    {
      metric: "Churn Rate",
      value:
        churn_rate !== undefined ? `${(churn_rate * 100).toFixed(1)}%` : "N/A",
      changePercent: 0.01,
      description: "Percentage of users who are not active for 1 month",
      isPositiveChange: false,
    },
    {
      metric: "Order Cancellation Rate",
      value:
        order_cancellation_rate !== undefined
          ? `${(order_cancellation_rate * 100).toFixed(1)}%`
          : "N/A",
      changePercent: -0.03,
      description: "Percentage of orders canceled before delivery",
      isPositiveChange: true,
    },
    {
      metric: "Order Volume",
      value:
        order_volume !== undefined
          ? `${order_volume.toLocaleString()} Orders`
          : "N/A",
      changePercent: 0.2,
      description: "Total number of orders placed within a specific timeframe",
      isPositiveChange: true,
    },
    {
      metric: "Gross from Promotions",
      value:
        gross_from_promotion !== undefined
          ? `$${parseFloat(gross_from_promotion).toFixed(2)}`
          : "N/A",
      changePercent: 0.15,
      description: "Total revenue generated from promotional campaigns",
      isPositiveChange: true,
    },
    {
      metric: "Sold Promotions",
      value:
        sold_promotions !== undefined
          ? `${sold_promotions.toLocaleString()} Promotions`
          : "N/A",
      changePercent: 0.08,
      description: "Number of promotional offers successfully sold",
      isPositiveChange: true,
    },
    {
      metric: "Total Users",
      value:
        total_users !== undefined
          ? `${total_users.toLocaleString()} Users`
          : "N/A",
      changePercent: 0.12,
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
          <TableHead>Change (%)</TableHead>
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
            >{`${item.changePercent > 0 ? "+" : ""}${(
              item.changePercent * 100
            ).toFixed(2)}%`}</TableCell>
            <TableCell className="text-neutral-500">
              {item.description}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
