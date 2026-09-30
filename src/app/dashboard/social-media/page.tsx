import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.07 7.48c.38.06.72.25.97.54a1.5 1.5 0 0 1-.15 2.22c.04.25.06.51.06.76 0 2.69-3.13 4.88-7 4.88s-7-2.19-7-4.88c0-.25.02-.51.06-.76a1.5 1.5 0 0 1-.15-2.22 1.5 1.5 0 0 1 2.07-.13c.86-.56 1.97-.95 3.2-1.1l.66-3.12a.6.6 0 0 1 .74-.45l2.35.52a1.25 1.25 0 1 1 .24 1.18l-2.07-.46-.53 2.5c1.2.16 2.28.55 3.13 1.1.3-.19.66-.29 1.04-.24z" />
    </svg>
  );
}

export default function SocialMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Social Media Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage traffic platforms and connected monetization accounts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RedditIcon className="h-5 w-5 text-orange-500" />
              Reddit
            </CardTitle>
            <CardDescription>
              Track posts, posting times, karma, and chat counts for traffic accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/dashboard/social-media/reddit"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              Open Reddit Dashboard
            </Link>
          </CardContent>
        </Card>

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
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Open Fanvue Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
