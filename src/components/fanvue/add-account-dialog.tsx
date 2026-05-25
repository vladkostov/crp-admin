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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FanvueAccount } from "@/lib/fanvue/types";

type AddAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountAdded: (account: FanvueAccount) => void;
};

export function AddAccountDialog({
  open,
  onOpenChange,
  onAccountAdded,
}: AddAccountDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"password" | "api">("password");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/fanvue/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountName: formData.get("accountName"),
        fanvueUsername: formData.get("fanvueUsername"),
        email: formData.get("email"),
        password: authMode === "password" ? formData.get("password") : "",
        apiKey: authMode === "api" ? formData.get("apiKey") : "",
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to add Fanvue account.");
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
          <DialogTitle>Add Fanvue Account</DialogTitle>
          <DialogDescription>
            Connect a Fanvue account for syncing revenue and fan metrics. For accurate real
            data, use a Fanvue API token (Developer Portal). Password login uses browser sync and
            may be blocked by Fanvue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountName">Account / Model Name</Label>
            <Input id="accountName" name="accountName" placeholder="e.g. Jade Main" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fanvueUsername">Fanvue Username</Label>
            <Input
              id="fanvueUsername"
              name="fanvueUsername"
              placeholder="@username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="account@email.com" />
          </div>

          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "password" | "api")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="api">API Key</TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={6}
                required={authMode === "password"}
              />
            </TabsContent>

            <TabsContent value="api" className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder="OAuth access token from Fanvue Developer Portal"
                required={authMode === "api"}
              />
            </TabsContent>
          </Tabs>

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
