"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("fetch failed") ||
    lower.includes("network request failed")
  ) {
    return "Cannot reach Supabase (Failed to fetch). Open Supabase Dashboard and click Resume if the project is paused, then try again.";
  }

  if (lower.includes("missing supabase")) {
    return message;
  }

  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAuth(event: FormEvent<HTMLFormElement>, mode: "sign-in" | "sign-up") {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "").trim();
      const supabase = createClient();

      const result =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (result.error) {
        setError(friendlyAuthError(result.error));
        setLoading(false);
        return;
      }

      if (mode === "sign-up" && !result.data.session) {
        setSuccess("Account created. Check your email and confirm the account, then sign in.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(friendlyAuthError(err));
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>OnlyFans CRM Login</CardTitle>
          <CardDescription>
            Secure access for your management team. Use sign in for existing accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sign-in">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sign-in">Sign in</TabsTrigger>
              <TabsTrigger value="sign-up">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="sign-in">
              <form className="mt-4 space-y-4" onSubmit={(event) => handleAuth(event, "sign-in")}>
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" name="password" type="password" required />
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="sign-up">
              <form className="mt-4 space-y-4" onSubmit={(event) => handleAuth(event, "sign-up")}>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" name="password" type="password" minLength={6} required />
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
