import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Mail, Phone, Globe, Calendar } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your profile information
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6 mb-6">
            <Avatar
              src={user?.profile?.profilePicture}
              fallback={user?.profile?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              size="xl"
            />
            <div>
              <h2 className="text-2xl font-bold mb-1">{user?.profile?.fullName || 'User'}</h2>
              <p className="text-muted-foreground mb-2">{user?.email}</p>
              <Badge variant="info">{user?.role}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            {user?.profile?.phoneNumber && (
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{user.profile.phoneNumber}</p>
                </div>
              </div>
            )}

            {user?.profile?.country && (
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium">{user.profile.country}</p>
                </div>
              </div>
            )}

            {user?.metadata?.createdAt && (
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {new Date(user.metadata.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};