import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, MoreVertical, Edit, Archive, RotateCcw, Trash2 } from "lucide-react";
import { AddChildDialog } from "@/components/dialogs/add-child-dialog";
import { EditChildDialog } from "@/components/dialogs/edit-child-dialog";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Child {
  id: number;
  name: string;
  username: string;
  profile_image_url?: string | null;
  banner_color_preference?: string;
  is_archived?: boolean;
}

export default function ManageChildren() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [deletingChild, setDeletingChild] = useState<Child | null>(null);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const refreshFamilyUsers = useAuthStore((state) => state.refreshFamilyUsers);

  const { data: children = [], isLoading } = useQuery<Child[]>({
    queryKey: ["/api/family/children"],
    queryFn: async () => {
      const response = await apiRequest("/api/family/children?includeArchived=true");
      return response;
    },
    enabled: user?.role === "parent",
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ childId, archived }: { childId: number; archived: boolean }) => {
      const response = await apiRequest(`/api/family/children/${childId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      return response;
    },
    onSuccess: async () => {
      // Invalidate the children query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ["/api/family/children"] });
      
      // Refresh family users in auth store
      if (refreshFamilyUsers) {
        await refreshFamilyUsers();
      }
      
      toast({
        title: "Success",
        description: "Child profile updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update child profile",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (childId: number) => {
      const response = await apiRequest(`/api/family/children/${childId}`, {
        method: "DELETE",
      });
      return response;
    },
    onSuccess: async () => {
      // Invalidate the children query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ["/api/family/children"] });
      
      // Refresh family users in auth store
      if (refreshFamilyUsers) {
        await refreshFamilyUsers();
      }
      
      toast({
        title: "Success",
        description: "Child profile deleted successfully",
      });
      
      setDeletingChild(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete child profile",
        variant: "destructive",
      });
    },
  });

  if (!user || user.role !== "parent") {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-gray-500">
          Only parents can access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary-600" />
          Manage Children
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Add and manage child profiles for your family
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {children.map((child) => (
              <Card 
                key={child.id} 
                className={cn(
                  "hover:shadow-lg transition-all relative",
                  child.is_archived && "opacity-60"
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className={cn(
                        "h-16 w-16",
                        child.is_archived && "grayscale"
                      )}>
                        {child.profile_image_url ? (
                          <AvatarImage src={child.profile_image_url} alt={child.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 text-lg">
                          {child.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{child.name}</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{child.username}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingChild(child)}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => archiveMutation.mutate({ 
                            childId: child.id, 
                            archived: !child.is_archived 
                          })}
                          className="cursor-pointer"
                        >
                          {child.is_archived ? (
                            <>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restore
                            </>
                          ) : (
                            <>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingChild(child)}
                          className="cursor-pointer text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {child.is_archived ? (
                      <Badge variant="secondary" className="text-xs">
                        Archived
                      </Badge>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Active profile
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add new child card */}
            <Card 
              className="border-dashed border-2 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 cursor-pointer transition-all"
              onClick={() => setShowAddDialog(true)}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px]">
                <Plus className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Add New Child
                </p>
              </CardContent>
            </Card>
          </div>

          {children.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No children yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by adding your first child profile
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Child
              </Button>
            </div>
          )}
        </>
      )}

      <AddChildDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      {editingChild && (
        <EditChildDialog
          child={editingChild}
          open={!!editingChild}
          onOpenChange={(open) => !open && setEditingChild(null)}
        />
      )}

      <AlertDialog open={!!deletingChild} onOpenChange={(open) => !open && setDeletingChild(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Child?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and will remove all data for {deletingChild?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingChild && deleteMutation.mutate(deletingChild.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}