"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  EntityNotification,
  getEntityStyle,
} from "@/hooks/useEntityNotifications";

interface EntityNotificationContainerProps {
  notifications: EntityNotification[];
  onRemove: (id: string) => void;
}

export const EntityNotificationContainer: React.FC<
  EntityNotificationContainerProps
> = ({ notifications, onRemove }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] space-y-2 w-80">
      {notifications.map((notification, index) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          index={index}
          onRemove={onRemove}
        />
      ))}
    </div>,
    document.body
  );
};

// Individual notification card component
const NotificationCard: React.FC<{
  notification: EntityNotification;
  index: number;
  onRemove: (id: string) => void;
}> = ({ notification, index, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(notification.id), 150);
  };

  const style = getEntityStyle(notification.entityType);
  const timeAgo = Math.floor((Date.now() - notification.timestamp) / 1000);

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${
          notification.isVisible && !isExiting
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95"
        }
        ${isExiting ? "translate-x-full opacity-0" : ""}
      `}
      style={{
        transitionDelay: `${index * 50}ms`,
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 relative group hover:shadow-xl transition-shadow duration-200">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
          <div
            className={`h-full ${style.bg} animate-shrink-width`}
            style={{
              animationDuration: "5000ms",
              animationFillMode: "forwards",
            }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div
            className={`
              flex-shrink-0 w-8 h-8 rounded-full ${style.bg} 
              flex items-center justify-center text-white text-sm
            `}
          >
            {style.icon}
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                New {notification.entityName}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {timeAgo < 60
                  ? `${timeAgo}s ago`
                  : `${Math.floor(timeAgo / 60)}m ago`}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {notification.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
