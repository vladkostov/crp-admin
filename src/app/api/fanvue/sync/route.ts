import { NextResponse } from "next/server";
import { FanvueSyncError } from "@/lib/fanvue/errors";
import { logFanvueSync, logFanvueSyncError } from "@/lib/fanvue/logger";
import { persistFanvueSync } from "@/lib/fanvue/persist-sync";
import { runFanvueSync } from "@/lib/fanvue/sync-runner";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await createClient();
  let accountId = "";

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    accountId = String(body.accountId ?? "").trim();

    if (!accountId) {
      return NextResponse.json({ error: "accountId is required." }, { status: 400 });
    }

    const { data: account, error: accountError } = await supabase
      .from("fanvue_accounts")
      .select(
        "id, fanvue_username, email, password_encrypted, api_key_encrypted, revenue_this_month, fans_count",
      )
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Fanvue account not found." }, { status: 404 });
    }

    logFanvueSync("Sync requested", {
      accountId,
      username: account.fanvue_username,
    });

    await supabase.from("fanvue_accounts").update({ status: "syncing" }).eq("id", accountId);

    const scraped = await runFanvueSync(account);
    const { summary, account: updatedAccount } = await persistFanvueSync(
      supabase,
      accountId,
      scraped,
    );

    logFanvueSync("Sync completed", { accountId, summary });

    return NextResponse.json({
      success: true,
      message: summary,
      account: updatedAccount,
      stats: {
        fansCount: scraped.fansCount,
        revenueThisMonth: scraped.revenueThisMonth,
        revenueRecent: scraped.revenueRecent,
        postsSynced: scraped.posts.length,
        source: scraped.source,
      },
    });
  } catch (error) {
    logFanvueSyncError("Sync route failed", error);

    const message =
      error instanceof FanvueSyncError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Sync failed.";

    if (accountId) {
      await supabase.from("fanvue_sync_logs").insert({
        account_id: accountId,
        status: "failed",
        message,
        metadata: {
          code: error instanceof FanvueSyncError ? error.code : "UNKNOWN",
        },
      });
      await supabase.from("fanvue_accounts").update({ status: "error" }).eq("id", accountId);
    }

    const status =
      error instanceof FanvueSyncError && error.code === "MISSING_CREDENTIALS" ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
