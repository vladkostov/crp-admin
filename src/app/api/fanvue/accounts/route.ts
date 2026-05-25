import { NextResponse } from "next/server";
import { encryptSecret } from "@/lib/fanvue/crypto";
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
    const fanvueUsername = String(body.fanvueUsername ?? "").trim();
    const email = String(body.email ?? "").trim() || null;
    const password = String(body.password ?? "").trim();
    const apiKey = String(body.apiKey ?? "").trim();

    if (!accountName || !fanvueUsername) {
      return NextResponse.json(
        { error: "Account name and Fanvue username are required." },
        { status: 400 },
      );
    }

    if (!password && !apiKey) {
      return NextResponse.json(
        { error: "Provide a password or API key." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("fanvue_accounts")
      .insert({
        account_name: accountName,
        fanvue_username: fanvueUsername,
        email,
        password_encrypted: password ? encryptSecret(password) : null,
        api_key_encrypted: apiKey ? encryptSecret(apiKey) : null,
        status: "connected",
      })
      .select(
        "id, account_name, fanvue_username, email, status, last_sync_at, revenue_this_month, fans_count, created_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ account: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create Fanvue account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
