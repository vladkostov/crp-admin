export type RedditAccountStatus = "connected" | "disconnected" | "error" | "syncing";

export type RedditAccount = {
  id: string;
  account_name: string;
  reddit_username: string;
  notes: string | null;
  status: RedditAccountStatus;
  posts_count: number;
  chats_count: number;
  comment_karma: number;
  link_karma: number;
  total_karma: number;
  last_sync_at: string | null;
  created_at: string;
};

export type RedditPost = {
  id: string;
  account_id: string;
  reddit_post_id: string;
  title: string;
  subreddit: string | null;
  permalink: string | null;
  url: string | null;
  selftext: string | null;
  score: number;
  comments_count: number;
  posted_at: string | null;
  scraped_at: string;
};

export type RedditChat = {
  id: string;
  account_id: string;
  external_id: string;
  peer_username: string | null;
  subject: string | null;
  message_count: number;
  last_message_at: string | null;
  scraped_at: string;
};
