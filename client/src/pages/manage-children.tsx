import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users } from "lucide-react";
import { AddChildDialog } from "@/components/dialogs/add-child-dialog";
import { useAuthStore } from "@/store/auth-store";

interface Child {
  id: number;
  name: string;
  username: string;
  profile_image_url?: string | null;
  banner_color_preference?: string;
}

export default function ManageChildren() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const user = useAuthStore((state) => state.user);

  const { data: children = [], isLoading } = useQuery<Child[]>({
    queryKey: ["/api/family/children"],
    queryFn: async () => {
      const response = await apiRequest("/api/family/children");
      return response;
    },
    enabled: user?.role === "parent",
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
              <Card key={child.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
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
                </CardHeader>
                <CardContent>
                  {/* Archive/Edit buttons will be added in future tasks */}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Active profile
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
    </div>
  );
}