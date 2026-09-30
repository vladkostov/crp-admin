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

const USER_AGENT =
  process.env.REDDIT_USER_AGENT ??
  "web:ofm-crm:v1.0.0 (by /u/ofm_crm_bot)";

let cachedAppToken: { value: string; expiresAt: number } | null = null;

async function getRedditAppToken() {
  const clientId = process.env.REDDIT_CLIENT_ID?.trim();
  const clientSecret = process.env.REDDIT_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  if (cachedAppToken && cachedAppToken.expiresAt > Date.now() + 30_000) {
    return cachedAppToken.value;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Reddit OAuth failed (${response.status}). Check REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET. ${body.slice(0, 120)}`,
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!payload.access_token) {
    throw new Error("Reddit OAuth did not return an access token.");
  }

  cachedAppToken = {
    value: payload.access_token,
    expiresAt: Date.now() + Number(payload.expires_in ?? 3600) * 1000,
  };

  return cachedAppToken.value;
}

async function redditFetchJson<T>(url: string, headers: Record<string, string>) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      ...headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(
      `Reddit API error (${response.status}): ${body.replace(/<[^>]+>/g, " ").slice(0, 160)}`,
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

async function fetchRedditPaths<T>(oauthPath: string, publicPath: string) {
  const token = await getRedditAppToken();
  const attempts: Array<{ url: string; headers: Record<string, string> }> = [];

  if (token) {
    attempts.push({
      url: `https://oauth.reddit.com${oauthPath}`,
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Public fallbacks (often blocked on Vercel / cloud IPs with 403).
  attempts.push(
    {
      url: `https://old.reddit.com${publicPath}`,
      headers: {},
    },
    {
      url: `https://www.reddit.com${publicPath}`,
      headers: {},
    },
  );

  let lastError: Error | null = null;

  for (const attempt of attempts) {
    try {
      return await redditFetchJson<T>(attempt.url, attempt.headers);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const status = (error as { status?: number }).status;
      if (status && status !== 403 && status !== 429) {
        throw lastError;
      }
    }
  }

  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    throw new Error(
      "Reddit blocked anonymous requests (403). Create a free Reddit app at https://www.reddit.com/prefs/apps and set REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET in Vercel, then Redeploy.",
    );
  }

  throw lastError ?? new Error("Reddit request failed.");
}

function mapPosts(payload: RedditListingResponse): ScrapedRedditPost[] {
  return (payload.data?.children ?? [])
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
}

export async function scrapeRedditPublicProfile(
  usernameInput: string,
): Promise<ScrapedRedditProfile> {
  const username = cleanRedditUsername(usernameInput);
  if (!username) {
    throw new Error("Reddit username is required.");
  }

  const encoded = encodeURIComponent(username);
  const about = await fetchRedditPaths<RedditAboutResponse>(
    `/user/${encoded}/about`,
    `/user/${encoded}/about.json`,
  );
  const postsPayload = await fetchRedditPaths<RedditListingResponse>(
    `/user/${encoded}/submitted?limit=50&raw_json=1`,
    `/user/${encoded}/submitted.json?limit=50&raw_json=1`,
  );

  const posts = mapPosts(postsPayload);
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
