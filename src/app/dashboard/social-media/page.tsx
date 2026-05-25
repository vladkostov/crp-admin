import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SocialMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Social Media Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage social platforms and connected monetization accounts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Fanvue
          </CardTitle>
          <CardDescription>
            Connect Fanvue accounts, sync revenue, and track fan growth.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard/social-media/fanvue"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Open Fanvue Dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
