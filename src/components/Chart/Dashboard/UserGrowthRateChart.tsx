"use client";

import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { MdSaveAlt } from "react-icons/md";
import { UserGrowthData } from "@/types/dashboard.types";
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

export const description = "A multiple line chart";

interface UserGrowthRateChartProps {
  userGrowthData?: UserGrowthData[];
  lastUpdated?: Date | null;
}

const chartConfig = {
  customer: {
    label: "Customers",
    color: "hsl(var(--chart-1))",
  },
  restaurant: {
    label: "Restaurants",
    color: "hsl(var(--chart-2))",
  },
  driver: {
    label: "Drivers",
    color: "hsl(var(--chart-3))",
  },
  customer_care: {
    label: "Customer Care",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function UserGrowthRateChart({
  userGrowthData,
  lastUpdated,
}: UserGrowthRateChartProps) {
  // Format data for the chart
  const chartData = userGrowthData
    ? userGrowthData.map((item) => {
        const date = new Date(item.date).toLocaleDateString("en-US", {
          month: "long",
        });
        return {
          month: date,
          customer: item.customer,
          restaurant: item.restaurant,
          driver: item.driver,
          customer_care: item.customer_care,
        };
      })
    : [
        {
          month: "January",
          customer: 18,
          restaurant: 10,
          driver: 8,
          customer_care: 2,
        },
        {
          month: "February",
          customer: 30,
          restaurant: 15,
          driver: 12,
          customer_care: 3,
        },
        {
          month: "March",
          customer: 25,
          restaurant: 12,
          driver: 10,
          customer_care: 2,
        },
        {
          month: "April",
          customer: 15,
          restaurant: 9,
          driver: 7,
          customer_care: 1,
        },
        {
          month: "May",
          customer: 20,
          restaurant: 13,
          driver: 9,
          customer_care: 2,
        },
        {
          month: "June",
          customer: 22,
          restaurant: 14,
          driver: 10,
          customer_care: 3,
        },
      ];

  return (
    <Card className="shadcn-card-default">
      <div className="jb gap-2">
        <div className="fc gap-1">
          <div className="flex items-center gap-2">
            <CardTitle>User Growth Rate</CardTitle>
            <LiveDataBadge lastUpdated={lastUpdated || null} />
          </div>
          <CardDescription className="font-thin text-xs text-neutral-400"></CardDescription>
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
          <LineChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="customer"
              type="monotone"
              stroke="var(--color-customer)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="restaurant"
              type="monotone"
              stroke="var(--color-restaurant)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="driver"
              type="monotone"
              stroke="var(--color-driver)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="customer_care"
              type="monotone"
              stroke="var(--color-customer_care)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by{" "}
              <span className="text-success-700 font-bold">5.2%</span> this
              month{" "}
              <TrendingUp className="h-4 w-4 text-success-700 font-bold" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground"></div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
