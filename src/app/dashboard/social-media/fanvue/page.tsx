import { FanvuePageContent } from "@/components/fanvue/fanvue-page-content";
import { createClient } from "@/lib/supabase/server";
import type { FanvueAccount } from "@/lib/fanvue/types";

export default async function FanvuePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fanvue_accounts")
    .select(
      "id, account_name, fanvue_username, email, status, last_sync_at, revenue_this_month, fans_count, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load Fanvue accounts:", error.message);
  }

  return <FanvuePageContent initialAccounts={(data ?? []) as FanvueAccount[]} />;
}
