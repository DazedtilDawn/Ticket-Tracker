import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { showErrorToast } from '@/lib/toast';

interface UserInfo {
  id: number;
  name: string;
  username: string;
  role: string;
}

export function FamilyUserSelector() {
  const [, setLocation] = useLocation();
  const { loginAsUser, setFamilyUsers, autoLoginEnabled, setAutoLoginEnabled } = useAuthStore();

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<UserInfo[]>({
    queryKey: ['/api/users']
  });
  
  // When users are loaded, store them in the auth store
  useEffect(() => {
    if (users && users.length > 0) {
      setFamilyUsers(users);
    }
  }, [users, setFamilyUsers]);

  // Filter parent and child users
  const parentUsers = users.filter((user: UserInfo) => user.role === 'parent');
  const childUsers = users.filter((user: UserInfo) => user.role === 'child');

  // Handle user login
  const handleUserLogin = async (username: string) => {
    try {
      const success = await loginAsUser(username);
      if (success) {
        setLocation('/');
      } else {
        showError(`Failed to login as ${username}`);
      }
    } catch (error) {
      showError('Login failed. Please try again.');
    }
  };

  // Handle auto-login toggle
  const handleAutoLoginToggle = (enabled: boolean) => {
    setAutoLoginEnabled(enabled);
  };

  // Generate initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Generate a color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-amber-500', 'bg-rose-500', 'bg-emerald-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };
  
  // Show error toast with proper typing
  const showError = (message: string) => {
    showErrorToast(message);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Family Ticket System
          </CardTitle>
          <CardDescription>
            Choose who is using the app
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {parentUsers.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Parent</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {parentUsers.map(user => (
                    <Button
                      key={user.id}
                      onClick={() => handleUserLogin(user.username)}
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-16 px-4"
                    >
                      <Avatar className={`h-10 w-10 ${getAvatarColor(user.name)}`}>
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {childUsers.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Children</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {childUsers.map(user => (
                    <Button
                      key={user.id}
                      onClick={() => handleUserLogin(user.username)}
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-16 px-4"
                    >
                      <Avatar className={`h-10 w-10 ${getAvatarColor(user.name)}`}>
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between items-center border-t pt-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-login" 
              checked={autoLoginEnabled}
              onCheckedChange={handleAutoLoginToggle}
            />
            <Label htmlFor="auto-login">Auto-login next time</Label>
          </div>
          <span className="text-sm text-gray-500">
            Family accounts use a shared password
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}