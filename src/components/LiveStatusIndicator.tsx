import React from "react";
import { RefreshCw, Wifi, WifiOff, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LiveStatusIndicatorProps {
  isConnected: boolean;
  lastUpdated: Date | null;
  error: string | null;
  loading: boolean;
  onRefresh: () => void;
  enablePolling?: boolean;
  enableWebSocket?: boolean;
}

export const LiveStatusIndicator: React.FC<LiveStatusIndicatorProps> = ({
  isConnected,
  lastUpdated,
  error,
  loading,
  onRefresh,
  enablePolling = true,
  enableWebSocket = false,
}) => {
  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return "Never";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) {
      return `${diffSecs}s ago`;
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  const getConnectionStatus = () => {
    if (error) {
      return {
        variant: "destructive" as const,
        icon: AlertCircle,
        text: "Error",
        description: error,
      };
    }

    if (isConnected) {
      return {
        variant: "default" as const,
        icon: Wifi,
        text: "Live",
        description: enableWebSocket ? "WebSocket connected" : "Polling active",
      };
    }

    return {
      variant: "secondary" as const,
      icon: WifiOff,
      text: "Offline",
      description: "Disconnected from server",
    };
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-3 text-sm">
      <Badge
        variant={status.variant}
        className="flex items-center gap-1.5 px-2 py-1 cursor-pointer"
        title={`${status.description}${
          enablePolling ? " • Updates every 30s" : ""
        }${enableWebSocket ? " • Real-time updates" : ""}`}
      >
        <StatusIcon className="h-3 w-3" />
        {status.text}
      </Badge>

      <div className="flex items-center gap-1 text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span className="text-xs">{formatLastUpdated(lastUpdated)}</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        className="h-7 w-7 p-0"
        title="Refresh data manually"
      >
        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
};
