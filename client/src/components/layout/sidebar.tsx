import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import {
  SunIcon,
  MoonIcon,
  Users,
  User,
  ArrowRight,
  Crown,
} from "lucide-react";
import { AccountSwitcher } from "@/components/account-switcher";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Parent-only navigation items
const parentNavItems = [
  {
    path: "/bonus-management",
    label: "Bonus Management",
    icon: "ri-award-line",
  },
  { path: "/debug", label: "Debug Tools", icon: "ri-bug-line" },
];

// Settings navigation items
const settingsNavItems = [
  {
    path: "/settings/children",
    label: "Manage Children",
    icon: "ri-user-add-line",
  },
];

interface UserInfo {
  id: number;
  name: string;
  username: string;
  role: string;
  profile_image_url?: string | null;
}

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const {
    user,
    isViewingAsChild,
    switchChildView,
    resetChildView,
    getChildUsers,
    familyUsers,
  } = useAuthStore();
  const viewingChildId = useAuthStore((state) => state.viewingChildId);

  // Dashboard always lives at '/'. Parent/child view is handled in routing logic
  const navItems = [
    { path: "/", label: "Dashboard", icon: "ri-dashboard-line" },
    { path: "/chores", label: "Chores", icon: "ri-list-check-2" },
    {
      path: "/family-catalog",
      label: "Family Catalog",
      icon: "ri-store-2-line",
    },
    {
      path: "/transactions",
      label: "Transactions",
      icon: "ri-exchange-funds-line",
    },
  ];
  const [childUsers, setChildUsers] = useState<UserInfo[]>([]);

  useEffect(() => {
    // Update child users list whenever family users changes
    console.log("Sidebar: familyUsers in auth-store changed:", familyUsers);
    if (getChildUsers) {
      // Get all child users from the store
      const allChildUsersFromStore = getChildUsers();
      console.log("Sidebar: getChildUsers() returned:", allChildUsersFromStore);
      setChildUsers(allChildUsersFromStore);
      console.log("Sidebar: setChildUsers to:", allChildUsersFromStore);
    }
  }, [familyUsers, getChildUsers]);

  const isDarkMode = theme === "dark";

  const handleThemeToggle = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  const handleSwitchToChild = (childUser: UserInfo) => {
    console.log("Sidebar: handleSwitchToChild called with:", childUser);
    
    // Check if we're trying to switch to the same child we're already viewing
    if (viewingAsChild && viewingChildId === childUser.id) {
      console.log("Already viewing this child, no action needed");
      return;
    }
    
    // If already viewing as a child and trying to switch to another child,
    // we can switch directly without resetting to parent first
    if (viewingAsChild) {
      console.log("Switching from child to another child directly");
      switchChildView(childUser);
      setLocation("/");
    } else {
      // Normal case - just switch directly
      console.log("Switching from parent to child");
      switchChildView(childUser);
      setLocation("/");
    }
  };

  const handleResetToParent = () => {
    console.log("Sidebar: handleResetToParent called.");
    resetChildView();
    setLocation("/");
  };

  if (!user) return null;

  const viewingAsChild = isViewingAsChild();
  console.log(
    "Sidebar: Current user:",
    user,
    "Viewing as child:",
    viewingAsChild,
  );

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <a href="/" className="flex items-center space-x-3">
          <div className="bg-primary-600 p-2 rounded-lg">
            <i className="ri-ticket-2-line text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-bold font-quicksand text-gray-800 dark:text-white">
            TicketTracker
          </h1>
        </a>
      </div>

      {/* Quick access section - MOVED ABOVE NAVIGATION
          This section has two parts: Parent access (when viewing as child) and Child accounts access */}
      <div className="pt-2 px-4 pb-4">
        {/* Parent account quick access - show when viewing as child */}
        {viewingAsChild && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-100 dark:border-amber-800/50 mb-3">
            <div className="flex items-center mb-2">
              <Crown className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Parent Account
              </h3>
            </div>
            <button
              onClick={handleResetToParent}
              className="flex items-center justify-center w-full p-2 rounded-md text-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
            >
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-xs">
                  PU
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">Return to Parent View</span>
            </button>
          </div>
        )}

        {/* Enhanced child dashboard quick switcher - always prominent for parents */}
        {(user?.role === "parent" || viewingAsChild) &&
          childUsers.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/30 dark:to-blue-900/30 rounded-lg border border-primary-200 dark:border-primary-700 mb-2 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
                  <h3 className="text-sm font-bold text-primary-700 dark:text-primary-300">
                    Child Dashboards
                  </h3>
                </div>
                {viewingAsChild && (
                  <button
                    onClick={handleResetToParent}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    Parent View
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {childUsers.map((childUser) => {
                  const isActive = viewingAsChild && viewingChildId === childUser.id;
                  return (
                    <button
                      key={childUser.id}
                      onClick={() => handleSwitchToChild(childUser)}
                      className={`w-full flex items-center p-2 rounded-md text-left transition-all duration-200 ${
                        isActive
                          ? "bg-primary-100 dark:bg-primary-800/50 border border-primary-200 dark:border-primary-600 shadow-sm"
                          : "bg-white dark:bg-gray-800/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <Avatar className="h-9 w-9 mr-3">
                        {childUser.profile_image_url ? (
                          <img
                            src={childUser.profile_image_url}
                            alt={childUser.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <AvatarFallback className={`text-sm font-semibold ${
                            isActive
                              ? "bg-primary-200 text-primary-800 dark:bg-primary-700 dark:text-primary-100"
                              : "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                          }`}>
                            {childUser.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium truncate block ${
                          isActive
                            ? "text-primary-800 dark:text-primary-100"
                            : "text-gray-700 dark:text-gray-200"
                        }`}>
                          {childUser.name}
                        </span>
                        {isActive && (
                          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                            Currently viewing
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <div className="h-2 w-2 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {/* Main navigation items for all users */}
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`flex items-center p-3 rounded-lg ${
              location === item.path
                ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30"
            }`}
          >
            <i className={`${item.icon} mr-3 text-lg`}></i>
            <span className="font-medium">{item.label}</span>
          </a>
        ))}

        {/* Parent-only navigation items - show only when user is a parent and not viewing as child */}
        {user?.role === "parent" && !viewingAsChild && (
          <>
            {parentNavItems.length > 0 && (
              <div className="mt-4 mb-2 px-3">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Parent Controls
                </div>
              </div>
            )}

            {parentNavItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`flex items-center p-3 rounded-lg ${
                  location === item.path
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30"
                }`}
              >
                <i className={`${item.icon} mr-3 text-lg`}></i>
                <span className="font-medium">{item.label}</span>
              </a>
            ))}

            {/* Settings section */}
            {settingsNavItems.length > 0 && (
              <>
                <div className="mt-4 mb-2 px-3">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Settings
                  </div>
                </div>
                {settingsNavItems.map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    className={`flex items-center p-3 rounded-lg ${
                      location === item.path
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30"
                    }`}
                  >
                    <i className={`${item.icon} mr-3 text-lg`}></i>
                    <span className="font-medium">{item.label}</span>
                  </a>
                ))}
              </>
            )}
          </>
        )}
      </nav>

      {/* Display "Viewing as Child" indicator when in child view */}
      {viewingAsChild && (
        <div className="p-3 mx-4 mb-2 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
          <div className="text-sm text-amber-800 dark:text-amber-300 text-center">
            Viewing as {user.name}
            <button
              onClick={handleResetToParent}
              className="block w-full mt-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
            >
              Return to Parent View
            </button>
          </div>
        </div>
      )}

      {/* User profile section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <AccountSwitcher />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            title="Toggle theme"
          >
            {isDarkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
