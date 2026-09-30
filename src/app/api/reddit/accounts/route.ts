import { NextResponse } from "next/server";
import { cleanRedditUsername } from "@/lib/reddit/format";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const accountName = String(body.accountName ?? "").trim();
    const redditUsername = cleanRedditUsername(String(body.redditUsername ?? ""));
    const notes = String(body.notes ?? "").trim() || null;

    if (!accountName || !redditUsername) {
      return NextResponse.json(
        { error: "Account name and Reddit username are required." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("reddit_accounts")
      .insert({
        account_name: accountName,
        reddit_username: redditUsername,
        notes,
        status: "connected",
      })
      .select(
        "id, account_name, reddit_username, notes, status, posts_count, chats_count, comment_karma, link_karma, total_karma, last_sync_at, created_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ account: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create Reddit account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = new URL(request.url).searchParams.get("accountId")?.trim();
    if (!accountId) {
      return NextResponse.json({ error: "accountId is required." }, { status: 400 });
    }

    const { error } = await supabase.from("reddit_accounts").delete().eq("id", accountId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete Reddit account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
