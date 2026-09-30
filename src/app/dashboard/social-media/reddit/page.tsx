import { RedditPageContent } from "@/components/reddit/reddit-page-content";
import { createClient } from "@/lib/supabase/server";
import type { RedditAccount, RedditChat, RedditPost } from "@/lib/reddit/types";

export default async function RedditPage() {
  const supabase = await createClient();

  const { data: accounts, error } = await supabase
    .from("reddit_accounts")
    .select(
      "id, account_name, reddit_username, notes, status, posts_count, chats_count, comment_karma, link_karma, total_karma, last_sync_at, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load Reddit accounts:", error.message);
  }

  const accountIds = (accounts ?? []).map((account) => account.id);

  const [{ data: posts }, { data: chats }] = await Promise.all([
    accountIds.length
      ? supabase
          .from("reddit_posts")
          .select(
            "id, account_id, reddit_post_id, title, subreddit, permalink, url, selftext, score, comments_count, posted_at, scraped_at",
          )
          .in("account_id", accountIds)
          .order("posted_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] as RedditPost[] }),
    accountIds.length
      ? supabase
          .from("reddit_chats")
          .select(
            "id, account_id, external_id, peer_username, subject, message_count, last_message_at, scraped_at",
          )
          .in("account_id", accountIds)
          .order("last_message_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] as RedditChat[] }),
  ]);

  return (
    <RedditPageContent
      initialAccounts={(accounts ?? []) as RedditAccount[]}
      initialPosts={(posts ?? []) as RedditPost[]}
      initialChats={(chats ?? []) as RedditChat[]}
    />
  );
}
