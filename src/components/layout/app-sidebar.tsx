"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  UserCircle2,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type NavIcon = ComponentType<{ className?: string }>;

type NavLink = {
  label: string;
  href: string;
  icon: NavIcon;
};

type NavEntry =
  | NavLink
  | {
      label: string;
      href: string;
      icon: NavIcon;
      children: NavLink[];
    };

function RedditNavIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 9.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zm-9 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zm1.1 3.8c.7.55 1.75.9 3.4.9s2.7-.35 3.4-.9a.6.6 0 0 1 .72.96c-1 .79-2.35 1.14-4.12 1.14s-3.12-.35-4.12-1.14a.6.6 0 1 1 .72-.96z" />
    </svg>
  );
}

const navItems: NavEntry[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Models", href: "/dashboard/models", icon: UserCircle2 },
  {
    label: "Social Media",
    href: "/dashboard/social-media",
    icon: Users,
    children: [
      {
        label: "Reddit",
        href: "/dashboard/social-media/reddit",
        icon: RedditNavIcon,
      },
      {
        label: "Fanvue",
        href: "/dashboard/social-media/fanvue",
        icon: Sparkles,
      },
    ],
  },
  { label: "Traffic & Engagement", href: "/dashboard/traffic", icon: BarChart3 },
  { label: "Fans CRM", href: "/dashboard/fans", icon: Users },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Content Calendar", href: "/dashboard/content", icon: CalendarDays },
  { label: "Revenue", href: "/dashboard/revenue", icon: Wallet },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinkItem({ item, pathname }: { item: NavLink; pathname: string }) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r bg-sidebar md:block">
      <div className="flex h-16 items-center border-b px-6">
        <p className="text-lg font-semibold tracking-tight">OFM CRM</p>
      </div>
      <ScrollArea className="h-[calc(100vh-4rem)] px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            if ("children" in item) {
              const Icon = item.icon;
              const parentActive = isActive(pathname, item.href);

              return (
                <div key={item.href} className="space-y-1">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      parentActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                  <div className="ml-4 space-y-1 border-l border-sidebar-border pl-2">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(pathname, child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            childActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                          )}
                        >
                          <ChildIcon className="h-4 w-4" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return <NavLinkItem key={item.href} item={item} pathname={pathname} />;
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
