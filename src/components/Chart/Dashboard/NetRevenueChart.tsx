"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { MdSaveAlt } from "react-icons/md";
import { IncomeData } from "@/types/dashboard.types";
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

export const description = "A simple area chart";

interface NetRevenueChartProps {
  netIncomeData?: IncomeData[];
  grossIncomeData?: IncomeData[];
  lastUpdated?: Date | null;
}

const chartConfig = {
  net: {
    label: "Net Income",
    color: "#c19ef8",
  },
  gross: {
    label: "Gross Income",
    color: "#8884d8",
  },
} satisfies ChartConfig;

export function NetRevenueChart({
  netIncomeData,
  grossIncomeData,
  lastUpdated,
}: NetRevenueChartProps) {
  // Format data for the chart
  const chartData =
    netIncomeData && grossIncomeData
      ? netIncomeData.map((item, index) => {
          const date = new Date(item.date).toLocaleDateString("en-US", {
            month: "long",
          });
          return {
            month: date,
            net: item.total_amount,
            gross: grossIncomeData[index]?.total_amount || 0,
          };
        })
      : [
          { month: "January", net: 186, gross: 220 },
          { month: "February", net: 305, gross: 350 },
          { month: "March", net: 237, gross: 270 },
          { month: "April", net: 73, gross: 120 },
          { month: "May", net: 209, gross: 250 },
          { month: "June", net: 214, gross: 260 },
        ];

  return (
    <Card className="shadcn-card-default">
      <div className="jb gap-2">
        <div className="fc gap-1">
          <div className="flex items-center gap-2">
            <CardTitle>Net Revenue</CardTitle>
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
          <AreaChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="net"
              type="natural"
              fill="var(--color-net)"
              fillOpacity={0.4}
              stroke="var(--color-net)"
            />
            <Area
              dataKey="gross"
              type="natural"
              fill="var(--color-gross)"
              fillOpacity={0.4}
              stroke="var(--color-gross)"
            />
          </AreaChart>
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
