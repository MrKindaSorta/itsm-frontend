import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function KnowledgeBase() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Articles</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage articles and documentation
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Article list with categories and management options will appear here...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
