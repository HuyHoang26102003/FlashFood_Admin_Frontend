"use client";
import React, { useState } from "react";
import DashboardListCards from "@/components/Card/DashboardListCards";
import { NetRevenueChart } from "@/components/Chart/Dashboard/NetRevenueChart";
import { UserGrowthRateChart } from "@/components/Chart/Dashboard/UserGrowthRateChart";
import { OrderStatsChart } from "@/components/Chart/Dashboard/OrderStatsChart";
import { DashboardTable } from "@/components/DashboardTable";
import PageTitle from "@/components/PageTitle";
import { IDashboardListCards } from "@/utils/sample/DashboardListCards";
import { CardCategory } from "@/utils/constants/card";
import { FaUsers, FaShoppingCart, FaGift, FaChartLine } from "react-icons/fa";
import { useLiveDashboardData } from "@/hooks/useLiveDashboardData";
import { LiveStatusIndicator } from "@/components/LiveStatusIndicator";
import { useEntityNotifications } from "@/hooks/useEntityNotifications";
import { EntityNotificationContainer } from "@/components/EntityNotificationContainer";
import { useNotificationStore } from "@/stores/notificationStore";
import { adminSocket, NewlyCreatedEntityPayload } from "@/lib/adminSocket";

// Add highlight effect duration (ms)
const HIGHLIGHT_DURATION = 4000;

const AdminDashboard = () => {
  const [date2, setDate2] = useState<Date | undefined>(new Date());
  const [date1, setDate1] = useState<Date | undefined>(() => {
    const date = new Date(); // Create a new Date object for the current date
    date.setMonth(date.getMonth() - 1); // Subtract one month
    return date; // Return the updated Date object
  });

  // Use the live dashboard data hook with real-time Socket.IO updates (server auth now fixed!)
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
    enableRealTimeUpdates: true, // Re-enable Socket.IO - server now reads auth.token
  });

  // === Highlight state management ===
  const [highlightedCardType, setHighlightedCardType] = useState<string | null>(
    null
  );
  const [highlightMetric, setHighlightMetric] = useState<string>();

  // === New notification system ===
  const { notifications, addNotification, removeNotification } =
    useEntityNotifications();
  const notificationPreferences = useNotificationStore(
    (state) => state.preferences
  );

  // Ref to track recently notified emails to prevent duplicates
  const recentlyNotifiedEmailsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const handleNewEntity = (data: NewlyCreatedEntityPayload) => {
      // Prevent duplicate notifications for the same email in a short period
      if (data.entity_email) {
        if (recentlyNotifiedEmailsRef.current.has(data.entity_email)) {
          return; // Already notified for this email, skip.
        }
        // Add email to the set and remove it after a delay
        recentlyNotifiedEmailsRef.current.add(data.entity_email);
        setTimeout(() => {
          recentlyNotifiedEmailsRef.current.delete(data.entity_email as string);
        }, HIGHLIGHT_DURATION);
      }
      const ent = data.entity_name.toLowerCase();

      // Determine highlight targets based on entity type
      let cardToHighlight: CardCategory | null = null;
      if (ent === "order") {
        cardToHighlight = "TOTAL_ORDERS";
      } else if (ent === "driver") {
        cardToHighlight = "TOTAL_USERS";
      } else if (
        [
          "restaurant",
          "restaurant_owner",
          "customer",
          "customer_care",
          "customer_care_representative",
        ].includes(ent)
      ) {
        cardToHighlight = "TOTAL_USERS";
        setHighlightMetric("Total Users");
      }

      if (cardToHighlight) {
        setHighlightedCardType(cardToHighlight);
        // Reset highlights after a short duration
        setTimeout(() => {
          setHighlightedCardType(null);
          setHighlightMetric(undefined);
        }, HIGHLIGHT_DURATION);
      }

      // === Add notification based on preferences ===
      let shouldShowNotification = false;

      // Map entity types to notification preferences (fix case sensitivity)
      switch (ent) {
        case "order":
          shouldShowNotification = notificationPreferences.orders;
          break;
        case "restaurant":
        case "restaurant_owner":
          shouldShowNotification = notificationPreferences.restaurants;
          break;
        case "customer":
          shouldShowNotification = notificationPreferences.customers;
          break;
        case "driver":
          shouldShowNotification = notificationPreferences.drivers;
          break;
        case "customer_care":
        case "customer_care_representative":
          shouldShowNotification = notificationPreferences.customerCare;
          break;
        case "inquiry":
        case "customer_care_inquiry":
          shouldShowNotification =
            notificationPreferences.customerCareInquiries;
          break;
        default:
          // For unknown entity types, show if any notifications are enabled
          shouldShowNotification = Object.values(notificationPreferences).some(
            Boolean
          );
          break;
      }

      if (shouldShowNotification) {
        const notificationMessage =
          ent !== "order" && data.entity_email
            ? `A new ${data.entity_name
                .replace(/_/g, " ")
                .toLowerCase()} has just registered with email ${
                data.entity_email
              }`
            : data.message;
        addNotification({
          entity_name: data.entity_name,
          message: notificationMessage,
          timestamp: data.timestamp,
        });
      }
    };

    adminSocket.onNewlyCreatedEntity(handleNewEntity);
    return () => {
      adminSocket.offNewlyCreatedEntity(handleNewEntity);
    };
  }, [addNotification, notificationPreferences]);

  // Create dashboard cards data from real API data
  const dashboardCardsData: IDashboardListCards[] = dashboardData
    ? [
        {
          id: 1,
          type: "TOTAL_USERS" as CardCategory,
          value: dashboardData.total_users?.metric.toString() || "0",
          label: "Total Users",
          icon: FaUsers,
          difference: 15, // You can calculate this based on previous data
        },
        {
          id: 2,
          type: "TOTAL_ORDERS" as CardCategory,
          value: dashboardData.order_volume?.metric.toString() || "0",
          label: "Total Orders",
          icon: FaShoppingCart,
          difference: dashboardData.order_volume?.monthlyChanges || 12,
        },
        {
          id: 4,
          type: "SOLD_PROMOTIONS" as CardCategory,
          value: dashboardData.sold_promotions?.metric?.toString() || "0",
          label: "Sold Promotions",
          icon: FaGift,
          difference: 5,
        },
        {
          id: 5,
          type: "CHURN_RATE" as CardCategory,
          value:
            `${(dashboardData.churn_rate?.metric * 100).toFixed(1)}%` || "0%",
          label: "Churn Rate",
          icon: FaChartLine,
          difference: dashboardData.churn_rate?.monthlyChanges
            ? dashboardData.churn_rate.monthlyChanges
            : -3,
        },
      ]
    : [];

  return (
    <div className="fc">
      {/* Entity Notifications */}
      <EntityNotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />

      <PageTitle
        date1={date1}
        setDate1={setDate1}
        date2={date2}
        setDate2={setDate2}
        isDashboard
      />

      {/* Real-time Connection Status */}
      <div className="flex items-center justify-center mb-4">
        <LiveStatusIndicator
          isConnected={isConnected}
          lastUpdated={lastUpdated}
          error={error}
          loading={loading}
          onRefresh={refreshData}
          enableWebSocket={true}
        />
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

      <DashboardListCards
        data={dashboardCardsData}
        highlightedCard={highlightedCardType}
      />

      <div className="jb gap-4 max-lg:grid max-lg:grid-cols-1">
        <div className="card lg:flex-1 fc h-96">
          <OrderStatsChart
            orderStatsData={dashboardData?.order_stats}
            lastUpdated={lastUpdated}
          />
        </div>
        <div className="card lg:flex-1 fc h-96">
          <UserGrowthRateChart
            userGrowthData={dashboardData?.user_growth_rate}
            lastUpdated={lastUpdated}
          />
        </div>
      </div>
      <div className="py-6">
        <div className="card fc">
          <NetRevenueChart
            netIncomeData={dashboardData?.net_income}
            grossIncomeData={dashboardData?.gross_income}
            lastUpdated={lastUpdated}
          />
        </div>
      </div>

      <div className="py-6">
        <div className="card fc gap-4">
          <h1 className="text-xl font-bold">Key Performance</h1>
          <DashboardTable
            highlightMetric={highlightMetric}
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
