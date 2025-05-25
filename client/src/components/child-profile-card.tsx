import React from "react";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ticketsToUSD } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ProfileImageUpload from "./profile-image-upload";
import { Coins, User as UserIcon } from "lucide-react";

interface Child {
  id: number;
  name: string;
  username: string;
  profile_image_url?: string | null;
}

interface ChildProfileCardProps {
  child: Child;
  balance: number;
  isSelected?: boolean;
  onSelectChild?: (childId: number) => void;
  isParentView?: boolean;
}

export default function ChildProfileCard({
  child,
  balance,
  isSelected = false,
  onSelectChild,
  isParentView = true,
}: ChildProfileCardProps) {
  const queryClient = useQueryClient();

  // Handle profile image update
  const handleProfileImageUpdated = (imageUrl: string) => {
    console.log("Profile image updated in child card:", imageUrl);

    // Trigger a UI update with the new image URL
    const updatedChild = {
      ...child,
      profile_image_url: imageUrl,
    };

    // Invalidate queries that might use the profile image
    queryClient.invalidateQueries({ queryKey: ["/api/auth/verify"] });
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });

    // Force refresh parent dashboard to show updated image
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 ${
        isSelected
          ? "border-primary border-2"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => onSelectChild && onSelectChild(child.id)}
    >
      <div
        className={`absolute inset-0 w-full h-1 ${isSelected ? "bg-primary" : "bg-transparent"}`}
      />

      <CardContent className="flex flex-col items-center p-4 space-y-4">
        <div className="relative mt-2">
          {isParentView ? (
            <ProfileImageUpload
              userId={child.id}
              name={child.name}
              currentImageUrl={child.profile_image_url || undefined}
              size="lg"
              onImageUpdated={handleProfileImageUpdated}
            />
          ) : (
            <Avatar className="h-24 w-24 border-2 border-gray-200">
              <AvatarImage
                src={child.profile_image_url || undefined}
                alt={`${child.name}'s profile`}
              />
              <AvatarFallback className="bg-primary-100 text-primary-800">
                {getInitials(child.name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold">{child.name}</h3>
          <p className="text-muted-foreground text-sm">{child.username}</p>
        </div>

        <div className="flex items-center space-x-1 text-amber-500 font-bold">
          <Coins className="h-5 w-5" />
          <span className="text-lg">{balance} tickets</span>
        </div>

        <div className="text-sm text-muted-foreground">
          Worth about {ticketsToUSD(balance)}
        </div>
      </CardContent>
    </Card>
  );
}
