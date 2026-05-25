import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    engine: "fanvue-real-sync",
    version: "2.1.0",
    placeholderRemoved: true,
    features: ["fanvue-api", "playwright-fallback", "delete-account"],
  });
}
