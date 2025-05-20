import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { showErrorToast } from '@/lib/toast';
import { ChevronDownIcon, LogOutIcon, UserIcon, Users, Crown } from 'lucide-react';

// Define the user type for better type checking
interface UserInfo {
  id: number;
  name: string;
  username: string;
  role: string;
}

export function AccountSwitcher() {
  const [, setLocation] = useLocation();
  const {
    user: currentUser,
    originalUser,
    logout,
    loginAsUser,
    switchChildView,
    resetChildView,
    isViewingAsChild
  } = useAuthStore();

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<UserInfo[]>({
    queryKey: ['/api/users']
  });

  // Helper to get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Helper to get avatar color
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-amber-500', 'bg-rose-500', 'bg-emerald-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Handle user switch
  const handleSwitchUser = async (user: UserInfo) => {
    try {
      // If we're already viewing as a child and want to switch to another child
      if (isViewingAsChild() && user.role === 'child') {
        // First go back to parent
        resetChildView();
        // Then switch to the new child
        setTimeout(() => {
          switchChildView(user);
          setLocation('/');
        }, 50);
        return;
      }
      
      // If we're the parent and want to view as child
      if (currentUser?.role === 'parent' && user.role === 'child') {
        switchChildView(user);
        setLocation('/');
        return;
      }
      
      // If we're viewing as child and want to go back to parent
      if (isViewingAsChild() && originalUser?.id === user.id) {
        resetChildView();
        setLocation('/');
        return;
      }
      
      // Otherwise, do a normal login
      const success = await loginAsUser(user.username);
      if (success) {
        setLocation('/');
      } else {
        showErrorToast(`Failed to switch to ${user.name}'s account`);
      }
    } catch (error) {
      showErrorToast('An error occurred while switching accounts');
    }
  };

  // Handle logout
  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      setLocation('/login');
    }
  };

  if (!currentUser) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative flex items-center space-x-2 h-9 pl-3 pr-3">
          <Avatar className={`h-7 w-7 ${getAvatarColor(currentUser.name)}`}>
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5 text-left">
            <span className="text-sm font-medium leading-none">{currentUser.name}</span>
            <span className="text-xs text-muted-foreground leading-none capitalize">{currentUser.role}</span>
          </div>
          <ChevronDownIcon className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          {isViewingAsChild() && originalUser && (
            <>
              <DropdownMenuLabel className="text-amber-700 dark:text-amber-300 flex items-center">
                <Crown className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
                Parent Account
              </DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => handleSwitchUser(originalUser)}
                className="bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-md my-1"
              >
                <Avatar className="h-5 w-5 mr-2 bg-amber-200 dark:bg-amber-800">
                  <AvatarFallback className="text-xs text-amber-700 dark:text-amber-300">PU</AvatarFallback>
                </Avatar>
                <span>Return to Parent View</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* We're a parent, show child accounts */}
          {currentUser.role === 'parent' && (
            <>
              <DropdownMenuLabel>Family accounts</DropdownMenuLabel>
              {users
                .filter(user =>
                  user.role === 'child' && (user.name === 'Bryce' || user.name === 'Kiki')
                )
                .map(user => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() => handleSwitchUser(user)}
                    disabled={isViewingAsChild() && user.id === currentUser.id}
                  >
                    <Avatar className={`h-5 w-5 mr-2 ${getAvatarColor(user.name)}`}>
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </DropdownMenuItem>
                ))}
            </>
          )}

          {/* If we're a child viewing our own account, allow switching to other accounts */}
          {currentUser.role === 'child' && !isViewingAsChild() && (
            <>
              <DropdownMenuLabel>Switch account</DropdownMenuLabel>
              {users
                .filter(user =>
                  user.id !== currentUser.id &&
                  (user.role === 'parent' || user.name === 'Bryce' || user.name === 'Kiki')
                )
                .map(user => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() => handleSwitchUser(user)}
                  >
                    <Avatar className={`h-5 w-5 mr-2 ${getAvatarColor(user.name)}`}>
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </DropdownMenuItem>
                ))}
            </>
          )}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
