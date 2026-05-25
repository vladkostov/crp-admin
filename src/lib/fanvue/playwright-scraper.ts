import type { Page } from "playwright-core";
import { humanDelay, launchFanvueBrowser } from "@/lib/fanvue/browser";
import { FanvueSyncError } from "@/lib/fanvue/errors";
import { logFanvueSync, logFanvueSyncError } from "@/lib/fanvue/logger";
import { extractMetricsFromText } from "@/lib/fanvue/parse-metrics";
import type { FanvueScrapeResult, FanvueScrapedPost } from "@/lib/fanvue/scrape-types";

const LOGIN_URLS = [
  "https://www.fanvue.com/signin",
  "https://fanvue.com/signin",
  "https://www.fanvue.com/login",
  "https://fanvue.com/login",
];

const CREATOR_URLS = [
  "https://www.fanvue.com/creator",
  "https://www.fanvue.com/dashboard",
  "https://www.fanvue.com/home",
  "https://www.fanvue.com/insights",
  "https://www.fanvue.com/analytics",
  "https://www.fanvue.com/earnings",
];

const BLOCKED_AUTH_PATHS = ["/signin", "/signup", "/login", "/sign-in", "forgot-password"];

const EMAIL_SELECTORS = [
  'input[type="email"]',
  'input[name="email"]',
  'input[autocomplete="email"]',
  "#email",
];

const PASSWORD_SELECTORS = [
  'input[type="password"]',
  'input[name="password"]',
  'input[autocomplete="current-password"]',
  "#password",
];

const SUBMIT_SELECTORS = [
  'button:has-text("Sign In")',
  'button:has-text("Sign in")',
  'button:has-text("Log in")',
  'button:has-text("Login")',
  'button[type="submit"]',
];

function isAuthWall(url: string) {
  const lower = url.toLowerCase();
  return BLOCKED_AUTH_PATHS.some((part) => lower.includes(part));
}

async function fillFirstVisible(page: Page, selectors: string[], value: string) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0 && (await locator.isVisible().catch(() => false))) {
      await locator.click({ delay: 80 });
      await humanDelay(200, 500);
      await locator.fill(value, { timeout: 10_000 });
      return;
    }
  }
  throw new FanvueSyncError("Could not find login input fields on Fanvue.", "LOGIN_FAILED");
}

async function clickFirstVisible(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) > 0 && (await locator.isEnabled().catch(() => false))) {
      await locator.click({ delay: 100 });
      return;
    }
  }
  throw new FanvueSyncError("Could not find login submit button on Fanvue.", "LOGIN_FAILED");
}

async function detectTwoFactor(page: Page) {
  const bodyText = (await page.locator("body").innerText().catch(() => "")).toLowerCase();
  const has2faInput =
    (await page
      .locator(
        'input[name*="otp"], input[name*="code"], input[autocomplete="one-time-code"], input[inputmode="numeric"]',
      )
      .count()) > 0;

  if (
    has2faInput ||
    bodyText.includes("two-factor") ||
    bodyText.includes("2fa") ||
    bodyText.includes("verification code") ||
    bodyText.includes("authenticator")
  ) {
    throw new FanvueSyncError(
      "Fanvue requested 2FA. Disable 2FA for this account or use a Fanvue API token instead.",
      "TWO_FACTOR_REQUIRED",
    );
  }
}

async function assertAuthenticated(page: Page) {
  const url = page.url();
  if (isAuthWall(url)) {
    throw new FanvueSyncError(
      "Fanvue login did not complete (still on sign-in page). Verify email/password.",
      "LOGIN_FAILED",
    );
  }

  const bodyText = (await page.locator("body").innerText().catch(() => "")).toLowerCase();
  const looksLikePublicLanding =
    bodyText.includes("fastest growing community") ||
    bodyText.includes("sign up as a fan") ||
    bodyText.includes("become a creator") && !bodyText.includes("subscribers");

  const looksLikeCreatorArea =
    bodyText.includes("subscriber") ||
    bodyText.includes("earnings") ||
    bodyText.includes("analytics") ||
    bodyText.includes("insights") ||
    bodyText.includes("dashboard");

  if (looksLikePublicLanding && !looksLikeCreatorArea) {
    throw new FanvueSyncError(
      "Fanvue sync reached public pages, not your creator dashboard. Use a Fanvue API token for reliable sync.",
      "LOGIN_FAILED",
    );
  }
}

async function openLoginPage(page: Page) {
  let lastError: unknown;

  for (const url of LOGIN_URLS) {
    try {
      logFanvueSync("Navigating to login", { url });
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });

      if (response && response.status() < 400) {
        await humanDelay(900, 1600);
        return;
      }
    } catch (error) {
      lastError = error;
    }
  }

  logFanvueSyncError("Login page navigation failed", lastError);
  throw new FanvueSyncError("Unable to open Fanvue login page.", "LOGIN_FAILED");
}

async function loginWithCredentials(page: Page, email: string, password: string) {
  await openLoginPage(page);
  await fillFirstVisible(page, EMAIL_SELECTORS, email);
  await humanDelay(400, 900);
  await fillFirstVisible(page, PASSWORD_SELECTORS, password);
  await humanDelay(500, 1100);
  await clickFirstVisible(page, SUBMIT_SELECTORS);

  await page
    .waitForURL((url) => !isAuthWall(url.toString()), { timeout: 45_000 })
    .catch(() => undefined);
  await page.waitForLoadState("networkidle", { timeout: 45_000 }).catch(() => undefined);
  await humanDelay(1500, 2500);
  await detectTwoFactor(page);
  await assertAuthenticated(page);
}

async function navigateToCreatorArea(page: Page) {
  for (const url of CREATOR_URLS) {
    try {
      logFanvueSync("Opening creator area", { url });
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await humanDelay(900, 1600);
      if (!isAuthWall(page.url())) {
        await assertAuthenticated(page);
        return;
      }
    } catch (error) {
      if (error instanceof FanvueSyncError) throw error;
    }
  }

  if (!isAuthWall(page.url())) {
    await assertAuthenticated(page);
    return;
  }

  throw new FanvueSyncError(
    "Could not open Fanvue creator dashboard after login.",
    "SCRAPE_FAILED",
  );
}

async function scrapePosts(page: Page): Promise<FanvueScrapedPost[]> {
  const postUrls = [
    "https://www.fanvue.com/posts",
    "https://www.fanvue.com/content",
    "https://www.fanvue.com/creator/posts",
  ];

  for (const url of postUrls) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await humanDelay(700, 1300);
      if (!isAuthWall(page.url())) break;
    } catch {
      // continue
    }
  }

  await assertAuthenticated(page);

  const posts = await page.evaluate(() => {
    const results: Array<{
      externalId: string;
      title: string;
      likes: number;
      comments: number;
      postedAt: string | null;
    }> = [];

    const cardSelectors = ["article", '[data-testid*="post"]', ".post-card", "li"];
    const cards: Element[] = [];

    for (const selector of cardSelectors) {
      const found = Array.from(document.querySelectorAll(selector));
      if (found.length >= 2) {
        cards.push(...found.slice(0, 12));
        break;
      }
    }

    const parseCount = (text: string, label: string) => {
      const regex = new RegExp(`(\\d[\\d,]*)\\s*${label}`, "i");
      const match = text.match(regex);
      return match ? Number(match[1].replace(/,/g, "")) : 0;
    };

    cards.forEach((card, index) => {
      const text = (card.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!text || text.length < 8) return;

      const titleNode =
        card.querySelector("h1,h2,h3,h4,p,span") ?? card.firstElementChild ?? card;
      const title = (titleNode.textContent ?? `Post ${index + 1}`).trim().slice(0, 180);
      const likes = parseCount(text, "likes?") || parseCount(text, "like");
      const comments = parseCount(text, "comments?") || parseCount(text, "comment");

      if (title.toLowerCase().includes("sign up") || title.toLowerCase().includes("become a creator")) {
        return;
      }

      results.push({
        externalId: `post-${index + 1}-${title.slice(0, 24).replace(/\W+/g, "-").toLowerCase()}`,
        title,
        likes,
        comments,
        postedAt: null,
      });
    });

    return results.slice(0, 10);
  });

  return posts;
}

async function scrapeProfileStats(page: Page) {
  await assertAuthenticated(page);

  const pageText = await page.locator("body").innerText({ timeout: 20_000 }).catch(() => "");
  const metrics = extractMetricsFromText(pageText);

  const profileStats = await page.evaluate(() => {
    const stats: Record<string, string | number> = {};
    const nodes = Array.from(document.querySelectorAll("h1,h2,h3,h4,p,span,div"));

    nodes.forEach((node) => {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!text || text.length > 80) return;

      const labeledValue = text.match(
        /^([A-Za-z][A-Za-z\s]{2,30})\s*[:\-]?\s*([\d,$%.]+[kKmM]?\+?)$/,
      );
      if (labeledValue) {
        const label = labeledValue[1].trim().toLowerCase().replace(/\s+/g, "_");
        stats[label] = labeledValue[2];
      }
    });

    return stats;
  });

  return { ...metrics, profileStats };
}

export async function scrapeFanvueWithPlaywright(input: {
  email: string;
  password: string;
}): Promise<FanvueScrapeResult> {
  const browser = await launchFanvueBrowser();
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-US",
  });

  const page = await context.newPage();

  try {
    logFanvueSync("Starting Playwright login");
    await loginWithCredentials(page, input.email, input.password);
    await navigateToCreatorArea(page);

    logFanvueSync("Scraping profile metrics", { url: page.url() });
    const profile = await scrapeProfileStats(page);

    logFanvueSync("Scraping recent posts");
    const posts = await scrapePosts(page);

    const hasRealFans = profile.fansCount > 0;
    const hasRealRevenue = profile.revenueThisMonth > 0;

    if (!hasRealFans && !hasRealRevenue) {
      throw new FanvueSyncError(
        "Could not read real Fanvue stats. Fanvue likely blocks headless login — add a Fanvue API token (recommended).",
        "SCRAPE_FAILED",
      );
    }

    return {
      fansCount: profile.fansCount,
      revenueRecent: profile.revenueRecent,
      revenueThisMonth: profile.revenueThisMonth,
      profileStats: {
        ...profile.profileStats,
        synced_from_url: page.url(),
      },
      posts,
      source: "playwright",
    };
  } catch (error) {
    logFanvueSyncError("Playwright scrape failed", error);
    if (error instanceof FanvueSyncError) throw error;
    throw new FanvueSyncError(
      error instanceof Error ? error.message : "Playwright scrape failed.",
      "SCRAPE_FAILED",
    );
  } finally {
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
    logFanvueSync("Browser closed");
  }
}
