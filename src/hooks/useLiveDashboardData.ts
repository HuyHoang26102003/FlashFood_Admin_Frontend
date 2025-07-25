import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { DashboardData } from "@/types/dashboard.types";
import {
  createAdminSocket,
  adminSocket,
  disconnectAdminSocket,
  NewlyCreatedEntityPayload,
} from "@/lib/adminSocket";
import { useAdminStore } from "@/stores/adminStore";
import { Socket } from "socket.io-client";

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

interface AxiosErrorResponse {
  response?: {
    data?: {
      EM?: string;
    };
  };
  message?: string;
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
          const axiosError = error as AxiosErrorResponse;
          const errorMessage =
            axiosError?.response?.data?.EM ||
            axiosError?.message ||
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

    let adminSocketInstance: Socket | null = null;

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

        adminSocketInstance.on("connect_error", (error: Error) => {
          console.error("❌ Admin socket connection error:", error);
          const socketError = error as Error & {
            type?: string;
            description?: { message: string };
          };
          console.error("🔍 Error details:", {
            message: socketError.message,
            type: socketError.type,
            description: socketError.description,
          });
          setError("Failed to connect to real-time updates");
          setIsConnected(false);
        });

        // === Handle entity-created notifications ===
        const handleNewlyCreatedEntity = (data: NewlyCreatedEntityPayload) => {
          if (!isComponentMounted.current) return;

          const entity = data.entity_name.toLowerCase();

          setDashboardData((prev) => {
            if (!prev) return prev;

            // Clone the previous data to avoid direct mutations
            const updated = { ...prev } as DashboardData;

            if (entity === "order") {
              // Increment order volume metric
              updated.order_volume = {
                ...prev.order_volume,
                metric: (prev.order_volume?.metric || 0) + 1,
              };
            } else if (
              [
                "driver",
                "restaurant",
                "restaurant_owner",
                "customer",
                "customer_care",
                "customer_care_representative",
              ].includes(entity)
            ) {
              // Increment total users metric
              updated.total_users = {
                ...prev.total_users,
                metric: (prev.total_users?.metric || 0) + 1,
              };
            }

            return updated;
          });

          // Update last-updated timestamp so UI reflects the change
          setLastUpdated(new Date());
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
