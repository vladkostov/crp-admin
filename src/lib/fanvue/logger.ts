const PREFIX = "[fanvue-sync]";

export function logFanvueSync(step: string, details?: Record<string, unknown>) {
  if (details) {
    console.log(PREFIX, step, details);
    return;
  }
  console.log(PREFIX, step);
}

export function logFanvueSyncError(step: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(PREFIX, step, message);
}
