import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Check, Award, Edit, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Chore = {
  id: number;
  name: string;
  base_tickets: number;
  emoji: string | null;
  is_active: boolean;
  last_bonus_assigned: string | null;
};

type User = {
  id: number;
  name: string;
  username: string;
};

type DailyBonusAssignment = {
  user: User;
  bonus: {
    id: number;
    assigned_chore_id: number | null;
    is_override: boolean;
    is_spun: boolean;
    bonus_date: string;
  } | null;
  assigned_chore: Chore | null;
};

type DailyBonusAssignments = Record<string, DailyBonusAssignment>;

export function DailyBonusAssignments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // For keeping track of which child's dropdown is open for changing their bonus chore
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  // Fetch all assignments for the current date
  const { 
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    isError: isAssignmentsError,
    error: assignmentsError
  } = useQuery({
    queryKey: ['/api/daily-bonus/assignments', selectedDate],
    queryFn: () => apiRequest(`/api/daily-bonus/assignments?date=${selectedDate}`),
  });
  
  // Fetch available chores for override selection
  const { 
    data: choresData,
    isLoading: isLoadingChores 
  } = useQuery({
    queryKey: ['/api/chores'],
    queryFn: () => apiRequest('/api/chores'),
  });
  
  // Mutation for overriding a child's daily bonus assignment
  const assignMutation = useMutation({
    mutationFn: (data: { user_id: number, chore_id: number, date: string }) => 
      apiRequest('/api/daily-bonus/assign', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      }),
    onSuccess: () => {
      // Invalidate and refetch assignments data
      queryClient.invalidateQueries({ queryKey: ['/api/daily-bonus/assignments'] });
      
      toast({
        title: 'Assignment Updated',
        description: 'The daily bonus chore has been successfully updated.',
      });
      
      // Close the editing state
      setEditingUserId(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error Updating Assignment',
        description: error.message || 'Failed to update the daily bonus assignment.',
        variant: 'destructive',
      });
    }
  });
  
  // Function to assign a new bonus chore to a child
  const handleAssignBonusChore = (userId: number, choreId: number) => {
    assignMutation.mutate({
      user_id: userId,
      chore_id: choreId,
      date: selectedDate
    });
  };
  
  // Prepare assignments for display (convert from object to array)
  const assignments: DailyBonusAssignment[] = assignmentsData && typeof assignmentsData === 'object' && !Array.isArray(assignmentsData) ? 
    Object.values(assignmentsData as DailyBonusAssignments) : 
    [];
    
  // Debug assignments data
  console.log('[ASSIGNMENTS_DEBUG] Assignments data:', { 
    hasData: !!assignmentsData,
    type: assignmentsData ? typeof assignmentsData : 'none',
    isArray: assignmentsData ? Array.isArray(assignmentsData) : false,
    length: assignments.length
  });
  
  // Filter chores to only show active ones
  const activeChores = choresData?.filter((chore: Chore) => chore.is_active) || [];
  
  if (isAssignmentsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load daily bonus assignments: {(assignmentsError as Error)?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Daily Bonus Assignments</h2>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{selectedDate}</span>
        </div>
      </div>
      
      <Separator />
      
      {isLoadingAssignments ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : assignments.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Assignments</AlertTitle>
          <AlertDescription>
            No child accounts found or no bonus assignments have been made for today.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => (
            <Card key={assignment.user.id} className={assignment.bonus?.is_spun ? "opacity-75" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>{assignment.user.name}</CardTitle>
                  {assignment.bonus?.is_override && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                      Parent Override
                    </span>
                  )}
                </div>
                <CardDescription>
                  {assignment.user.username} • {assignment.bonus?.is_spun ? "Spin Complete" : "Spin Available"}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {assignment.bonus ? (
                  assignment.assigned_chore ? (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-muted-foreground">Bonus Chore:</div>
                      <div className="font-medium flex items-center gap-2">
                        {assignment.assigned_chore.emoji && (
                          <span className="text-xl">{assignment.assigned_chore.emoji}</span>
                        )}
                        <span>{assignment.assigned_chore.name}</span>
                        <span className="text-sm text-muted-foreground ml-auto">
                          {assignment.assigned_chore.base_tickets} tickets
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-amber-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>No chore assigned for today</span>
                    </div>
                  )
                ) : (
                  <div className="text-muted-foreground">
                    No bonus has been assigned for today
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-2">
                {editingUserId === assignment.user.id ? (
                  <div className="w-full">
                    <Select
                      onValueChange={(choreId) => handleAssignBonusChore(assignment.user.id, parseInt(choreId))}
                      disabled={isLoadingChores || assignMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a new bonus chore" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeChores.map((chore: Chore) => (
                          <SelectItem key={chore.id} value={chore.id.toString()}>
                            <div className="flex items-center gap-2">
                              {chore.emoji && <span>{chore.emoji}</span>}
                              <span>{chore.name}</span>
                              <span className="text-muted-foreground">({chore.base_tickets} tickets)</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex justify-end mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEditingUserId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setEditingUserId(assignment.user.id)}
                    disabled={assignment.bonus?.is_spun || assignMutation.isPending}
                  >
                    {assignMutation.isPending && assignMutation.variables?.user_id === assignment.user.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : assignment.bonus?.is_spun ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Wheel Already Spun
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Change Bonus Chore
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
