export function parseNumber(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseMoney(value: string) {
  const match = value.match(/([\d,]+(?:\.\d{1,2})?)/);
  return match ? parseNumber(match[1]) : 0;
}

export function extractMetricsFromText(pageText: string) {
  const fansPatterns = [
    /([\d,]+)\s*(?:total\s+)?(?:fans|subscribers|followers)/i,
    /(?:fans|subscribers|followers)\s*[:\-]?\s*([\d,]+)/i,
  ];

  let fansCount = 0;
  for (const pattern of fansPatterns) {
    const match = pageText.match(pattern);
    if (match?.[1]) {
      fansCount = parseNumber(match[1]);
      if (fansCount > 0) break;
    }
  }

  const moneyMatches = [...pageText.matchAll(/\$\s*([\d,]+(?:\.\d{1,2})?)/g)].map((m) =>
    parseNumber(m[1]),
  );

  const monthRevenueMatch = pageText.match(
    /(?:this month|monthly|mtd)[^\d$]{0,30}\$?\s*([\d,]+(?:\.\d{1,2})?)/i,
  );
  const revenueThisMonth = monthRevenueMatch
    ? parseNumber(monthRevenueMatch[1])
    : (moneyMatches[moneyMatches.length - 1] ?? 0);

  const recentRevenueMatch = pageText.match(
    /(?:recent|today|last 7 days|earnings)[^\d$]{0,30}\$?\s*([\d,]+(?:\.\d{1,2})?)/i,
  );
  const revenueRecent = recentRevenueMatch
    ? parseNumber(recentRevenueMatch[1])
    : (moneyMatches[0] ?? revenueThisMonth);

  return {
    fansCount,
    revenueRecent,
    revenueThisMonth: revenueThisMonth || revenueRecent,
  };
}
