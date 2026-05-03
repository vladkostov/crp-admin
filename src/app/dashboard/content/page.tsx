import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContentPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content & Scheduling</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This module is scaffolded. Next step: content library with media references and a posting
        calendar planner.
      </CardContent>
    </Card>
  );
}
