import { cleanRedditUsername } from "@/lib/reddit/format";

export type ScrapedRedditPost = {
  redditPostId: string;
  title: string;
  subreddit: string | null;
  permalink: string | null;
  url: string | null;
  selftext: string | null;
  score: number;
  commentsCount: number;
  postedAt: string | null;
};

export type ScrapedRedditProfile = {
  username: string;
  commentKarma: number;
  linkKarma: number;
  totalKarma: number;
  posts: ScrapedRedditPost[];
};

type RedditListingChild = {
  data?: {
    id?: string;
    name?: string;
    title?: string;
    subreddit?: string;
    permalink?: string;
    url?: string;
    selftext?: string;
    score?: number;
    num_comments?: number;
    created_utc?: number;
  };
};

type RedditListingResponse = {
  data?: {
    children?: RedditListingChild[];
    after?: string | null;
  };
};

type RedditAboutResponse = {
  data?: {
    name?: string;
    comment_karma?: number;
    link_karma?: number;
    total_karma?: number;
  };
};

const USER_AGENT = "OFM-CRM/1.0 (agency traffic tracker; contact: local-team)";

async function redditFetch<T>(path: string): Promise<T> {
  const response = await fetch(`https://www.reddit.com${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Reddit API error (${response.status}): ${body.slice(0, 180)}`);
  }

  return response.json() as Promise<T>;
}

export async function scrapeRedditPublicProfile(usernameInput: string): Promise<ScrapedRedditProfile> {
  const username = cleanRedditUsername(usernameInput);
  if (!username) {
    throw new Error("Reddit username is required.");
  }

  const about = await redditFetch<RedditAboutResponse>(`/user/${encodeURIComponent(username)}/about.json`);
  const postsPayload = await redditFetch<RedditListingResponse>(
    `/user/${encodeURIComponent(username)}/submitted.json?limit=50&raw_json=1`,
  );

  const posts: ScrapedRedditPost[] = (postsPayload.data?.children ?? [])
    .map((child) => child.data)
    .filter(Boolean)
    .map((post) => ({
      redditPostId: String(post?.id ?? post?.name ?? crypto.randomUUID()),
      title: String(post?.title ?? "Untitled post"),
      subreddit: post?.subreddit ? String(post.subreddit) : null,
      permalink: post?.permalink ? `https://www.reddit.com${post.permalink}` : null,
      url: post?.url ? String(post.url) : null,
      selftext: post?.selftext ? String(post.selftext).slice(0, 2000) : null,
      score: Number(post?.score ?? 0),
      commentsCount: Number(post?.num_comments ?? 0),
      postedAt: post?.created_utc
        ? new Date(Number(post.created_utc) * 1000).toISOString()
        : null,
    }));

  const commentKarma = Number(about.data?.comment_karma ?? 0);
  const linkKarma = Number(about.data?.link_karma ?? 0);
  const totalKarma = Number(about.data?.total_karma ?? commentKarma + linkKarma);

  return {
    username: about.data?.name ?? username,
    commentKarma,
    linkKarma,
    totalKarma,
    posts,
  };
}
