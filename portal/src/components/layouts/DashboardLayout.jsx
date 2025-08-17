//src/components/layouts/DashboardLayout.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  LogOut,
  Menu,
  Clock,
  Settings,
  User,
  Sun,
  Moon,
  Zap,
  MessageSquare,
  HelpCircle,
  Bell,
  Search,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigationItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/admin/",
    },
    {
      title: "Users",
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "Prayer Times",
      icon: Clock,
      href: "/admin/prayer-times",
    },
    {
      title: "Working Hours",
      icon: Clock,
      href: "/admin/working-hours",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/admin/" || path === "/admin") return "Lab System Dashboard";
    if (path.includes("/users")) return "User Management";
    if (path.includes("/prayer-times")) return "Prayer Times";
    if (path.includes("/working-hours")) return "Working Hours";
    return "Dashboard";
  };

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Floating Sidebar */}
      <aside
        className={cn(
          "fixed top-4 left-4 bottom-4 w-72 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl transition-all duration-300 z-50",
          "md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  Lab System
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  IoT Management
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Menu className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "group flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:translate-x-1"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-white" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                    )} />
                    <span>{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {user?.username?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.username || 'User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.role || 'Admin'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:ml-80 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex h-16 items-center justify-between px-4 md:px-8">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Welcome back, {user?.username || 'there'}
                </p>
              </div>
            </div>

            {/* Center Section - Search */}
            <div className="flex-1 max-w-md mx-8 hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-slate-200 dark:hover:ring-slate-700 transition-all"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.avatar} alt={user?.username} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                        {getUserInitials(user?.username)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-xl shadow-2xl" 
                  align="end" 
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user?.avatar} alt={user?.username} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                          {getUserInitials(user?.username)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {user?.username || 'User Name'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {user?.email || 'user@example.com'}
                        </p>
                        <span className="inline-flex items-center px-2 py-1 mt-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                          {user?.role || 'Admin'}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-700/50" />
                  
               
                  
              
                  <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-700/50" />
                  
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mx-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};