export const formatDateToRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  return `${years}y`;
};

/**
 * Formats an epoch timestamp to a relative time string (e.g., "2 hours ago", "3 days ago")
 * @param epochTime - The epoch timestamp in seconds
 * @returns A string representing the relative time
 */
export function formatEpochToRelativeTime(epochTime: number): string {
  if (!epochTime) return "Unknown time";

  const now = Math.floor(Date.now() / 1000);
  const diff = now - epochTime;

  if (diff < 60) {
    return "Just now";
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  } else if (diff < 2592000) {
    const weeks = Math.floor(diff / 604800);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  } else if (diff < 31536000) {
    const months = Math.floor(diff / 2592000);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  } else {
    const years = Math.floor(diff / 31536000);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  }
}
