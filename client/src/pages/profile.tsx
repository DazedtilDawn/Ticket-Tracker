import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { apiRequest } from '@/lib/queryClient';
import { AvatarCreator } from '@/components/avatar-creator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfilePage() {
  const { getActiveChildId, user } = useAuthStore();
  const userId = getActiveChildId();

  // Fetch current user data for the active child
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => apiRequest(`/api/users/${userId}`),
    enabled: !!userId,
  });

  // Show error toast if the query fails
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading profile',
        description: 'There was a problem loading your profile information.',
        variant: 'destructive',
      });
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-1/4 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {userData?.avatar_data ? (
                  <AvatarImage
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(
                      `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="45" fill="${JSON.parse(userData.avatar_data).backgroundColor || '#90CAF9'}" stroke="black" strokeWidth="1" />
                        ${Object.entries(JSON.parse(userData.avatar_data).features || {}).map(([featureId, optionId]) => {
                          const feature = AVATAR_FEATURES.find(f => f.id === featureId);
                          if (feature) {
                            const option = feature.options.find(o => o.id === optionId);
                            return option ? option.svgContent : '';
                          }
                          return '';
                        }).join('')}
                      </svg>`
                    )}`}
                    alt={userData?.name}
                  />
                ) : (
                  <AvatarFallback>{userData?.name?.charAt(0) || 'U'}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <CardTitle>{userData?.name}</CardTitle>
                <CardDescription>@{userData?.username}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="avatar">
              <TabsList className="mb-4">
                <TabsTrigger value="avatar">Avatar</TabsTrigger>
                <TabsTrigger value="info">Account Info</TabsTrigger>
              </TabsList>
              
              <TabsContent value="avatar">
                <div className="py-4">
                  <h3 className="text-lg font-medium mb-4">Customize Your Avatar</h3>
                  <AvatarCreator />
                </div>
              </TabsContent>
              
              <TabsContent value="info">
                <div className="space-y-4 py-4">
                  <div>
                    <h3 className="text-sm font-medium">Name</h3>
                    <p className="text-sm text-gray-500">{userData?.name}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium">Username</h3>
                    <p className="text-sm text-gray-500">{userData?.username}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium">Role</h3>
                    <p className="text-sm text-gray-500">{userData?.role === 'parent' ? 'Parent' : 'Child'}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Avatar features data (same as in avatar-creator.tsx)
const AVATAR_FEATURES = [
  {
    id: 'face',
    name: 'Face',
    options: [
      {
        id: 'face1',
        name: 'Happy',
        svgContent: '<circle cx="50" cy="50" r="40" fill="none" stroke="black" stroke-width="2"/><path d="M30,50 a1,0.8 0 0,0 40,0" fill="none" stroke="black" stroke-width="2"/><circle cx="35" cy="40" r="5" fill="black"/><circle cx="65" cy="40" r="5" fill="black"/>',
      },
      {
        id: 'face2',
        name: 'Neutral',
        svgContent: '<circle cx="50" cy="50" r="40" fill="none" stroke="black" stroke-width="2"/><line x1="30" y1="60" x2="70" y2="60" stroke="black" stroke-width="2"/><circle cx="35" cy="40" r="5" fill="black"/><circle cx="65" cy="40" r="5" fill="black"/>',
      },
      {
        id: 'face3',
        name: 'Silly',
        svgContent: '<circle cx="50" cy="50" r="40" fill="none" stroke="black" stroke-width="2"/><path d="M30,55 a1,0.8 0 0,0 40,0" fill="none" stroke="black" stroke-width="2"/><circle cx="35" cy="40" r="5" fill="black"/><circle cx="65" cy="40" r="5" fill="black"/><path d="M40,45 L60,45" stroke="black" stroke-width="2"/>',
      },
    ],
  },
  {
    id: 'hair',
    name: 'Hair',
    options: [
      {
        id: 'hair1',
        name: 'Short',
        svgContent: '<path d="M20,30 C20,20 40,10 50,10 C60,10 80,20 80,30" fill="none" stroke="black" stroke-width="2"/>',
      },
      {
        id: 'hair2',
        name: 'Long',
        svgContent: '<path d="M15,50 C15,20 40,5 50,5 C60,5 85,20 85,50" fill="none" stroke="black" stroke-width="2"/>',
      },
      {
        id: 'hair3',
        name: 'Curly',
        svgContent: '<path d="M20,20 Q25,10 30,20 Q35,10 40,20 Q45,10 50,20 Q55,10 60,20 Q65,10 70,20 Q75,10 80,20" fill="none" stroke="black" stroke-width="2"/>',
      },
      {
        id: 'hair4',
        name: 'None',
        svgContent: '',
      },
    ],
  },
  {
    id: 'accessories',
    name: 'Accessories',
    options: [
      {
        id: 'acc1',
        name: 'Glasses',
        svgContent: '<rect x="30" y="40" width="40" height="10" rx="5" ry="5" fill="none" stroke="black" stroke-width="2"/><line x1="30" y1="45" x2="20" y2="45" stroke="black" stroke-width="2"/><line x1="70" y1="45" x2="80" y2="45" stroke="black" stroke-width="2"/>',
      },
      {
        id: 'acc2',
        name: 'Hat',
        svgContent: '<path d="M20,30 L80,30 L75,20 L25,20 Z" fill="none" stroke="black" stroke-width="2"/>',
      },
      {
        id: 'acc3',
        name: 'Crown',
        svgContent: '<path d="M30,25 L40,15 L50,25 L60,15 L70,25 L70,30 L30,30 Z" fill="none" stroke="black" stroke-width="2"/>',
      },
      {
        id: 'acc4',
        name: 'None',
        svgContent: '',
      },
    ],
  },
];