export type FanvueScrapedPost = {
  externalId: string;
  title: string;
  likes: number;
  comments: number;
  postedAt: string | null;
};

export type FanvueScrapeResult = {
  fansCount: number;
  revenueRecent: number;
  revenueThisMonth: number;
  profileStats: Record<string, string | number>;
  posts: FanvueScrapedPost[];
  source: "playwright" | "api";
};
