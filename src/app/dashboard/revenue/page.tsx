import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RevenuePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Analytics</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This module is scaffolded. Next step: model-level revenue tracking and consolidated monthly
        reports.
      </CardContent>
    </Card>
  );
}
