"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Models", href: "/dashboard/models" },
  { label: "Social Media", href: "/dashboard/social-media" },
  { label: "Traffic", href: "/dashboard/traffic" },
  { label: "Fans", href: "/dashboard/fans" },
  { label: "Messages", href: "/dashboard/messages" },
  { label: "Content", href: "/dashboard/content" },
  { label: "Revenue", href: "/dashboard/revenue" },
];

export function DashboardHeader({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" />}>
            <Menu className="h-4 w-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>OFM CRM</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-1">
              {mobileNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition-colors",
                    pathname === item.href
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        <p className="font-semibold">OFM CRM</p>
      </div>
      <div className="hidden md:block">
        <p className="text-sm text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>
      <ThemeToggle />
    </header>
  );
}
