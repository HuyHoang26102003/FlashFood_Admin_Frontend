import { Card } from "@/components/ui/card";
import { BalanceActivityData } from "@/hooks/useBalanceActivityData";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface BalanceActivityChartProps {
  balanceData: BalanceActivityData[] | null;
  lastUpdated: Date | null;
}

export const BalanceActivityChart = ({
  balanceData,
  lastUpdated,
}: BalanceActivityChartProps) => {
  if (!balanceData) return null;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Balance Activity</h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceData}>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const moneyIn = payload[0]?.value as number;
                    const moneyOut = payload[1]?.value as number;
                    
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Money In
                            </span>
                            <span className="font-bold text-green-500">
                              {formatCurrency(moneyIn || 0)}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Money Out
                            </span>
                            <span className="font-bold text-red-500">
                              {formatCurrency(moneyOut || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="money_in"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                name="Money In"
              />
              <Line
                type="monotone"
                dataKey="money_out"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Money Out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}; 