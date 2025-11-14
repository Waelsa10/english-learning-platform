import React from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { BookOpen } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assignment Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse and manage assignment templates
        </p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Assignment Library</h3>
          <p className="text-muted-foreground">
            Template library and content management coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
};