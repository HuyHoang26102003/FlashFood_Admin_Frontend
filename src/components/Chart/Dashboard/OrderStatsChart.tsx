"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { MdSaveAlt } from "react-icons/md";
import { OrderStats } from "@/types/dashboard.types";
import { LiveDataBadge } from "@/components/LiveDataBadge";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

export const description = "Order status breakdown chart";

interface OrderStatsChartProps {
  orderStatsData?: OrderStats[];
  lastUpdated?: Date | null;
}

const chartConfig = {
  total: {
    label: "Total Orders",
    color: "hsl(var(--chart-1))",
  },
  delivered: {
    label: "Delivered",
    color: "#10b981",
  },
  cancelled: {
    label: "Cancelled",
    color: "#ef4444",
  },
} satisfies ChartConfig;

export function OrderStatsChart({
  orderStatsData,
  lastUpdated,
}: OrderStatsChartProps) {
  // Format data for the chart
  const chartData = orderStatsData
    ? orderStatsData.map((item) => {
        const date = new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return {
          date: date,
          total: item.total || 0,
          delivered: item.delivered || 0,
          cancelled: item.cancelled || 0,
        };
      })
    : [
        {
          date: "May 28",
          total: 1,
          delivered: 1,
          cancelled: 0,
        },
        {
          date: "Jun 15",
          total: 1,
          delivered: 1,
          cancelled: 0,
        },
      ];

  return (
    <Card className="shadcn-card-default">
      <div className="jb gap-2">
        <div className="fc gap-1">
          <div className="flex items-center gap-2">
            <CardTitle>Order Status Distribution</CardTitle>
            <LiveDataBadge lastUpdated={lastUpdated || null} />
          </div>
          <CardDescription className="font-thin text-xs text-neutral-400">
            Breakdown of orders by status over time
          </CardDescription>
        </div>
        <Button
          variant={"outline"}
          className="text-primary-500 border-primary-500 font-bold flex items-center gap-1"
        >
          <MdSaveAlt /> Save Report
        </Button>
      </div>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar
              dataKey="total"
              fill="var(--color-total)"
              stackId="orders"
            />
            <Bar
              dataKey="delivered"
              fill="var(--color-delivered)"
              stackId="orders"
            />
            <Bar
              dataKey="cancelled"
              fill="var(--color-cancelled)"
              stackId="orders"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Order processing efficiency trending{" "}
              <span className="text-success-700 font-bold">up</span>{" "}
              <TrendingUp className="h-4 w-4 text-success-700 font-bold" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Showing order status distribution across selected period
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
} 