import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FansPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fans / Subscribers CRM</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This module is scaffolded. Next step: searchable fans table, tags, notes, and spending
        profile by model.
      </CardContent>
    </Card>
  );
}
