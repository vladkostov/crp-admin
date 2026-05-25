export type FanvueAccountStatus = "connected" | "disconnected" | "error" | "syncing";

export type FanvueAccount = {
  id: string;
  account_name: string;
  fanvue_username: string;
  email: string | null;
  status: FanvueAccountStatus;
  last_sync_at: string | null;
  revenue_this_month: number;
  fans_count: number;
  created_at: string;
};

export type FanvueSyncLogStatus = "success" | "failed";
