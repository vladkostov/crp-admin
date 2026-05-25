"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  UserCircle2,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavEntry =
  | NavLink
  | {
      label: string;
      href: string;
      icon: LucideIcon;
      children: NavLink[];
    };

const navItems: NavEntry[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Models", href: "/dashboard/models", icon: UserCircle2 },
  {
    label: "Social Media",
    href: "/dashboard/social-media",
    icon: Users,
    children: [
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
