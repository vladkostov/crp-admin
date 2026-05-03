"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  UserCircle2,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Models", href: "/dashboard/models", icon: UserCircle2 },
  { label: "Social Media", href: "/dashboard/social-media", icon: Users },
  { label: "Traffic & Engagement", href: "/dashboard/traffic", icon: BarChart3 },
  { label: "Fans CRM", href: "/dashboard/fans", icon: Users },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Content Calendar", href: "/dashboard/content", icon: CalendarDays },
  { label: "Revenue", href: "/dashboard/revenue", icon: Wallet },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r bg-sidebar md:block">
      <div className="flex h-16 items-center border-b px-6">
        <p className="text-lg font-semibold tracking-tight">OFM CRM</p>
      </div>
      <ScrollArea className="h-[calc(100vh-4rem)] px-3 py-4">
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
