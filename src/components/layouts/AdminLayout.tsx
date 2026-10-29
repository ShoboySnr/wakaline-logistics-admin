"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bike,
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  Moon,
  Package,
  Plus,
  Receipt,
  Settings,
  Sun,
  UserCog,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/src/store";
import { logoutRequest } from "@/src/api/auth";
import Logo from "../atoms/Logo";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean;
}

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/dashboard/orders", icon: Package },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Riders", href: "/dashboard/riders", icon: Bike },
  { name: "Bikes", href: "/dashboard/bikes", icon: Bike },
  { name: "Expenses", href: "/dashboard/expenses", icon: Wallet },
  { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
  { name: "Credits & Plans", href: "/dashboard/credits", icon: CreditCard },
  { name: "Communications", href: "/dashboard/communications", icon: Mail },
  { name: "Job Applications", href: "/dashboard/job-applications", icon: FileText },
  { name: "Help Center", href: "/dashboard/help", icon: LifeBuoy },
  { name: "Business Intelligence", href: "/dashboard/business-intelligence", icon: BarChart3 },
  { name: "Users", href: "/dashboard/users", icon: UserCog },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, theme, toggleTheme, logout } = useStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDarkMode = theme === "dark";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {}
    logout();
    router.replace("/login");
  };

  const isActiveRoute = (href: string) => (href === "/dashboard" ? pathname === href : pathname?.startsWith(href));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const renderNav = (minimized: boolean) => (
    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
      {navigation.map((item) => {
        const isActive = isActiveRoute(item.href);
        const Icon = item.icon;
        const className = `flex items-center ${minimized ? "justify-center" : "justify-between"} gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-primary text-white shadow-md"
            : item.soon
              ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-primary"
        }`;
        const content = (
          <>
            <div className={`flex items-center gap-3 ${minimized ? "justify-center" : ""}`}>
              <Icon className="w-5 h-5" />
              {!minimized && <span>{item.name}</span>}
            </div>
            {!minimized && item.soon && (
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Soon</span>
            )}
          </>
        );

        return item.soon ? (
          <div key={item.name} className={className} title={minimized ? `${item.name} (coming soon)` : undefined}>
            {content}
          </div>
        ) : (
          <Link key={item.name} href={item.href} className={className} onClick={() => setSidebarOpen(false)} title={minimized ? item.name : undefined}>
            {content}
          </Link>
        );
      })}
    </nav>
  );

  const logoutButton = (minimized: boolean) => (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={handleLogout}
        className={`flex items-center ${minimized ? "justify-center" : "gap-3"} w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors`}
        title={minimized ? "Logout" : undefined}
      >
        <LogOut className="w-5 h-5" />
        {!minimized && <span>Logout</span>}
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
          <div className="fixed inset-0 bg-gray-600/75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
              <Logo />
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            {renderNav(false)}
            {logoutButton(false)}
          </div>
        </div>

        <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarMinimized ? "lg:w-20" : "lg:w-64"}`}>
          <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
              {!sidebarMinimized && <Logo />}
              <button
                onClick={() => setSidebarMinimized(!sidebarMinimized)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                title={sidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
              >
                {sidebarMinimized ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
              </button>
            </div>
            {renderNav(sidebarMinimized)}
            {logoutButton(sidebarMinimized)}
          </div>
        </div>

        <div className={`transition-all duration-300 ${sidebarMinimized ? "lg:pl-20" : "lg:pl-64"}`}>
          <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700 lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex-1 lg:flex-none pl-4 lg:pl-0">
                <h1 className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">
                  {getGreeting()}, {user?.name?.split(" ")[0]}!
                </h1>
              </div>
              <div className="flex items-center gap-1 md:gap-4">
                <Link
                  href="/dashboard/orders/new"
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all text-xs sm:text-sm font-medium shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Order</span>
                </Link>

                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                  title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </button>
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/dashboard/orders/new"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        New Order
                      </Link>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
