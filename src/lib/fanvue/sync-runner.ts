import { scrapeFanvueWithApi } from "@/lib/fanvue/api-scraper";
import { decryptSecret } from "@/lib/fanvue/crypto";
import { FanvueSyncError } from "@/lib/fanvue/errors";
import { logFanvueSync } from "@/lib/fanvue/logger";
import { scrapeFanvueWithPlaywright } from "@/lib/fanvue/playwright-scraper";
import type { FanvueScrapeResult } from "@/lib/fanvue/scrape-types";

type FanvueAccountCredentials = {
  id: string;
  fanvue_username: string;
  email: string | null;
  password_encrypted: string | null;
  api_key_encrypted: string | null;
};

export async function runFanvueSync(
  account: FanvueAccountCredentials,
): Promise<FanvueScrapeResult> {
  if (account.api_key_encrypted) {
    const apiKey = decryptSecret(account.api_key_encrypted);
    logFanvueSync("Using Fanvue API token for sync");
    return scrapeFanvueWithApi(apiKey);
  }

  if (!account.email || !account.password_encrypted) {
    throw new FanvueSyncError(
      "Missing Fanvue email/password. Add credentials or a valid API key.",
      "MISSING_CREDENTIALS",
    );
  }

  const password = decryptSecret(account.password_encrypted);
  return scrapeFanvueWithPlaywright({
    email: account.email,
    password,
  });
}
