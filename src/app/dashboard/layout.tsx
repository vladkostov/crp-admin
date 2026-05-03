import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardHeader email={user.email ?? "team member"} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <footer className="border-t px-4 py-3 md:px-6">
          <form action={signOut} className="flex justify-end">
            <Button variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </footer>
      </div>
    </div>
  );
}
