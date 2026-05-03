import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SocialMediaPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Management</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        This module is scaffolded. Next step: map social accounts per model and warm-up account
        tracking.
      </CardContent>
    </Card>
  );
}
