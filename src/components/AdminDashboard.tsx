"use client";
import React, { useState } from "react";
import DashboardListCards from "@/components/Card/DashboardListCards";
import { NetRevenueChart } from "@/components/Chart/Dashboard/NetRevenueChart";
import { UserGrowthRateChart } from "@/components/Chart/Dashboard/UserGrowthRateChart";
import { OrderStatsChart } from "@/components/Chart/Dashboard/OrderStatsChart";
import { DashboardTable } from "@/components/DashboardTable";
import PageTitle from "@/components/PageTitle";
import { LiveStatusIndicator } from "@/components/LiveStatusIndicator";
import { IDashboardListCards } from "@/utils/sample/DashboardListCards";
import { CardCategory } from "@/utils/constants/card";
import { FaUsers, FaShoppingCart, FaGift, FaChartLine } from "react-icons/fa";
import { useLiveDashboardData } from "@/hooks/useLiveDashboardData";

const AdminDashboard = () => {
  const [date2, setDate2] = useState<Date | undefined>(new Date());
  const [date1, setDate1] = useState<Date | undefined>(() => {
    const date = new Date(); // Create a new Date object for the current date
    date.setMonth(date.getMonth() - 1); // Subtract one month
    return date; // Return the updated Date object
  });

  // Configuration for live data updates
  const [enablePolling, setEnablePolling] = useState<boolean>(true);
  const [enableWebSocket, setEnableWebSocket] = useState<boolean>(false);

  // Use the live dashboard data hook
  const {
    dashboardData,
    loading,
    error,
    lastUpdated,
    isConnected,
    refreshData,
  } = useLiveDashboardData({
    date1,
    date2,
    enablePolling,
    enableWebSocket,
    pollingInterval: 30000, // 30 seconds to match your backend
  });

  // Create dashboard cards data from real API data
  const dashboardCardsData: IDashboardListCards[] = dashboardData
    ? [
        {
          id: 1,
          type: "TOTAL_USERS" as CardCategory,
          value: dashboardData.total_users?.toString() || "0",
          label: "Total Users",
          icon: FaUsers,
          difference: 15, // You can calculate this based on previous data
        },
        {
          id: 2,
          type: "TOTAL_REVENUE" as CardCategory,
          value: dashboardData.order_volume?.toString() || "0",
          label: "Total Orders",
          icon: FaShoppingCart,
          difference: 12,
        },
        {
          id: 4,
          type: "SATISFACTION_RATE" as CardCategory,
          value: dashboardData.sold_promotions?.toString() || "0",
          label: "Sold Promotions",
          icon: FaGift,
          difference: 5,
        },
        {
          id: 5,
          type: "SATISFACTION_RATE" as CardCategory,
          value: `${(dashboardData.churn_rate * 100).toFixed(1)}%` || "0%",
          label: "Churn Rate",
          icon: FaChartLine,
          difference: -3, // Negative because lower churn is better
        },
      ]
    : [];

  return (
    <div className="fc">
      <PageTitle
        date1={date1}
        setDate1={setDate1}
        date2={date2}
        setDate2={setDate2}
        isDashboard
      />

      {/* Live Status Indicator */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div className="fc gap-2">
            <h2 className="text-lg font-semibold">📊 Live Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Real-time data updates from your FlashFood system
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enablePolling}
                  onChange={(e) => setEnablePolling(e.target.checked)}
                  className="rounded"
                />
                Polling (30s)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableWebSocket}
                  onChange={(e) => setEnableWebSocket(e.target.checked)}
                  className="rounded"
                />
                WebSocket
              </label>
            </div>
            <LiveStatusIndicator
              isConnected={isConnected}
              lastUpdated={lastUpdated}
              error={error}
              loading={loading}
              onRefresh={refreshData}
              enablePolling={enablePolling}
              enableWebSocket={enableWebSocket}
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="card bg-red-50 border-red-200 mb-4">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-red-500">⚠️</span>
            <p className="font-medium">Connection Error</p>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <p className="text-xs text-red-500 mt-2">
            The dashboard will continue trying to reconnect automatically.
          </p>
        </div>
      )}

      {/* Loading State for Initial Load */}
      {loading && !dashboardData && (
        <div className="card mb-4">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">
                Loading dashboard data...
              </span>
            </div>
          </div>
        </div>
      )}

      <DashboardListCards data={dashboardCardsData} />

      <div className="jb gap-4 max-lg:grid max-lg:grid-cols-1">
        <div className="card lg:flex-1 fc">
          <NetRevenueChart
            netIncomeData={dashboardData?.net_income}
            grossIncomeData={dashboardData?.gross_income}
            lastUpdated={lastUpdated}
          />
        </div>
        <div className="card lg:flex-1 fc">
          <UserGrowthRateChart
            userGrowthData={dashboardData?.user_growth_rate}
            lastUpdated={lastUpdated}
          />
        </div>
      </div>

      <div className="py-6">
        <div className="card fc">
          <OrderStatsChart
            orderStatsData={dashboardData?.order_stats}
            lastUpdated={lastUpdated}
          />
        </div>
      </div>

      <div className="py-6">
        <div className="card fc gap-4">
          <h1 className="text-xl font-bold">Key Performance</h1>
          <DashboardTable
            orderStats={dashboardData?.order_stats}
            churn_rate={dashboardData?.churn_rate}
            average_delivery_time={dashboardData?.average_delivery_time}
            average_customer_satisfaction={
              dashboardData?.average_customer_satisfaction
            }
            order_cancellation_rate={dashboardData?.order_cancellation_rate}
            order_volume={dashboardData?.order_volume}
            gross_from_promotion={dashboardData?.gross_from_promotion}
            sold_promotions={dashboardData?.sold_promotions}
            total_users={dashboardData?.total_users}
            period_type={dashboardData?.period_type}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
