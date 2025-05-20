import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { UserIcon, ArrowLeftRight } from 'lucide-react';

// Define the user type for better type checking
interface ChildUser {
  id: number;
  name: string;
  username: string;
  role: string;
}

export function UserSwitcher() {
  const [, setLocation] = useLocation();
  const currentUser = useAuthStore(state => state.user);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [viewingAs, setViewingAs] = useState<ChildUser | null>(null);
  const switchUser = useAuthStore(state => state.switchChildView);
  const resetChildView = useAuthStore(state => state.resetChildView);
  
  // Only show for parent users
  if (!currentUser || currentUser.role !== 'parent') {
    return null;
  }
  
  // Fetch child users
  const { data: users = [], isLoading } = useQuery<ChildUser[]>({
    queryKey: ['/api/users'],
    enabled: currentUser.role === 'parent'
  });
  
  // Only child users
  const childUsers = users.filter(
    user => user.role === 'child' && (user.name === 'Bryce' || user.name === 'Kiki')
  );
  
  useEffect(() => {
    // If coming back from children view, reset selection
    if (!viewingAs && selectedChildId) {
      setSelectedChildId(null);
    }
  }, [viewingAs]);
  
  // Handle child selection
  const handleSelectChild = (userId: string) => {
    setSelectedChildId(userId);
    const selectedChild = childUsers.find((c: ChildUser) => c.id.toString() === userId);
    
    if (selectedChild) {
      switchUser(selectedChild);
      setViewingAs(selectedChild);
      // Redirect to dashboard to show the child's data
      setLocation('/');
    }
  };
  
  // Handle reset to parent view
  const handleResetView = () => {
    resetChildView();
    setViewingAs(null);
    // Redirect to dashboard to show parent view
    setLocation('/');
  };
  
  // Show "viewing as" status when in child view
  if (viewingAs) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-md border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-1 text-amber-800 dark:text-amber-300">
          <UserIcon size={16} />
          <span className="text-sm font-medium">Viewing as {viewingAs.name}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleResetView} 
          className="ml-auto text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
        >
          <ArrowLeftRight size={14} className="mr-1" />
          <span className="text-xs">Switch back</span>
        </Button>
      </div>
    );
  }
  
  // Show dropdown to select child in parent view
  return (
    <div className="flex items-center">
      <Select disabled={isLoading || childUsers.length === 0} onValueChange={handleSelectChild} value={selectedChildId || undefined}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="View as child..." />
        </SelectTrigger>
        <SelectContent>
          {childUsers.map((child: ChildUser) => (
            <SelectItem key={child.id} value={child.id.toString()}>
              {child.name}
            </SelectItem>
          ))}
          {childUsers.length === 0 && (
            <SelectItem value="none" disabled>No children found</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
