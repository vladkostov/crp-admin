import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MessagesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Messages / Chat Management</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This module is scaffolded. Next step: reusable message templates and basic fan chat
        history timeline.
      </CardContent>
    </Card>
  );
}
