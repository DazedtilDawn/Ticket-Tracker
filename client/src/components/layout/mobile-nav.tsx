import { useLocation } from "wouter";
import { useTheme } from "@/components/theme-provider";
import { useAuthStore } from "@/store/auth-store";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SunIcon, MoonIcon, UserIcon, Menu, Users, ArrowRight, Crown } from "lucide-react";
import { AccountSwitcher } from "@/components/account-switcher";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

// Navigation items with icons
const navItems = [
  { path: "/", label: "Home", icon: "ri-dashboard-line" },
  { path: "/chores", label: "Chores", icon: "ri-list-check-2" },
  { path: "/wishlist", label: "Wishes", icon: "ri-gift-line" },
  { path: "/transactions", label: "Tickets", icon: "ri-exchange-funds-line" },
];

// Parent-only navigation items
const parentNavItems = [
  { path: "/bonus-management", label: "Bonus Mgmt", icon: "ri-award-line" },
];

interface UserInfo {
  id: number;
  name: string;
  username: string;
  role: string;
  profile_image_url?: string | null;
}

export function MobileNav() {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { 
    user, 
    isViewingAsChild, 
    switchChildView,
    resetChildView,
    getChildUsers,
    familyUsers
  } = useAuthStore();
  
  const [childUsers, setChildUsers] = useState<UserInfo[]>([]);
  
  useEffect(() => {
    // Update child users list whenever family users changes
    if (getChildUsers) {
      setChildUsers(getChildUsers());
    }
  }, [familyUsers, getChildUsers]);
  
  const isDarkMode = theme === "dark";
  const viewingAsChild = isViewingAsChild();
  
  const handleThemeToggle = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };
  
  const handleSwitchToChild = (childUser: UserInfo) => {
    switchChildView(childUser);
    setLocation('/');
  };
  
  const handleResetToParent = () => {
    resetChildView();
    setLocation('/');
  };
  
  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <i className="ri-ticket-2-line text-white text-xl"></i>
            </div>
            <h1 className="text-xl font-bold font-quicksand text-gray-800 dark:text-white">TicketTracker</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {viewingAsChild && (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
                <UserIcon className="h-3 w-3 mr-1" />
                <span className="text-xs">Viewing {user?.name}</span>
              </Badge>
            )}
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Account</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <AccountSwitcher />
                </div>
                
                {/* Child accounts switcher for mobile */}
                {user?.role === 'parent' && childUsers.length > 0 && (
                  <div className="py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-3">
                      <Users className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Child Accounts</h3>
                    </div>
                    <div className="space-y-2">
                      {childUsers.map((childUser) => (
                        <SheetClose key={childUser.id} asChild>
                          <button
                            onClick={() => handleSwitchToChild(childUser)}
                            className="w-full flex items-center p-2 rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <Avatar className="h-7 w-7 mr-2">
                              <AvatarFallback className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 text-xs">
                                {childUser.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{childUser.name}</span>
                            <ArrowRight className="h-3 w-3 ml-auto text-gray-400" />
                          </button>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Parent-only controls in sheet menu */}
                {user?.role === 'parent' && !viewingAsChild && (
                  <div className="py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-3">
                      <Crown className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
                      <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300">Parent Controls</h3>
                    </div>
                    <div className="space-y-2">
                      {parentNavItems.map((item) => (
                        <SheetClose key={item.path} asChild>
                          <a
                            href={item.path}
                            className="w-full flex items-center p-2 rounded-md text-left hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          >
                            <i className={`${item.icon} text-lg mr-2 text-amber-600 dark:text-amber-400`}></i>
                            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{item.label}</span>
                            <ArrowRight className="h-3 w-3 ml-auto text-amber-500 dark:text-amber-400" />
                          </a>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Return to parent button when viewing as child */}
                {viewingAsChild && (
                  <div className="py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-3">
                      <Crown className="h-4 w-4 mr-2 text-amber-600 dark:text-amber-400" />
                      <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300">Parent Account</h3>
                    </div>
                    <SheetClose asChild>
                      <button
                        onClick={handleResetToParent}
                        className="w-full flex items-center p-2 rounded-md text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Avatar className="h-7 w-7 mr-2">
                          <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-xs">
                            PU
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">Return to Parent View</span>
                        <ArrowRight className="h-3 w-3 ml-auto text-amber-500 dark:text-amber-400" />
                      </button>
                    </SheetClose>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Theme</span>
                  <Button variant="ghost" size="sm" onClick={handleThemeToggle}>
                    {isDarkMode ? (
                      <div className="flex items-center">
                        <SunIcon className="h-4 w-4 mr-2" />
                        <span>Light Mode</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <MoonIcon className="h-4 w-4 mr-2" />
                        <span>Dark Mode</span>
                      </div>
                    )}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-10">
        <div className={`grid ${user?.role === 'parent' && !viewingAsChild ? 'grid-cols-5' : 'grid-cols-4'} h-16`}>
          {/* Regular navigation items */}
          {navItems.map(item => (
            <a
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center ${
                location === item.path
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <i className={`${item.icon} text-xl`}></i>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          ))}
          
          {/* Parent-only navigation items */}
          {user?.role === 'parent' && !viewingAsChild && parentNavItems.map(item => (
            <a
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center ${
                location === item.path
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <i className={`${item.icon} text-xl`}></i>
              <span className="text-xs mt-1">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
      
      {/* Add padding at the bottom to prevent content from being hidden behind the mobile nav */}
      <div className="md:hidden h-16"></div>
    </>
  );
}
