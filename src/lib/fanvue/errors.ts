export class FanvueSyncError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "MISSING_CREDENTIALS"
      | "LOGIN_FAILED"
      | "TWO_FACTOR_REQUIRED"
      | "SCRAPE_FAILED"
      | "API_FAILED"
      | "UNKNOWN",
  ) {
    super(message);
    this.name = "FanvueSyncError";
  }
}
