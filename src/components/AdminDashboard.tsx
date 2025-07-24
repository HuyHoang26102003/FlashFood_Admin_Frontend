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

  // Stable socket event handler with useCallback
  const handleNewEntity = React.useCallback((data: NewlyCreatedEntityPayload) => {
    console.log(`[AdminDashboard] 🔍 Processing entity: ${data.entity_name} (${data.entity_email || 'no email'})`);
    
    // Determine which card to highlight
    const ent = data.entity_name.toLowerCase();
    let cardType: CardCategory | null = null;
    
    if (ent === "order") {
      cardType = "TOTAL_ORDERS";
      console.log(`[AdminDashboard] 📊 Setting highlight to TOTAL_ORDERS`);
    } else if (["driver", "restaurant", "restaurant_owner", "customer", "customer_care", "customer_care_representative"].includes(ent)) {
      cardType = "TOTAL_USERS";
      console.log(`[AdminDashboard] 📊 Setting highlight to TOTAL_USERS`);
    }
    
    // Set highlight
    if (cardType) {
      console.log(`[AdminDashboard] 🌟 Setting highlight state to ${cardType}`);
      setHighlightedCardType(cardType);
      if (cardType === "TOTAL_USERS") {
        setHighlightMetric("Total Users");
      }
      
      // Reset highlights after a short duration
      setTimeout(() => {
        console.log(`[AdminDashboard] ⏱️ Resetting highlight after timeout`);
        setHighlightedCardType(null);
        setHighlightMetric(undefined);
      }, HIGHLIGHT_DURATION);
    }

    // === Add notification based on preferences ===
    let shouldShowNotification = false;

    // Map entity types to notification preferences (fix case sensitivity)
    switch (data.entity_name.toLowerCase()) {
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
        data.entity_name.toLowerCase() !== "order" && data.entity_email
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
  }, [notificationPreferences, addNotification]);

  React.useEffect(() => {
    console.log(`[AdminDashboard] 🔌 Setting up socket connection with handler:`, handleNewEntity);
    adminSocket.onNewlyCreatedEntity(handleNewEntity);
    return () => {
      console.log(`[AdminDashboard] 🔌 Cleaning up socket connection`);
      adminSocket.offNewlyCreatedEntity(handleNewEntity);
    };
  }, [handleNewEntity]);

  // Debug log when highlight changes
  React.useEffect(() => {
    console.log(`[AdminDashboard] 🎯 Highlight changed to: ${highlightedCardType}`);
  }, [highlightedCardType]);

  // Reset real-time corrections when dashboard data refreshes (API data includes new entities)
  const initialLoadRef = React.useRef(true);
  
  React.useEffect(() => {
    if (dashboardData) {
      // Only reset on initial load or when API data actually changes
      if (initialLoadRef.current) {
        console.log("[AdminDashboard] Initial data load");
        initialLoadRef.current = false;
      } else {
        console.log("[AdminDashboard] API data updated");
      }
    }
  }, [dashboardData?.total_users?.metric, dashboardData?.order_volume?.metric]);

  // Create dashboard cards data with real-time corrections for inflated API values
  const dashboardCardsData: IDashboardListCards[] = dashboardData
    ? [
        {
          id: 1,
          type: "TOTAL_USERS" as CardCategory,
          value: dashboardData.total_users?.metric?.toString() || "0",
          label: "Total Users",
          icon: FaUsers,
          difference: 15, // You can calculate this based on previous data
        },
        {
          id: 2,
          type: "TOTAL_ORDERS" as CardCategory,
          value: dashboardData.order_volume?.metric?.toString() || "0",
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

  // Debug log to show final card values with corrections applied
  console.log("[AdminDashboard] Final card values:", {
    totalUsers: dashboardCardsData.find(card => card.type === "TOTAL_USERS")?.value,
    totalOrders: dashboardCardsData.find(card => card.type === "TOTAL_ORDERS")?.value,
  });

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

      {/* Debug output */}
      <div className="hidden">
        Current highlight: {highlightedCardType || 'none'}
      </div>

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
