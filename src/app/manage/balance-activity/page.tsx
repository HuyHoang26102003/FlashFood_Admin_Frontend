'use client'
import React, { useState } from 'react'
import { useBalanceActivityData } from '@/hooks/useBalanceActivityData'
import { BalanceActivityChart } from '@/components/Chart/BalanceActivityChart'
import Compare2Date from '@/components/Compare2Date'

const BalanceActivityPage = () => {
  // Initialize date state with current date and one month ago
  const [date2, setDate2] = useState<Date | undefined>(new Date());
  const [date1, setDate1] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  });

  const {
    balanceData,
    loading,
    error,
    lastUpdated,
  } = useBalanceActivityData({
    date1,
    date2,
    enablePolling: true,
  });

  return (
    <div className="fc">

      {/* Date Filter */}
    <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold">Balance Activity</h1>
    <Compare2Date
        date1={date1}
        setDate1={setDate1}
        date2={date2}
        setDate2={setDate2}
      />
    </div>

      {/* Error State */}
      {error && !loading && (
        <div className="card bg-red-50 border-red-200 mb-4">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-red-500">⚠️</span>
            <p className="font-medium">Error</p>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !balanceData && (
        <div className="card mb-4">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">
                Loading balance activity data...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <BalanceActivityChart 
        balanceData={balanceData}
        lastUpdated={lastUpdated}
      />
    </div>
  )
}

export default BalanceActivityPage
