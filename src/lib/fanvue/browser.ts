import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium, type Browser } from "playwright-core";
import { logFanvueSync } from "@/lib/fanvue/logger";

export async function launchFanvueBrowser(): Promise<Browser> {
  const isVercel = Boolean(process.env.VERCEL);

  if (isVercel) {
    logFanvueSync("Launching headless Chromium (serverless)");
    return playwrightChromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  logFanvueSync("Launching headless Chromium (local)");
  const { chromium: localChromium } = await import("playwright");
  return localChromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

export function humanDelay(minMs = 600, maxMs = 1400) {
  const duration = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, duration));
}
