"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

export interface EntityNotification {
  id: string;
  entityType: string;
  entityName: string;
  message: string;
  timestamp: number;
  isVisible: boolean;
}

interface UseEntityNotificationsReturn {
  notifications: EntityNotification[];
  addNotification: (data: {
    entity_name: string;
    message?: string;
    timestamp?: number;
  }) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NOTIFICATION_DURATION = 5000; // 5 seconds
const MAX_NOTIFICATIONS = 6;

export const useEntityNotifications = (): UseEntityNotificationsReturn => {
  const [notifications, setNotifications] = useState<EntityNotification[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeNotification = useCallback((id: string) => {
    // Clear timeout if exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }

    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isVisible: false } : notif
      )
    );

    // Remove from array after animation
    setTimeout(() => {
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    }, 300);
  }, []);

  const addNotification = useCallback(
    (data: { entity_name: string; message?: string; timestamp?: number }) => {
      const id = `${data.entity_name}-${Date.now()}-${Math.random()}`;
      const entityType = data.entity_name.toLowerCase();

      // Map entity types to display names and colors
      const entityConfig = {
        customer: { name: "Customer", color: "bg-blue-500", icon: "👤" },
        driver: { name: "Driver", color: "bg-green-500", icon: "🚗" },
        restaurant: { name: "Restaurant", color: "bg-orange-500", icon: "🏪" },
        restaurant_owner: {
          name: "Restaurant Owner",
          color: "bg-orange-600",
          icon: "👨‍🍳",
        },
        customer_care: {
          name: "Customer Care",
          color: "bg-purple-500",
          icon: "🎧",
        },
        customer_care_representative: {
          name: "Customer Care Rep",
          color: "bg-purple-600",
          icon: "👨‍💼",
        },
        order: { name: "Order", color: "bg-emerald-500", icon: "📦" },
        inquiry: { name: "Inquiry", color: "bg-indigo-500", icon: "❓" },
        customer_care_inquiry: {
          name: "Care Inquiry",
          color: "bg-indigo-600",
          icon: "💬",
        },
      };

      const config =
        entityConfig[entityType as keyof typeof entityConfig] ||
        entityConfig.customer;

      const timestampInMs = data.timestamp ? data.timestamp * 1000 : Date.now();

      const notification: EntityNotification = {
        id,
        entityType,
        entityName: config.name,
        message: data.message || `New ${config.name} created`,
        timestamp: timestampInMs,
        isVisible: true,
      };

      setNotifications((prev) => {
        const updated = [notification, ...prev].slice(0, MAX_NOTIFICATIONS);
        return updated;
      });

      // Auto-remove after duration
      const timeout = setTimeout(() => {
        removeNotification(id);
      }, NOTIFICATION_DURATION);

      timeoutsRef.current.set(id, timeout);
    },
    [removeNotification]
  );

  const clearAll = useCallback(() => {
    // Clear all timeouts
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();

    setNotifications([]);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };
};

// Helper function to get entity styling
export const getEntityStyle = (entityType: string) => {
  const styles = {
    customer: { bg: "bg-blue-500", icon: "👤" },
    driver: { bg: "bg-green-500", icon: "🚗" },
    restaurant: { bg: "bg-orange-500", icon: "🏪" },
    restaurant_owner: { bg: "bg-orange-600", icon: "👨‍🍳" },
    customer_care: { bg: "bg-purple-500", icon: "🎧" },
    customer_care_representative: { bg: "bg-purple-600", icon: "👨‍💼" },
    order: { bg: "bg-emerald-500", icon: "📦" },
    inquiry: { bg: "bg-indigo-500", icon: "❓" },
    customer_care_inquiry: { bg: "bg-indigo-600", icon: "💬" },
  };

  return (
    styles[entityType as keyof typeof styles] || {
      bg: "bg-gray-500",
      icon: "📄",
    }
  );
};
