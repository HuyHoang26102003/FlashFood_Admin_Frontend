import { useState, useRef, useCallback } from 'react';
import { CardCategory } from '@/utils/constants/card';

// Interface for the entity notification payload
interface EntityNotificationPayload {
  entity_name: string;
  entity_email?: string;
  timestamp: number;
  message: string;
  event_type: string;
}

// Hook to manage real-time corrections for card values
export function useRealTimeCardCorrections() {
  // Use a ref for tracking corrections to avoid re-renders
  const correctionsRef = useRef({
    totalUsers: 0,
    totalOrders: 0,
    soldPromotions: 0,
  });
  
  // State for UI updates only
  const [corrections, setCorrections] = useState({...correctionsRef.current});

  // Track processed events to prevent duplicates
  const processedEventsRef = useRef<Set<string>>(new Set());

  // Helper function to create unique event identifier
  const createEventId = (data: EntityNotificationPayload): string => {
    return `${data.entity_name}:${data.message}:${data.timestamp}`;
  };

  // Handle new entity notification
  const handleNewEntity = useCallback((data: EntityNotificationPayload) => {
    // Create unique identifier for this event
    const eventId = createEventId(data);
    
    // Check if we've already processed this exact event
    if (processedEventsRef.current.has(eventId)) {
      console.log(`[useRealTimeCardCorrections] Skipping duplicate event: ${eventId}`);
      return false; // Skip duplicate events entirely
    }
    
    // Mark this event as processed
    processedEventsRef.current.add(eventId);
    
    // Clean up old event IDs after delay to prevent memory leaks
    setTimeout(() => {
      processedEventsRef.current.delete(eventId);
    }, 10000); // Keep for 10 seconds

    console.log(`[useRealTimeCardCorrections] Processing new entity event: ${eventId}`);

    // Determine which counter to increment based on entity type
    const ent = data.entity_name.toLowerCase();
    
    if (ent === "order") {
      // Update ref directly
      correctionsRef.current.totalOrders += 1;
      // Then update state for UI
      setCorrections({...correctionsRef.current});
      
      console.log(`[useRealTimeCardCorrections] Real-time correction: Orders +1, now: ${correctionsRef.current.totalOrders}`);
      return "TOTAL_ORDERS" as CardCategory;
    } else if (["driver", "restaurant", "restaurant_owner", "customer", "customer_care", "customer_care_representative"].includes(ent)) {
      // Update ref directly
      correctionsRef.current.totalUsers += 1;
      // Then update state for UI
      setCorrections({...correctionsRef.current});
      
      console.log(`[useRealTimeCardCorrections] Real-time correction: Users +1, now: ${correctionsRef.current.totalUsers}`);
      return "TOTAL_USERS" as CardCategory;
    }
    
    return null;
  }, []);

  // Reset corrections (call when API data refreshes)
  const resetCorrections = useCallback(() => {
    console.log("[useRealTimeCardCorrections] Resetting corrections");
    correctionsRef.current = {
      totalUsers: 0,
      totalOrders: 0,
      soldPromotions: 0,
    };
    setCorrections({...correctionsRef.current});
  }, []);

  // Get corrected value
  const getCorrectedValue = useCallback((apiValue: number, type: CardCategory): number => {
    switch(type) {
      case "TOTAL_USERS":
        return apiValue + correctionsRef.current.totalUsers;
      case "TOTAL_ORDERS":
        return apiValue + correctionsRef.current.totalOrders;
      case "SOLD_PROMOTIONS":
        return apiValue + correctionsRef.current.soldPromotions;
      default:
        return apiValue;
    }
  }, []);

  return {
    corrections, // Return state for UI rendering
    handleNewEntity,
    resetCorrections,
    getCorrectedValue,
  };
} 