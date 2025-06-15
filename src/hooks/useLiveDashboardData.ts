import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { DashboardData } from "@/types/dashboard.types";

interface UseLiveDashboardDataProps {
  date1?: Date;
  date2?: Date;
  enablePolling?: boolean;
  enableWebSocket?: boolean;
  pollingInterval?: number; // in milliseconds
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
  enablePolling = true,
  enableWebSocket = false,
  pollingInterval = 30000, // 30 seconds
}: UseLiveDashboardDataProps): UseLiveDashboardDataReturn => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isComponentMounted = useRef<boolean>(true);

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

  // Setup polling
  useEffect(() => {
    if (!enablePolling || !date1 || !date2) return;

    // Initial fetch
    fetchDashboardData(true);

    // Setup interval for polling
    intervalRef.current = setInterval(() => {
      fetchDashboardData(false); // Don't show loading for background updates
    }, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enablePolling, date1, date2, pollingInterval, fetchDashboardData]);

  // Setup WebSocket connection
  useEffect(() => {
    if (!enableWebSocket) return;

    const connectWebSocket = () => {
      try {
        // Replace with your WebSocket endpoint
        const wsUrl = "ws://localhost:1310/ws/dashboard";
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log("✅ WebSocket connected for live dashboard updates");
          setIsConnected(true);
          setError(null);

          // Send initial message with date range if needed
          if (wsRef.current && date1 && date2) {
            wsRef.current.send(
              JSON.stringify({
                type: "subscribe_dashboard",
                start_date: formatDateForAPI(date1),
                end_date: formatDateForAPI(date2),
              })
            );
          }
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === "dashboard_update" && message.data) {
              console.log("📊 Received live dashboard update:", message.data);
              setDashboardData(message.data);
              setLastUpdated(new Date());
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log("❌ WebSocket connection closed:", event.reason);
          setIsConnected(false);

          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (isComponentMounted.current) {
              connectWebSocket();
            }
          }, 5000);
        };

        wsRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
          setError("WebSocket connection failed");
          setIsConnected(false);
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
        setError("Failed to establish WebSocket connection");
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [enableWebSocket, date1, date2]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
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
