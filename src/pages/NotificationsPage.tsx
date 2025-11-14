import React from 'react';
import { Card, CardContent } from '@/components/common/Card';
import { Bell } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with important alerts
        </p>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No New Notifications</h3>
          <p className="text-muted-foreground">
            You're all caught up! Check back later for updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};