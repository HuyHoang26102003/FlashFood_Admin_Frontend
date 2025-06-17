import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";

export interface BalanceActivityData {
  date: string;
  money_in: number;
  money_out: number;
}

interface UseBalanceActivityDataProps {
  date1?: Date;
  date2?: Date;
  enablePolling?: boolean;
  pollingInterval?: number; // in milliseconds
}

interface UseBalanceActivityDataReturn {
  balanceData: BalanceActivityData[] | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshData: () => void;
}

export const useBalanceActivityData = ({
  date1,
  date2,
  enablePolling = true,
  pollingInterval = 30000, // 30 seconds
}: UseBalanceActivityDataProps = {}): UseBalanceActivityDataReturn => {
  const [balanceData, setBalanceData] = useState<BalanceActivityData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef<boolean>(true);

  // Format date for API
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Fetch balance activity data from API
  const fetchBalanceData = useCallback(async (showLoading = true) => {
    if (!date1 || !date2) return;

    try {
      if (showLoading) setLoading(true);
      setError(null);

      const startDate = formatDateForAPI(date1);
      const endDate = formatDateForAPI(date2);

      const response = await axiosInstance.get(
        `/transactions/finance/money-flow?start_date=${startDate}&end_date=${endDate}`
      );
      const { EC, EM, data } = response.data;

      if (EC === 0 && isComponentMounted.current) {
        setBalanceData(data);
        setLastUpdated(new Date());
      } else {
        setError(EM || "Failed to fetch balance activity data");
      }
    } catch (error: unknown) {
      console.error("Error fetching balance activity data:", error);
      if (isComponentMounted.current) {
        const errorMessage = 
          (error as Error)?.message || 
          "Network error";
        setError(errorMessage);
      }
    } finally {
      if (showLoading && isComponentMounted.current) {
        setLoading(false);
      }
    }
  }, [date1, date2]);

  // Manual refresh function
  const refreshData = useCallback(() => {
    fetchBalanceData(true);
  }, [fetchBalanceData]);

  // Setup polling
  useEffect(() => {
    if (!enablePolling || !date1 || !date2) return;

    // Initial fetch
    fetchBalanceData(true);

    // Setup interval for polling
    intervalRef.current = setInterval(() => {
      fetchBalanceData(false); // Don't show loading for background updates
    }, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enablePolling, pollingInterval, fetchBalanceData, date1, date2]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    balanceData,
    loading,
    error,
    lastUpdated,
    refreshData,
  };
}; 