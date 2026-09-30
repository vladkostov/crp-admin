"use client";

import { useMemo, useState } from "react";
import { ExternalLink, MessageSquare, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AddRedditAccountDialog } from "@/components/reddit/add-account-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLastSync, formatPostedAt } from "@/lib/reddit/format";
import type { RedditAccount, RedditAccountStatus, RedditChat, RedditPost } from "@/lib/reddit/types";

type RedditPageContentProps = {
  initialAccounts: RedditAccount[];
  initialPosts: RedditPost[];
  initialChats: RedditChat[];
};

function statusVariant(status: RedditAccountStatus) {
  if (status === "connected") return "default";
  if (status === "syncing") return "secondary";
  if (status === "error") return "destructive";
  return "outline";
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.07 7.48c.38.06.72.25.97.54a1.5 1.5 0 0 1-.15 2.22c.04.25.06.51.06.76 0 2.69-3.13 4.88-7 4.88s-7-2.19-7-4.88c0-.25.02-.51.06-.76a1.5 1.5 0 0 1-.15-2.22 1.5 1.5 0 0 1 2.07-.13c.86-.56 1.97-.95 3.2-1.1l.66-3.12a.6.6 0 0 1 .74-.45l2.35.52a1.25 1.25 0 1 1 .24 1.18l-2.07-.46-.53 2.5c1.2.16 2.28.55 3.13 1.1.3-.19.66-.29 1.04-.24zM9.25 12.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm5.5 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm-5.7 3.6c.7.62 1.7.98 2.95.98s2.25-.36 2.95-.98a.5.5 0 1 0-.66-.75c-.5.44-1.28.73-2.29.73s-1.79-.29-2.29-.73a.5.5 0 1 0-.66.75z" />
    </svg>
  );
}

export function RedditPageContent({
  initialAccounts,
  initialPosts,
  initialChats,
}: RedditPageContentProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [posts, setPosts] = useState(initialPosts);
  const [chats, setChats] = useState(initialChats);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    initialAccounts[0]?.id ?? null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  const selectedPosts = useMemo(
    () => posts.filter((post) => post.account_id === selectedAccountId),
    [posts, selectedAccountId],
  );

  const selectedChats = useMemo(
    () => chats.filter((chat) => chat.account_id === selectedAccountId),
    [chats, selectedAccountId],
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
      const response = await fetch("/api/reddit/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
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
        prev.map((account) => (account.id === accountId ? payload.account : account)),
      );
      setPosts((prev) => [
        ...(payload.posts ?? []),
        ...prev.filter((post) => post.account_id !== accountId),
      ]);
      setChats((prev) => [
        ...(payload.chats ?? []),
        ...prev.filter((chat) => chat.account_id !== accountId),
      ]);
      setSelectedAccountId(accountId);
      setFeedback({
        type: "success",
        message: payload.message ?? "Reddit account synced successfully.",
      });
    } catch {
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === accountId ? { ...account, status: "error" } : account,
        ),
      );
      setFeedback({ type: "error", message: "Network error while syncing Reddit account." });
    } finally {
      setSyncingId(null);
    }
  }

  async function handleDelete(accountId: string, accountName: string) {
    const confirmed = window.confirm(`Delete Reddit account "${accountName}"?`);
    if (!confirmed) return;

    setDeletingId(accountId);
    setFeedback(null);

    try {
      const response = await fetch(`/api/reddit/accounts?accountId=${accountId}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        setFeedback({ type: "error", message: payload.error ?? "Failed to delete account." });
        return;
      }

      setAccounts((prev) => prev.filter((account) => account.id !== accountId));
      setPosts((prev) => prev.filter((post) => post.account_id !== accountId));
      setChats((prev) => prev.filter((chat) => chat.account_id !== accountId));
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);
      }
      setFeedback({ type: "success", message: `Deleted ${accountName}.` });
    } catch {
      setFeedback({ type: "error", message: "Network error while deleting account." });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <RedditIcon className="h-5 w-5 text-orange-500" />
            <h1 className="text-2xl font-semibold tracking-tight">Reddit Accounts</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Track posts, posting times, karma, and (later) inbox chats for traffic accounts.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Reddit Account
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
            <CardTitle>No Reddit accounts yet</CardTitle>
            <CardDescription>
              Add your first Reddit account to start tracking posts and engagement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Reddit Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => {
            const isSyncing = syncingId === account.id || account.status === "syncing";
            const isSelected = selectedAccountId === account.id;

            return (
              <Card
                key={account.id}
                className={isSelected ? "ring-1 ring-primary/40" : undefined}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => setSelectedAccountId(account.id)}
                  >
                    <CardTitle className="text-lg">{account.account_name}</CardTitle>
                    <CardDescription>u/{account.reddit_username}</CardDescription>
                  </button>
                  <Badge variant={statusVariant(account.status)}>{account.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Posts synced</p>
                      <p className="font-medium">{account.posts_count.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Chats / DMs</p>
                      <p className="font-medium">{account.chats_count.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Total karma</p>
                      <p className="font-medium">{account.total_karma.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Link / Comment</p>
                      <p className="font-medium">
                        {account.link_karma.toLocaleString()} / {account.comment_karma.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Last Sync</p>
                      <p className="text-sm font-medium">{formatLastSync(account.last_sync_at)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => handleSync(account.id)}
                      disabled={isSyncing || deletingId === account.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                      {isSyncing ? "Syncing Reddit..." : "Sync Reddit Now"}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => setSelectedAccountId(account.id)}
                    >
                      View posts & chats
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto"
                      onClick={() => handleDelete(account.id, account.account_name)}
                      disabled={isSyncing || deletingId === account.id}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingId === account.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedAccount ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Posts for u/{selectedAccount.reddit_username}</CardTitle>
              <CardDescription>
                Latest synced posts with subreddit, score, comments, and post time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No posts yet. Click Sync Reddit Now to pull public posts.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subreddit</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="max-w-[280px]">
                          <p className="font-medium leading-snug">{post.title}</p>
                          {post.selftext ? (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {post.selftext}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell>r/{post.subreddit ?? "unknown"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatPostedAt(post.posted_at)}
                        </TableCell>
                        <TableCell>{post.score.toLocaleString()}</TableCell>
                        <TableCell>{post.comments_count.toLocaleString()}</TableCell>
                        <TableCell>
                          {post.permalink ? (
                            <a
                              href={post.permalink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              Open <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chats / DMs for u/{selectedAccount.reddit_username}
              </CardTitle>
              <CardDescription>
                Chat count currently: {selectedAccount.chats_count}. Full inbox sync needs Reddit
                OAuth (next step). Public Reddit API cannot read private messages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedChats.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No chat threads synced yet. After OAuth is connected, inbox threads will appear
                  here with peer username, subject, and message counts.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peer</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Last message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedChats.map((chat) => (
                      <TableRow key={chat.id}>
                        <TableCell>{chat.peer_username ?? "Unknown"}</TableCell>
                        <TableCell>{chat.subject ?? "—"}</TableCell>
                        <TableCell>{chat.message_count}</TableCell>
                        <TableCell>{formatPostedAt(chat.last_message_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <AddRedditAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAccountAdded={(account) => {
          setAccounts((prev) => [account, ...prev]);
          setSelectedAccountId(account.id);
          setFeedback({
            type: "success",
            message: `Added u/${account.reddit_username}. Click Sync Reddit Now to pull posts.`,
          });
        }}
      />
    </div>
  );
}
