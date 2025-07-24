import { IDashboardListCards } from "@/utils/sample/DashboardListCards";
import React, { useRef, useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

interface DashboardListCardsProps {
  data: IDashboardListCards[];
  highlightedCard?: string | null;
}

// Store counters globally to persist across re-renders and remounts
const globalCounters: {[key: string]: number} = {};

const DashboardListCards = ({
  data,
  highlightedCard,
}: DashboardListCardsProps) => {
  // Track if we've initialized our counters
  const initializedRef = useRef(false);
  
  // Force re-render when needed
  const [, forceUpdate] = useState({});
  
  // Initialize counters from initial data if needed
  useEffect(() => {
    console.log(`[DashboardListCards] 🏁 Checking data for initialization:`, 
      data ? data.map(item => ({ type: item.type, value: item.value })) : 'No data'
    );
    
    if (!data) return;
    
    // Initialize global counters from data EVERY TIME (not just first time)
    data.forEach(item => {
      const itemType = item.type;
      const value = parseInt(item.value.toString()) || 0;
      
      // Always initialize the counter
      if (!globalCounters[itemType] || initializedRef.current === false) {
        globalCounters[itemType] = value;
        console.log(`[DashboardListCards] ✅ Initialized counter for ${itemType}: ${value}`);
      }
    });
    
    initializedRef.current = true;
    console.log(`[DashboardListCards] 🔄 All counters initialized:`, globalCounters);
  }, [data]);
  
  // Direct debug check for highlight prop
  console.log(`[DashboardListCards] 🔎 Current highlight prop:`, highlightedCard);
  
  // Log when we receive a new highlight
  const prevHighlightRef = useRef<string | null | undefined>(null);
  useEffect(() => {
    console.log(`[DashboardListCards] 📣 Checking highlight change: ${highlightedCard} (previous: ${prevHighlightRef.current})`);
    
    // Only process if highlight changed and is not null
    if (highlightedCard && highlightedCard !== prevHighlightRef.current) {
      console.log(`[DashboardListCards] 📣 Received new highlight: ${highlightedCard} (previous: ${prevHighlightRef.current})`);
      
      // If we have a new highlight, increment the counter
      if (globalCounters[highlightedCard] !== undefined) {
        const prevValue = globalCounters[highlightedCard];
        globalCounters[highlightedCard] = prevValue + 1;
        console.log(`[DashboardListCards] 🚀 ROBUST INCREMENT: ${highlightedCard} ${prevValue} → ${prevValue + 1}`);
        
        // Force re-render
        forceUpdate({});
      } else {
        console.log(`[DashboardListCards] ⚠️ WARNING: Received highlight for ${highlightedCard} but counter is not initialized!`, globalCounters);
        
        // Initialize counter if needed
        if (data) {
          const item = data.find(item => item.type === highlightedCard);
          if (item) {
            const value = parseInt(item.value.toString()) || 0;
            globalCounters[highlightedCard] = value + 1; // Initialize and increment
            console.log(`[DashboardListCards] 🔧 Fixed missing counter for ${highlightedCard}: ${value} → ${value + 1}`);
            forceUpdate({});
          }
        }
      }
      
      // Update previous highlight
      prevHighlightRef.current = highlightedCard;
    } else if (highlightedCard === null && prevHighlightRef.current !== null) {
      // Reset previous highlight when current is null
      console.log(`[DashboardListCards] 🔄 Resetting previous highlight from ${prevHighlightRef.current} to null`);
      prevHighlightRef.current = null;
    }
  }, [highlightedCard, data]);
  
  // If data isn't available yet, return null
  if (!data) return null;
  
  // Create display data with our global counters
  const displayData = data.map(item => {
    const itemType = item.type;
    
    // Use our global counter value if available
    if (globalCounters[itemType] !== undefined) {
      return {
        ...item,
        value: globalCounters[itemType].toString()
      };
    }
    
    // Fallback to original value
    return item;
  });
  
  // Debug log
  console.log("[DashboardListCards] Rendering with values:", 
    displayData.map(item => ({
      type: item.type,
      value: item.value,
      highlighted: highlightedCard === item.type,
      globalCounter: globalCounters[item.type]
    }))
  );
  
  return (
    <div className="jb gap-4 py-6 max-lg:grid max-lg:grid-cols-2 ">
      {displayData.map((item) => {
        const isHighlighted = highlightedCard === item.type;
        return (
          <div
            key={item.id}
            className={`card md:flex-1 flex items-center min-h-32 gap-4 relative hover-sd transition-all duration-300 ${
              isHighlighted ? "ring-4 ring-success-500/70 animate-pulse" : ""
            }`}
          >
            <div
              className={`absolute top-0 right-0  p-2 max-md:p-1 rounded-md shadow ${
                item.difference > 0 ? "shadow-success-700" : "shadow-danger-500"
              }`}
            >
              <div className="flex items-center gap-1 text-sm">
                <div
                  className={`circle w-6 cc ${
                    item.difference > 0 ? "bg-success-100" : "bg-danger-100"
                  }`}
                >
                  {item.difference > 0 ? (
                    <FaArrowUp className="text-green-700 text-xs" />
                  ) : (
                    <FaArrowDown className="text-red-500 text-xs" />
                  )}
                </div>
                <p
                  className={`font-extrabold max-md:font-bold text-xs${
                    item.difference > 0
                      ? " text-success-700"
                      : " text-danger-500"
                  }`}
                >
                  {item.difference}%
                </p>
              </div>
            </div>
            <div className="circle w-12 bg-primary-100 cc">
              {React.createElement(item.icon, {
                className: "text-xl text-primary-500",
              })}
            </div>
            <div className="fc flex-1">
              <div className="jb gap-4 ">
                <h1 className="text-xl max-md:text-lg max-md:font-bold font-extrabold">
                  {item.value}
                </h1>
              </div>
              <h1 className="font-bold max-md:font-semibold text-primary-700 text-xs">
                {item.label}
              </h1>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardListCards;
