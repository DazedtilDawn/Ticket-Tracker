import { create } from "zustand";
import { persist } from "zustand/middleware";
import jwtDecode from "jwt-decode";
import { apiRequest } from "@/lib/queryClient";

export interface UserInfo {
  id: number;
  name: string;
  username: string;
  role: string;
  profile_image_url?: string | null;
  banner_image_url?: string | null;
  banner_color_preference?: string | null;
  is_archived?: boolean;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  originalUser: UserInfo | null; // Stores the parent user when viewing as child
  viewingChildId: number | null; // Tracks which child is being viewed
  isAuthenticated: boolean;
  autoLoginEnabled: boolean;
  familyUsers: UserInfo[];
  login: (token: string, user: UserInfo) => Promise<void>;
  loginAsUser: (username: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  refreshUser: () => Promise<void>; // Added to refresh user data
  refreshFamilyUsers: () => Promise<void>;
  switchChildView: (childUser: UserInfo) => void;
  resetChildView: () => void;
  isViewingAsChild: () => boolean;
  getChildUsers: () => UserInfo[];
  getActiveChildId: () => number | null;
  setAutoLoginEnabled: (enabled: boolean) => void;
  setFamilyUsers: (users: UserInfo[]) => void;
  updateUserBannerImage: (bannerImageUrl: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      originalUser: null,
      viewingChildId: null,
      isAuthenticated: false,
      autoLoginEnabled: true,
      familyUsers: [],

      login: async (token: string, user: UserInfo) => {
        set({
          token,
          user,
          isAuthenticated: true,
          originalUser: null,
          viewingChildId: null,
        });
        if (user.role === "parent") {
          try {
            const users = await apiRequest("/api/users");
            if (users && Array.isArray(users)) {
              console.log(
                "AuthStore: Fetched family users on parent login:",
                users,
              );
              set({ familyUsers: users });
              console.log("AuthStore: Family users loaded on parent login.");
            } else {
              console.error(
                "AuthStore: Failed to fetch or parse family users on parent login. Received:",
                users,
              );
            }
          } catch (e) {
            console.error(
              "AuthStore: Failed to fetch family users on login",
              e,
            );
          }
        }
      },

      loginAsUser: async (username: string) => {
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username, password: "password123" }),
          });

          if (!response.ok) {
            throw new Error(`Login failed: ${response.status}`);
          }

          const data = await response.json();
          
          if (data?.success && data?.data) {
            const { token, user } = data.data;
            
            set({
              token,
              user,
              isAuthenticated: true,
              viewingChildId: null,
              originalUser: null,
            });

            // If parent, refresh family users
            if (user.role === 'parent') {
              await get().refreshFamilyUsers();
            }

            return true;
          }
          
          throw new Error("Login failed - invalid response");
        } catch (error) {
          console.error("Auto-login failed:", error);
          return false;
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          originalUser: null,
          viewingChildId: null,
          isAuthenticated: false,
          familyUsers: [],
        });
      },

      checkAuth: async () => {
        const {
          token,
          autoLoginEnabled,
          familyUsers: currentFamilyUsers,
          user: currentUserInStore,
        } = get();

        // If we have a token, validate it
        if (token) {
          try {
            const decoded: any = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (!decoded.exp || decoded.exp > currentTime) {
              if (currentUserInStore) {
                set({ isAuthenticated: true });
                if (
                  currentUserInStore.role === "parent" &&
                  currentFamilyUsers.length === 0
                ) {
                  try {
                    const users = await apiRequest("/api/users");
                    if (users && Array.isArray(users)) {
                      console.log(
                        "AuthStore: Fetched family users on auth check:",
                        users,
                      );
                      set({ familyUsers: users });
                      console.log(
                        "AuthStore: Family users loaded on auth check for parent.",
                      );
                    } else {
                      console.error(
                        "AuthStore: Failed to fetch or parse family users on auth check. Received:",
                        users,
                      );
                    }
                  } catch (e) {
                    console.error(
                      "AuthStore: Failed to fetch family users on auth check",
                      e,
                    );
                  }
                }
                return true;
              }
            }
          } catch (error) {
            console.warn(
              "AuthStore: Token validation failed or expired.",
              error,
            );
          }
        }

        // Try auto-login with parent user (always enabled for this project)
        console.log("AuthStore: Attempting auto-login as parent user");
        return await get().loginAsUser("parent");

        // No token and no auto-login
        get().logout();
        return false;
      },

      // Switch to viewing as a child user
      switchChildView: (childUser: UserInfo) => {
        const { user, originalUser, viewingChildId } = get();

        console.log("AuthStore: switchChildView called for:", childUser);

        // If we're already viewing as a child, switch to the new child
        if (originalUser && viewingChildId !== null) {
          console.log("AuthStore: Switching from one child to another");
          set({
            user: childUser,
            viewingChildId: childUser.id,
            // Keep the same originalUser (parent)
          });
          return;
        }

        // Only parents can initiate child view switching
        if (user?.role !== "parent") {
          console.log("AuthStore: User is not parent, cannot switch to child view");
          return;
        }

        // Store the original parent user and switch to child
        set({
          originalUser: user,
          user: childUser,
          viewingChildId: childUser.id,
        });
      },

      // Reset back to parent view
      resetChildView: () => {
        const { originalUser } = get();

        console.log(
          "AuthStore: resetChildView called. Original user:",
          originalUser,
        );

        // If there's an original user, switch back
        if (originalUser) {
          set({
            user: originalUser,
            originalUser: null,
            viewingChildId: null,
          });
        }
      },

      // Helper to check if viewing as child
      isViewingAsChild: () => {
        const { originalUser, viewingChildId } = get();
        return !!originalUser && viewingChildId !== null;
      },

      // Get all child users from family users
      getChildUsers: () => {
        const { familyUsers } = get();
        return familyUsers.filter((user) => user.role === "child" && !(user as any).is_archived);
      },

      // Get the ID of the active child (either current user if child, or viewingChildId if parent looking as child)
      getActiveChildId: () => {
        const { user, viewingChildId } = get();
        if (viewingChildId) return viewingChildId;
        if (user?.role === "child") return user.id;
        return null;
      },

      // Update auto-login setting
      setAutoLoginEnabled: (enabled: boolean) => {
        set({ autoLoginEnabled: enabled });
      },

      // Update the family users list
      setFamilyUsers: (users: UserInfo[]) => {
        set({ familyUsers: users });
      },

      // Refresh the current user data
      refreshUser: async () => {
        const { user, token, viewingChildId } = get();

        if (!user || !token) return;

        try {
          console.log("Refreshing user data for user ID:", user.id);

          // Get fresh user data from the server
          const users = await apiRequest("/api/users");

          if (users && Array.isArray(users)) {
            // Set the family users list
            set({ familyUsers: users });

            // Find and update the current user
            const currentUserId = viewingChildId || user.id;
            const updatedUser = users.find((u) => u.id === currentUserId);

            if (updatedUser) {
              console.log("User data refreshed successfully:", updatedUser);
              set({ user: updatedUser });
            }
          }
        } catch (error) {
          console.error("Failed to refresh user data:", error);
        }
      },

      // Refresh family users from the API
      refreshFamilyUsers: async () => {
        const { user } = get();
        
        // Only parents can fetch family users
        if (!user || user.role !== "parent") return;
        
        try {
          console.log("Refreshing family users...");
          const children = await apiRequest("/api/family/children");
          
          if (children && Array.isArray(children)) {
            // Convert children to UserInfo format and combine with parent
            const familyUsersList: UserInfo[] = [user, ...children];
            console.log("Family users refreshed:", familyUsersList);
            set({ familyUsers: familyUsersList });
          }
        } catch (error) {
          console.error("Failed to refresh family users:", error);
        }
      },

      // Update user's banner image
      updateUserBannerImage: (bannerImageUrl: string) => {
        const { user } = get();
        if (!user) return;

        console.log("Updating banner image URL to:", bannerImageUrl);

        // Create an updated user with the new banner image URL
        const updatedUser = {
          ...user,
          banner_image_url: bannerImageUrl,
        };

        // Update the user in state
        set({ user: updatedUser });

        // Also update in family users array
        const { familyUsers } = get();
        const updatedFamilyUsers = familyUsers.map((u) =>
          u.id === user.id ? { ...u, banner_image_url: bannerImageUrl } : u,
        );

        set({ familyUsers: updatedFamilyUsers });
      },
    }),
    {
      name: "ticket-tracker-auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        originalUser: state.originalUser,
        viewingChildId: state.viewingChildId,
        autoLoginEnabled: state.autoLoginEnabled,
        familyUsers: state.familyUsers,
      }),
    },
  ),
);
