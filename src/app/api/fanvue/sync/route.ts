import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const accountId = String(body.accountId ?? "").trim();

    if (!accountId) {
      return NextResponse.json({ error: "accountId is required." }, { status: 400 });
    }

    const { data: account, error: accountError } = await supabase
      .from("fanvue_accounts")
      .select("id, fanvue_username, revenue_this_month, fans_count")
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Fanvue account not found." }, { status: 404 });
    }

    await supabase
      .from("fanvue_accounts")
      .update({ status: "syncing" })
      .eq("id", accountId);

    // Placeholder sync logic — real Fanvue scraping/API integration comes next.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const revenueThisMonth = Number(account.revenue_this_month ?? 0) + 125;
    const fansCount = Number(account.fans_count ?? 0) + 3;
    const syncedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("fanvue_accounts")
      .update({
        status: "connected",
        last_sync_at: syncedAt,
        revenue_this_month: revenueThisMonth,
        fans_count: fansCount,
        updated_at: syncedAt,
      })
      .eq("id", accountId);

    if (updateError) {
      await supabase.from("fanvue_sync_logs").insert({
        account_id: accountId,
        status: "failed",
        message: updateError.message,
      });
      await supabase
        .from("fanvue_accounts")
        .update({ status: "error" })
        .eq("id", accountId);

      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase.from("fanvue_sync_logs").insert({
      account_id: accountId,
      status: "success",
      message: `Synced @${account.fanvue_username} successfully (placeholder data).`,
    });

    const { data: updatedAccount } = await supabase
      .from("fanvue_accounts")
      .select(
        "id, account_name, fanvue_username, email, status, last_sync_at, revenue_this_month, fans_count, created_at",
      )
      .eq("id", accountId)
      .single();

    return NextResponse.json({
      success: true,
      message: "Fanvue account synced successfully.",
      account: updatedAccount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
