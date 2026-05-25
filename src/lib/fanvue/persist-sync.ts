import type { SupabaseClient } from "@supabase/supabase-js";
import type { FanvueScrapeResult } from "@/lib/fanvue/scrape-types";

export async function persistFanvueSync(
  supabase: SupabaseClient,
  accountId: string,
  scraped: FanvueScrapeResult,
) {
  const syncedAt = new Date().toISOString();

  const { error: accountError } = await supabase
    .from("fanvue_accounts")
    .update({
      status: "connected",
      fans_count: scraped.fansCount,
      revenue_this_month: scraped.revenueThisMonth,
      last_sync_at: syncedAt,
      updated_at: syncedAt,
    })
    .eq("id", accountId);

  if (accountError) throw new Error(accountError.message);

  await supabase.from("fanvue_fan_snapshots").insert({
    account_id: accountId,
    fans_count: scraped.fansCount,
    recorded_at: syncedAt,
  });

  if (scraped.revenueRecent > 0) {
    await supabase.from("fanvue_revenue_entries").insert({
      account_id: accountId,
      amount: scraped.revenueRecent,
      period_label: "recent",
      recorded_at: syncedAt,
    });
  }

  if (scraped.revenueThisMonth > 0) {
    await supabase.from("fanvue_revenue_entries").insert({
      account_id: accountId,
      amount: scraped.revenueThisMonth,
      period_label: "month",
      recorded_at: syncedAt,
    });
  }

  if (scraped.posts.length > 0) {
    await supabase.from("fanvue_posts").upsert(
      scraped.posts.map((post) => ({
        account_id: accountId,
        external_id: post.externalId,
        title: post.title,
        likes: post.likes,
        comments: post.comments,
        posted_at: post.postedAt,
        scraped_at: syncedAt,
      })),
      { onConflict: "account_id,external_id" },
    );
  }

  const summary = `Synced ${scraped.fansCount.toLocaleString()} fans, $${scraped.revenueThisMonth.toLocaleString()} revenue, ${scraped.posts.length} posts (${scraped.source}).`;

  await supabase.from("fanvue_sync_logs").insert({
    account_id: accountId,
    status: "success",
    message: summary,
    metadata: {
      source: scraped.source,
      profileStats: scraped.profileStats,
      revenueRecent: scraped.revenueRecent,
      postsCount: scraped.posts.length,
    },
  });

  const { data: updatedAccount } = await supabase
    .from("fanvue_accounts")
    .select(
      "id, account_name, fanvue_username, email, status, last_sync_at, revenue_this_month, fans_count, created_at",
    )
    .eq("id", accountId)
    .single();

  return { summary, account: updatedAccount };
}
