import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface LiveDataBadgeProps {
  lastUpdated: Date | null;
  showAnimation?: boolean;
}

export const LiveDataBadge: React.FC<LiveDataBadgeProps> = ({
  lastUpdated,
  showAnimation = true,
}) => {
  const [isFlashing, setIsFlashing] = useState(false);

  // Flash animation when data updates
  useEffect(() => {
    if (lastUpdated && showAnimation) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdated, showAnimation]);

  const getTimeAgo = (date: Date | null): string => {
    if (!date) return "No data";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 30) return "Just updated";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <Badge
      variant="secondary"
      className={`
        flex items-center gap-1 text-xs transition-all duration-300
        ${
          isFlashing
            ? "bg-green-100 text-green-700 border-green-300 shadow-md"
            : ""
        }
        ${!lastUpdated ? "opacity-50" : ""}
      `}
    >
      <Zap
        className={`h-3 w-3 ${
          isFlashing ? "text-green-600 animate-pulse" : "text-muted-foreground"
        }`}
      />
      <span className={isFlashing ? "font-medium" : ""}>
        {getTimeAgo(lastUpdated)}
      </span>
    </Badge>
  );
};
