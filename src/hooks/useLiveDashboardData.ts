import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { DashboardData } from "@/types/dashboard.types";
import {
  createAdminSocket,
  adminSocket,
  disconnectAdminSocket,
} from "@/lib/adminSocket";
import { useAdminStore } from "@/stores/adminStore";
import { toast } from "@/hooks/use-toast";

interface UseLiveDashboardDataProps {
  date1?: Date;
  date2?: Date;
  enableRealTimeUpdates?: boolean;
}

interface UseLiveDashboardDataReturn {
  dashboardData: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isConnected: boolean;
  refreshData: () => void;
}

export const useLiveDashboardData = ({
  date1,
  date2,
  enableRealTimeUpdates = true,
}: UseLiveDashboardDataProps): UseLiveDashboardDataReturn => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const isComponentMounted = useRef<boolean>(true);
  const adminStore = useAdminStore();

  // Format date for API
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Fetch dashboard data from API
  const fetchDashboardData = useCallback(
    async (showLoading = true) => {
      if (!date1 || !date2) return;

      try {
        if (showLoading) setLoading(true);
        setError(null);

        const startDate = formatDateForAPI(date1);

        // Add 1 day to the end date for the API query
        const endDatePlusOne = new Date(date2);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        const endDate = formatDateForAPI(endDatePlusOne);

        const response = await axiosInstance.get(
          `/admin-chart?start_date=${startDate}&end_date=${endDate}&period_type=monthly&force_refresh=true`
        );

        const { EC, EM, data } = response.data;

        if (EC === 0 && isComponentMounted.current) {
          setDashboardData(data);
          setLastUpdated(new Date());
          setIsConnected(true);
        } else {
          setError(EM || "Failed to fetch dashboard data");
        }
      } catch (error: unknown) {
        console.error("Error fetching dashboard data:", error);
        if (isComponentMounted.current) {
          const errorMessage =
            (error as any)?.response?.data?.EM ||
            (error as any)?.message ||
            "Network error";
          setError(errorMessage);
          setIsConnected(false);
        }
      } finally {
        if (showLoading && isComponentMounted.current) {
          setLoading(false);
        }
      }
    },
    [date1, date2]
  );

  // Manual refresh function
  const refreshData = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Initial data fetch
  useEffect(() => {
    if (!date1 || !date2) return;

    // Initial fetch when component mounts or dates change
    fetchDashboardData(true);
  }, [date1, date2, fetchDashboardData]);

  // Setup Socket.IO connection for real-time updates
  useEffect(() => {
    if (
      !enableRealTimeUpdates ||
      !adminStore.isAuthenticated ||
      !adminStore.user?.accessToken
    ) {
      console.log("Real-time updates disabled or not authenticated");
      return;
    }

    let adminSocketInstance: any = null;

    const setupSocketConnection = async () => {
      try {
        console.log(
          "🔌 Setting up admin socket connection for dashboard updates"
        );
        console.log("🔍 Using token for admin:", {
          tokenLength: adminStore.user!.accessToken.length,
          startsWithEy: adminStore.user!.accessToken.startsWith("eyJ"),
          userType: adminStore.user!.logged_in_as,
        });

        adminSocketInstance = createAdminSocket(adminStore.user!.accessToken);

        adminSocketInstance.on("connect", () => {
          console.log("✅ Admin socket connected for dashboard updates");
          console.log("🔍 Socket ID:", adminSocketInstance?.id);
          setIsConnected(true);
          setError(null);
        });

        adminSocketInstance.on("disconnect", () => {
          console.log("❌ Admin socket disconnected");
          setIsConnected(false);
        });

        adminSocketInstance.on("connect_error", (error: any) => {
          console.error("❌ Admin socket connection error:", error);
          console.error("🔍 Error details:", {
            message: error.message,
            type: error.type,
            description: error.description,
          });
          setError("Failed to connect to real-time updates");
          setIsConnected(false);
        });

        // Listen for newly created entity notifications
        const handleNewlyCreatedEntity = (data: {
          entity_name: string;
          timestamp: number;
          message: string;
          event_type: string;
        }) => {
          // Refresh dashboard data when any new entity is created
          if (isComponentMounted.current) {
            console.log(
              "🔄 Refreshing dashboard data due to new entity creation"
            );
            fetchDashboardData(false); // Refresh data in background
            setLastUpdated(new Date());
          }
        };

        adminSocket.onNewlyCreatedEntity(handleNewlyCreatedEntity);

        return () => {
          adminSocket.offNewlyCreatedEntity(handleNewlyCreatedEntity);
        };
      } catch (error) {
        console.error("Failed to create admin socket connection:", error);
        setError("Failed to establish real-time connection");
        setIsConnected(false);
      }
    };

    const cleanup = setupSocketConnection();

    return () => {
      console.log("🧹 Cleaning up admin socket connection");
      if (cleanup) {
        cleanup.then((cleanupFn) => cleanupFn?.());
      }
      if (adminSocketInstance) {
        adminSocketInstance.disconnect();
      }
    };
  }, [
    enableRealTimeUpdates,
    adminStore.isAuthenticated,
    adminStore.user?.accessToken,
    fetchDashboardData,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      disconnectAdminSocket();
    };
  }, []);

  return {
    dashboardData,
    loading,
    error,
    lastUpdated,
    isConnected,
    refreshData,
  };
};
