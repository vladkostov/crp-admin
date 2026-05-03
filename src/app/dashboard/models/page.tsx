import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ModelsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Models / Accounts Management</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This module is scaffolded. Next step: add model list table, create/edit form, and status
        management connected to Supabase.
      </CardContent>
    </Card>
  );
}
