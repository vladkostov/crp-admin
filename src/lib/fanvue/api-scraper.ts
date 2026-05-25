import { FanvueSyncError } from "@/lib/fanvue/errors";
import { logFanvueSync, logFanvueSyncError } from "@/lib/fanvue/logger";
import type { FanvueScrapeResult } from "@/lib/fanvue/scrape-types";

const API_BASE = process.env.FANVUE_API_BASE_URL ?? "https://api.fanvue.com";
const API_VERSION = process.env.FANVUE_API_VERSION ?? "2025-06-26";

type FanvueMeResponse = {
  uuid?: string;
  handle?: string;
  displayName?: string;
  likesCount?: number;
  fanCounts?: {
    followersCount?: number;
    subscribersCount?: number;
  };
  contentCounts?: {
    postCount?: number;
    imageCount?: number;
    videoCount?: number;
  };
};

type FanvueEarningsItem = {
  gross?: number;
  net?: number;
  amount?: number;
};

type FanvueEarningsResponse = {
  data?: FanvueEarningsItem[];
  items?: FanvueEarningsItem[];
};

async function fanvueApiFetch<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-Fanvue-API-Version": API_VERSION,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new FanvueSyncError(
      `Fanvue API error (${response.status}): ${body.slice(0, 240)}`,
      "API_FAILED",
    );
  }

  return response.json() as Promise<T>;
}

function sumEarningsCents(payload: FanvueEarningsResponse) {
  const rows = payload.data ?? payload.items ?? [];
  return rows.reduce((total, row) => {
    const cents = Number(row.net ?? row.gross ?? row.amount ?? 0);
    return total + (Number.isFinite(cents) ? cents : 0);
  }, 0);
}

async function fetchMonthlyEarnings(token: string, creatorUuid: string) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const paths = [
    `/insights/earnings?startDate=${encodeURIComponent(start)}&size=100`,
    `/creators/${creatorUuid}/insights/earnings?startDate=${encodeURIComponent(start)}&size=100`,
  ];

  for (const path of paths) {
    try {
      const payload = await fanvueApiFetch<FanvueEarningsResponse>(token, path);
      const cents = sumEarningsCents(payload);
      if (cents > 0) return cents / 100;
    } catch {
      // try next endpoint shape
    }
  }

  return 0;
}

export async function scrapeFanvueWithApi(apiKey: string): Promise<FanvueScrapeResult> {
  try {
    logFanvueSync("Starting Fanvue API sync (/users/me)");
    const user = await fanvueApiFetch<FanvueMeResponse>(apiKey, "/users/me");

    const fansCount = Number(
      user.fanCounts?.subscribersCount ?? user.fanCounts?.followersCount ?? 0,
    );

    if (!user.uuid || fansCount <= 0) {
      throw new FanvueSyncError(
        "Fanvue API token works but returned no subscriber/fan counts. Use a creator token with read:self scope.",
        "API_FAILED",
      );
    }

    const revenueThisMonth = user.uuid ? await fetchMonthlyEarnings(apiKey, user.uuid) : 0;

    return {
      fansCount,
      revenueRecent: revenueThisMonth,
      revenueThisMonth,
      profileStats: {
        handle: user.handle ?? "",
        display_name: user.displayName ?? "",
        post_count: user.contentCounts?.postCount ?? 0,
        likes_count: user.likesCount ?? 0,
      },
      posts: [],
      source: "api",
    };
  } catch (error) {
    logFanvueSyncError("Fanvue API sync failed", error);
    if (error instanceof FanvueSyncError) throw error;
    throw new FanvueSyncError(
      error instanceof Error ? error.message : "Fanvue API sync failed.",
      "API_FAILED",
    );
  }
}
