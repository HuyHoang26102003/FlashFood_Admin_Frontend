/**
 * Formats an epoch timestamp to an exact time string (hh:mm:ss dd/mm/yyyy)
 * @param epochTime - The epoch timestamp in seconds
 * @returns A string in the format "hh:mm:ss dd/mm/yyyy"
 */
export function formatEpochToExactTime(epochTime: number): string {
  if (!epochTime) return "Unknown time";

  const date = new Date(epochTime * 1000);

  // Format hours, minutes, seconds with leading zeros
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  // Format day, month, year
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}
