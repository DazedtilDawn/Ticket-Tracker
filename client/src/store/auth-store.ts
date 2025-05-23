import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import jwtDecode from 'jwt-decode';
import { apiRequest } from '@/lib/queryClient';

export interface UserInfo {
  id: number;
  name: string;
  username: string;
  role: string;
  profile_image_url?: string | null;
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
  switchChildView: (childUser: UserInfo) => void;
  resetChildView: () => void;
  isViewingAsChild: () => boolean;
  getChildUsers: () => UserInfo[];
  getActiveChildId: () => number | null;
  setAutoLoginEnabled: (enabled: boolean) => void;
  setFamilyUsers: (users: UserInfo[]) => void;
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
        set({ token, user, isAuthenticated: true, originalUser: null, viewingChildId: null });
        if (user.role === 'parent') {
          try {
            const users = await apiRequest('/api/users');
            if (users && Array.isArray(users)) {
              console.log('AuthStore: Fetched family users on parent login:', users);
              set({ familyUsers: users });
              console.log('AuthStore: Family users loaded on parent login.');
            } else {
              console.error('AuthStore: Failed to fetch or parse family users on parent login. Received:', users);
            }
          } catch (e) {
            console.error('AuthStore: Failed to fetch family users on login', e);
          }
        }
      },
      
      loginAsUser: async (username: string) => {
        try {
          const data = await apiRequest('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: 'password' }),
          });

          set({
            token: data.token,
            user: data.user,
            isAuthenticated: true,
          });

          return true;
        } catch (error) {
          console.error('Auto-login failed:', error);
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
          familyUsers: []
        });
      },
      
      checkAuth: async () => {
        const { token, autoLoginEnabled, familyUsers: currentFamilyUsers, user: currentUserInStore } = get();
        
        // If we have a token, validate it
        if (token) {
          try {
            const decoded: any = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (!decoded.exp || decoded.exp > currentTime) {
              if (currentUserInStore) {
                set({ isAuthenticated: true });
                if (currentUserInStore.role === 'parent' && currentFamilyUsers.length === 0) {
                  try {
                    const users = await apiRequest('/api/users');
                    if (users && Array.isArray(users)) {
                      console.log('AuthStore: Fetched family users on auth check:', users);
                      set({ familyUsers: users });
                      console.log('AuthStore: Family users loaded on auth check for parent.');
                    } else {
                      console.error('AuthStore: Failed to fetch or parse family users on auth check. Received:', users);
                    }
                  } catch (e) {
                    console.error('AuthStore: Failed to fetch family users on auth check', e);
                  }
                }
                return true;
              }
            }
          } catch (error) {
            console.warn('AuthStore: Token validation failed or expired.', error);
          }
        }
        
        // If no valid token, but auto-login is enabled
        if (autoLoginEnabled) {
          let usersForAutoLogin = currentFamilyUsers;
          if (usersForAutoLogin.length === 0) {
            try {
              usersForAutoLogin = await apiRequest('/api/users') || [];
              if (Array.isArray(usersForAutoLogin)) set({ familyUsers: usersForAutoLogin });
              console.log('AuthStore: Fetched family users for auto-login:', usersForAutoLogin);
            } catch (e) {
              console.error('AuthStore: Failed to fetch users for auto-login', e);
              usersForAutoLogin = [];
            }
          }
          if (usersForAutoLogin.length > 0) {
            const parentUser = usersForAutoLogin.find(u => u.role === 'parent') || usersForAutoLogin[0];
            if (parentUser) {
              return await get().loginAsUser(parentUser.username);
            }
          }
        }
        
        // No token and no auto-login
        get().logout();
        return false;
      },
      
      // Switch to viewing as a child user
      switchChildView: (childUser: UserInfo) => {
        const { user } = get();

        // Only parents can switch to child view
        if (user?.role !== 'parent') return;

        console.log('AuthStore: switchChildView called for:', childUser);

        // Store the original parent user
        set({
          originalUser: user,
          user: childUser,
          viewingChildId: childUser.id
        });
      },
      
      // Reset back to parent view
      resetChildView: () => {
        const { originalUser } = get();

        console.log('AuthStore: resetChildView called. Original user:', originalUser);

        // If there's an original user, switch back
        if (originalUser) {
          set({
            user: originalUser,
            originalUser: null,
            viewingChildId: null
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
        return familyUsers.filter(
          user => user.role === 'child' && (user.name === 'Kiki' || user.name === 'Bryce')
        );
      },
      
      // Get the ID of the active child (either current user if child, or viewingChildId if parent looking as child)
      getActiveChildId: () => {
        const { user, viewingChildId } = get();
        if (viewingChildId) return viewingChildId;
        if (user?.role === 'child') return user.id;
        return null;
      },
      
      // Update auto-login setting
      setAutoLoginEnabled: (enabled: boolean) => {
        set({ autoLoginEnabled: enabled });
      },
      
      // Update the family users list
      setFamilyUsers: (users: UserInfo[]) => {
        set({ familyUsers: users });
      }
    }),
    {
      name: 'ticket-tracker-auth',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user,
        originalUser: state.originalUser,
        viewingChildId: state.viewingChildId,
        autoLoginEnabled: state.autoLoginEnabled,
        familyUsers: state.familyUsers 
      }),
    }
  )
);
