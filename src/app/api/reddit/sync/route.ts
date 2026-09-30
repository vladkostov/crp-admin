import { NextResponse } from "next/server";
import { scrapeRedditPublicProfile } from "@/lib/reddit/public-scraper";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
      .from("reddit_accounts")
      .select("id, reddit_username, chats_count")
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Reddit account not found." }, { status: 404 });
    }

    await supabase.from("reddit_accounts").update({ status: "syncing" }).eq("id", accountId);

    const scraped = await scrapeRedditPublicProfile(account.reddit_username);
    const syncedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("reddit_accounts")
      .update({
        status: "connected",
        reddit_username: scraped.username,
        posts_count: scraped.posts.length,
        comment_karma: scraped.commentKarma,
        link_karma: scraped.linkKarma,
        total_karma: scraped.totalKarma,
        last_sync_at: syncedAt,
        updated_at: syncedAt,
      })
      .eq("id", accountId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    if (scraped.posts.length > 0) {
      const { error: postsError } = await supabase.from("reddit_posts").upsert(
        scraped.posts.map((post) => ({
          account_id: accountId,
          reddit_post_id: post.redditPostId,
          title: post.title,
          subreddit: post.subreddit,
          permalink: post.permalink,
          url: post.url,
          selftext: post.selftext,
          score: post.score,
          comments_count: post.commentsCount,
          posted_at: post.postedAt,
          scraped_at: syncedAt,
        })),
        { onConflict: "account_id,reddit_post_id" },
      );

      if (postsError) {
        throw new Error(postsError.message);
      }
    }

    const summary = `Synced ${scraped.posts.length} posts, ${scraped.totalKarma.toLocaleString()} karma for u/${scraped.username}. Chats require Reddit OAuth (coming next).`;

    await supabase.from("reddit_sync_logs").insert({
      account_id: accountId,
      status: "success",
      message: summary,
      metadata: {
        postsSynced: scraped.posts.length,
        totalKarma: scraped.totalKarma,
        chatsNote: "Inbox/chats need OAuth — not available via public Reddit API.",
      },
    });

    const { data: updatedAccount } = await supabase
      .from("reddit_accounts")
      .select(
        "id, account_name, reddit_username, notes, status, posts_count, chats_count, comment_karma, link_karma, total_karma, last_sync_at, created_at",
      )
      .eq("id", accountId)
      .single();

    const { data: posts } = await supabase
      .from("reddit_posts")
      .select(
        "id, account_id, reddit_post_id, title, subreddit, permalink, url, selftext, score, comments_count, posted_at, scraped_at",
      )
      .eq("account_id", accountId)
      .order("posted_at", { ascending: false })
      .limit(50);

    const { data: chats } = await supabase
      .from("reddit_chats")
      .select(
        "id, account_id, external_id, peer_username, subject, message_count, last_message_at, scraped_at",
      )
      .eq("account_id", accountId)
      .order("last_message_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      success: true,
      message: summary,
      account: updatedAccount,
      posts: posts ?? [],
      chats: chats ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reddit sync failed.";

    if (accountId) {
      await supabase.from("reddit_sync_logs").insert({
        account_id: accountId,
        status: "failed",
        message,
      });
      await supabase.from("reddit_accounts").update({ status: "error" }).eq("id", accountId);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
