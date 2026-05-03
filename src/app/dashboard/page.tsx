import { ArrowUpRight, MessageSquareMore, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  { title: "Total Revenue", value: "$48,920", change: "+12.4% MoM", icon: TrendingUp },
  { title: "Active Models", value: "7", change: "+1 this month", icon: Users },
  { title: "Total Fans", value: "9,842", change: "+6.8% weekly", icon: Users },
  { title: "Messages Today", value: "1,276", change: "84 pending reply", icon: MessageSquareMore },
];

const recentActivity = [
  "New fan tagged as high spender for @model_jade.",
  "Revenue update synced for @luna.night (+$2,450).",
  "3 new post slots added to next week content calendar.",
  "Warm-up TikTok account reached 4.2% engagement.",
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot of your agency performance for today.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardHeader className="pb-2">
                <CardDescription>{metric.title}</CardDescription>
                <CardTitle className="text-2xl">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{metric.change}</span>
                <Icon className="h-4 w-4" />
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Performance highlights for your top models.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">@model_jade</p>
                <p className="text-xs text-muted-foreground">Revenue this week: $6,480</p>
              </div>
              <Badge className="gap-1">
                Top performer <ArrowUpRight className="h-3 w-3" />
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">@luna.night</p>
                <p className="text-xs text-muted-foreground">New subscribers: 134</p>
              </div>
              <Badge variant="secondary">Growth +18%</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">@aria.vibes</p>
                <p className="text-xs text-muted-foreground">Messages response time: 4m 12s</p>
              </div>
              <Badge variant="outline">On target</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest team and campaign events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((item) => (
              <p key={item} className="text-sm text-muted-foreground">
                {item}
              </p>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
