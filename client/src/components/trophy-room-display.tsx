import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Trophy, Gift, Calendar, User, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { subscribeToChannel } from "@/lib/websocketClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";

interface TrophyItem {
  id: number;
  child_id: number;
  item_id: number;
  awarded_by: number;
  custom_note: string | null;
  awarded_at: string;
  product: {
    id: number;
    title: string;
    image_url: string | null;
    price_cents: number;
  };
}

interface TrophyRoomDisplayProps {
  childId: number;
  childName?: string;
}

export default function TrophyRoomDisplay({ childId, childName }: TrophyRoomDisplayProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch trophies for the child
  const { data: trophiesData, isLoading, error } = useQuery<{ trophies: TrophyItem[] }>({
    queryKey: ["trophies", childId],
    staleTime: 0, // Always fetch fresh data when invalidated
    refetchOnWindowFocus: false
  });

  const trophies = trophiesData?.trophies || [];

  // Set up WebSocket listener for real-time trophy updates
  useEffect(() => {
    const unsubscribe = subscribeToChannel("trophy:awarded", (data: any) => {
      console.log("Received trophy:awarded event:", data);
      
      // Check if this trophy was awarded to the current child
      if (data.child_id === childId) {
        // Invalidate and refetch the trophies query
        queryClient.invalidateQueries({ queryKey: ["trophies", childId] });
        
        // Show a celebration effect or notification if this is the child's own view
        if (user?.id === childId) {
          console.log("🏆 New trophy awarded to current child!");
        }
      }
    });

    return unsubscribe;
  }, [childId, queryClient, user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-yellow-500 border-t-transparent rounded-full" />
        <span className="ml-2">Loading trophies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Error loading trophies</p>
      </div>
    );
  }

  if (trophies.length === 0) {
    return (
      <div className="text-center p-8">
        <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-500 mb-2">No Trophies Yet</h3>
        <p className="text-gray-400">
          {childName ? `${childName} hasn't` : "You haven't"} earned any trophies yet. 
          Keep up the great work!
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h2 className="text-xl font-bold">
          {childName ? `${childName}'s Trophy Room` : "Your Trophy Room"}
        </h2>
        <Badge variant="secondary" className="ml-auto">
          {trophies.length} {trophies.length === 1 ? 'Trophy' : 'Trophies'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trophies.map((trophy) => (
          <Card key={trophy.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                {trophy.product.image_url ? (
                  <img 
                    src={trophy.product.image_url}
                    alt={trophy.product.title}
                    className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Gift className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-semibold line-clamp-2">
                    {trophy.product.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(trophy.awarded_at)}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {trophy.custom_note && (
              <CardContent className="pt-0">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700 italic">
                      "{trophy.custom_note}"
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}