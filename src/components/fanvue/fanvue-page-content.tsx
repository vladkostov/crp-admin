"use client";

import { useState } from "react";
import { Plus, RefreshCw, Sparkles } from "lucide-react";
import { AddAccountDialog } from "@/components/fanvue/add-account-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatLastSync } from "@/lib/fanvue/format";
import type { FanvueAccount, FanvueAccountStatus } from "@/lib/fanvue/types";

type FanvuePageContentProps = {
  initialAccounts: FanvueAccount[];
};

function statusVariant(status: FanvueAccountStatus) {
  if (status === "connected") return "default";
  if (status === "syncing") return "secondary";
  if (status === "error") return "destructive";
  return "outline";
}

export function FanvuePageContent({ initialAccounts }: FanvuePageContentProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  async function handleSync(accountId: string) {
    setSyncingId(accountId);
    setFeedback(null);

    setAccounts((prev) =>
      prev.map((account) =>
        account.id === accountId ? { ...account, status: "syncing" } : account,
      ),
    );

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180_000);

      const response = await fetch("/api/fanvue/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const payload = await response.json();

      if (!response.ok) {
        setAccounts((prev) =>
          prev.map((account) =>
            account.id === accountId ? { ...account, status: "error" } : account,
          ),
        );
        setFeedback({ type: "error", message: payload.error ?? "Sync failed." });
        return;
      }

      setAccounts((prev) =>
        prev.map((account) =>
          account.id === accountId ? payload.account : account,
        ),
      );
      const sourceLabel =
        payload.stats?.source === "api" ? "Fanvue API" : "browser scrape";
      setFeedback({
        type: "success",
        message: `${payload.message ?? "Fanvue account synced successfully."} (source: ${sourceLabel})`,
      });
    } catch (error) {
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === accountId ? { ...account, status: "error" } : account,
        ),
      );
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "Sync timed out. Try again — Fanvue sync can take 1–2 minutes."
          : "Network error while syncing Fanvue account.";
      setFeedback({ type: "error", message });
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Fanvue Accounts</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage connected Fanvue accounts and trigger manual syncs.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Fanvue Account
        </Button>
      </div>

      {feedback ? (
        <div
          className={
            feedback.type === "success"
              ? "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
              : "rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          }
        >
          {feedback.message}
        </div>
      ) : null}

      {accounts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Fanvue accounts yet</CardTitle>
            <CardDescription>
              Add your first Fanvue account to start tracking revenue and fans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Fanvue Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => {
            const isSyncing = syncingId === account.id || account.status === "syncing";

            return (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{account.account_name}</CardTitle>
                    <CardDescription>@{account.fanvue_username.replace(/^@/, "")}</CardDescription>
                  </div>
                  <Badge variant={statusVariant(account.status)}>{account.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Username</p>
                      <p className="font-medium">@{account.fanvue_username.replace(/^@/, "")}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Last Sync</p>
                      <p className="text-sm font-medium">{formatLastSync(account.last_sync_at)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Revenue (This Month)</p>
                      <p className="font-medium">{formatCurrency(account.revenue_this_month)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Fans</p>
                      <p className="font-medium">{account.fans_count.toLocaleString()}</p>
                    </div>
                  </div>

                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => handleSync(account.id)}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Syncing Fanvue (1–2 min)..." : "Sync Fanvue Now"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AddAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAccountAdded={(account) => {
          setAccounts((prev) => [account, ...prev]);
          setFeedback({
            type: "success",
            message: `Added @${account.fanvue_username.replace(/^@/, "")} successfully.`,
          });
        }}
      />
    </div>
  );
}
