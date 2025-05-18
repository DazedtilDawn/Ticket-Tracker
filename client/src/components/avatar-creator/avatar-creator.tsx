import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useAuthStore } from '@/store/auth-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

// Define types for avatar components
interface AvatarFeature {
  id: string;
  name: string;
  options: AvatarOption[];
}

interface AvatarOption {
  id: string;
  name: string;
  svgContent: string;
}

// Define a type for the avatar data structure
interface AvatarData {
  features: {
    [key: string]: string; // feature id -> selected option id
  };
  backgroundColor: string;
}

// Sample avatar features
const AVATAR_FEATURES: AvatarFeature[] = [
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

// Background color options
const BACKGROUND_COLORS = [
  { id: 'bg1', color: '#FFD6E0', name: 'Pink' },
  { id: 'bg2', color: '#C5E1A5', name: 'Light Green' },
  { id: 'bg3', color: '#90CAF9', name: 'Light Blue' },
  { id: 'bg4', color: '#FFECB3', name: 'Light Yellow' },
  { id: 'bg5', color: '#D1C4E9', name: 'Light Purple' },
  { id: 'bg6', color: '#B2DFDB', name: 'Teal' },
];

// Default avatar data
const DEFAULT_AVATAR_DATA: AvatarData = {
  features: {
    face: 'face1',
    hair: 'hair1',
    accessories: 'acc4',
  },
  backgroundColor: '#90CAF9',
};

export function AvatarCreator() {
  const queryClient = useQueryClient();
  const { getActiveChildId, isParent } = useAuthStore();
  const userId = getActiveChildId();
  
  const [avatarData, setAvatarData] = useState<AvatarData>(DEFAULT_AVATAR_DATA);
  const [activeTab, setActiveTab] = useState('face');
  
  // Fetch current avatar data for the user
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => 
      apiRequest(`/api/users/${userId}`).then((res) => {
        return res;
      }),
    enabled: !!userId,
  });

  // Initialize avatar data from user data
  useEffect(() => {
    if (userData && userData.avatar_data) {
      try {
        const parsedData = JSON.parse(userData.avatar_data);
        setAvatarData(parsedData);
      } catch (e) {
        console.error('Failed to parse avatar data:', e);
        setAvatarData(DEFAULT_AVATAR_DATA);
      }
    }
  }, [userData]);

  // Save avatar data mutation
  const saveAvatarMutation = useMutation({
    mutationFn: (newAvatarData: AvatarData) => {
      return apiRequest(`/api/users/${userId}/avatar`, {
        method: 'PUT',
        body: JSON.stringify({
          avatar_data: JSON.stringify(newAvatarData),
        }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Avatar saved!' });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to save avatar', 
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle feature selection
  const selectFeatureOption = (featureId: string, optionId: string) => {
    setAvatarData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [featureId]: optionId,
      },
    }));
  };

  // Handle background color selection
  const selectBackgroundColor = (color: string) => {
    setAvatarData((prev) => ({
      ...prev,
      backgroundColor: color,
    }));
  };

  // Save the avatar
  const saveAvatar = () => {
    saveAvatarMutation.mutate(avatarData);
  };

  // Get the SVG content for the selected features
  const renderAvatarSvg = () => {
    let svgContent = '';
    
    // Combine all selected features
    Object.entries(avatarData.features).forEach(([featureId, optionId]) => {
      const feature = AVATAR_FEATURES.find(f => f.id === featureId);
      if (feature) {
        const option = feature.options.find(o => o.id === optionId);
        if (option) {
          svgContent += option.svgContent;
        }
      }
    });

    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        style={{ backgroundColor: avatarData.backgroundColor }}
      >
        <circle cx="50" cy="50" r="45" fill={avatarData.backgroundColor} stroke="black" strokeWidth="1" />
        <g dangerouslySetInnerHTML={{ __html: svgContent }} />
      </svg>
    );
  };

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Avatar Creator</CardTitle>
        <CardDescription>
          Personalize your avatar by selecting features and colors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-medium mb-4">Preview</h3>
            <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-gray-200">
              {renderAvatarSvg()}
            </div>
          </div>

          {/* Avatar Customization */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                {AVATAR_FEATURES.map((feature) => (
                  <TabsTrigger key={feature.id} value={feature.id}>
                    {feature.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {AVATAR_FEATURES.map((feature) => (
                <TabsContent key={feature.id} value={feature.id} className="space-y-4">
                  <h4 className="text-sm font-medium">Choose {feature.name}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {feature.options.map((option) => (
                      <Button
                        key={option.id}
                        variant={avatarData.features[feature.id] === option.id ? "default" : "outline"}
                        className="h-auto py-2 flex flex-col items-center"
                        onClick={() => selectFeatureOption(feature.id, option.id)}
                      >
                        <div className="w-12 h-12 mb-1">
                          <svg viewBox="0 0 100 100">
                            <g dangerouslySetInnerHTML={{ __html: option.svgContent }} />
                          </svg>
                        </div>
                        <span className="text-xs">{option.name}</span>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Background Color</h4>
              <div className="flex flex-wrap gap-2">
                {BACKGROUND_COLORS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    className={`w-8 h-8 rounded-full hover:scale-110 transition-transform ${
                      avatarData.backgroundColor === bg.color ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: bg.color }}
                    title={bg.name}
                    onClick={() => selectBackgroundColor(bg.color)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={saveAvatar} disabled={saveAvatarMutation.isPending}>
          {saveAvatarMutation.isPending ? 'Saving...' : 'Save Avatar'}
        </Button>
      </CardFooter>
    </Card>
  );
}