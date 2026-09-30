"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RedditAccount } from "@/lib/reddit/types";

type AddAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountAdded: (account: RedditAccount) => void;
};

export function AddRedditAccountDialog({
  open,
  onOpenChange,
  onAccountAdded,
}: AddAccountDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/reddit/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountName: formData.get("accountName"),
        redditUsername: formData.get("redditUsername"),
        notes: formData.get("notes"),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to add Reddit account.");
      setLoading(false);
      return;
    }

    onAccountAdded(payload.account);
    onOpenChange(false);
    setLoading(false);
    event.currentTarget.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Reddit Account</DialogTitle>
          <DialogDescription>
            Track posting activity and engagement for a Reddit account. Sync pulls public posts
            and karma. Inbox/chats will need Reddit OAuth later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountName">Account / Model Name</Label>
            <Input id="accountName" name="accountName" placeholder="e.g. Jade Reddit Main" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="redditUsername">Reddit Username</Label>
            <Input
              id="redditUsername"
              name="redditUsername"
              placeholder="u/username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" placeholder="Warm-up account, niche, etc." />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
