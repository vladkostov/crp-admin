import { format, formatDistanceToNow } from "date-fns";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatLastSync(isoDate: string | null) {
  if (!isoDate) return "Never synced";
  const date = new Date(isoDate);
  return `${format(date, "MMM d, yyyy h:mm a")} (${formatDistanceToNow(date, { addSuffix: true })})`;
}
