import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrafficPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic & Engagement</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This module is scaffolded. Next step: ingest follower and engagement metrics and display
        per-model analytics.
      </CardContent>
    </Card>
  );
}
