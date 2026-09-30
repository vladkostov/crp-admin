import { format, formatDistanceToNow } from "date-fns";

export function formatLastSync(isoDate: string | null) {
  if (!isoDate) return "Never synced";
  const date = new Date(isoDate);
  return `${format(date, "MMM d, yyyy h:mm a")} (${formatDistanceToNow(date, { addSuffix: true })})`;
}

export function formatPostedAt(isoDate: string | null) {
  if (!isoDate) return "Unknown date";
  const date = new Date(isoDate);
  return `${format(date, "MMM d, yyyy h:mm a")}`;
}

export function cleanRedditUsername(value: string) {
  return value.trim().replace(/^u\//i, "").replace(/^@/, "");
}
