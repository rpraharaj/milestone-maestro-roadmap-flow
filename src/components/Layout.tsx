
import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Calendar, Map, MapPin, BarChart3, Settings, Target, ChevronLeft, ChevronRight } from "lucide-react";

// Titles and subtitles for each main route
const pageHeaders: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Project Dashboard",
    subtitle: "Overview of your project milestones and capabilities",
  },
  "/capabilities": {
    title: "Capability Management",
    subtitle: "Manage project capabilities and their details",
  },
  "/milestones": {
    title: "Milestone Management",
    subtitle: "Track and manage project milestones",
  },
  "/roadmap-management": {
    title: "Roadmap Management",
    subtitle: "Plan and manage capability roadmaps with version history",
  },
  "/roadmap-view": {
    title: "Roadmap View",
    subtitle: "Visualize capability timelines and progress",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Update your application configuration",
  },
};

const collapsedSidebarWidth = "w-16"; // collapsed: only icon
const expandedSidebarWidth = "w-64"; // expanded: icon + text

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Capabilities", href: "/capabilities", icon: Target },
    { name: "Milestones", href: "/milestones", icon: Calendar },
    { name: "Roadmap Management", href: "/roadmap-management", icon: Map },
    { name: "Roadmap View", href: "/roadmap-view", icon: MapPin },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Find header based on path
  // Only match main route exactly, not sub-routes
  const headerMatch =
    pageHeaders[
      Object.keys(pageHeaders).find((r) => r === location.pathname) || ""
    ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar: overlays on mobile, shows as static on desktop */}
      {/* Mobile Sidebar Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      {/* Sidebar */}
      <aside
        className={cn(
          "z-50 flex-shrink-0 bg-white shadow-lg transition-transform duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "fixed inset-y-0 left-0 translate-x-0" : "fixed inset-y-0 -translate-x-full",
          "lg:static lg:translate-x-0",
          sidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth
        )}
        style={{ height: "100vh" }}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-900 transition-all duration-200 origin-left">
              Project Manager
            </h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="mt-8 flex-1 overflow-y-auto">
          <div className="px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                    location.pathname === item.href
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    sidebarCollapsed && "justify-center"
                  )}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5 transition-all",
                      location.pathname === item.href
                        ? "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-500",
                      sidebarCollapsed ? "mr-0" : "mr-3"
                    )}
                  />
                  {/* Only show text if sidebar expanded */}
                  {!sidebarCollapsed && item.name}
                </Link>
              );
            })}
          </div>
        </nav>
        {/* Expand/Collapse Button at bottom */}
        <div className="mt-auto pb-4 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="rounded-full border"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-h-16 px-4 bg-white border-b border-gray-200 lg:px-6 py-2">
          {/* Left: menu + page title+subtitle */}
          <div className="flex items-center min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-3"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* Page Title and Subtitle on left if available */}
            {headerMatch && (
              <div className="flex flex-col min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight truncate">
                  {headerMatch.title}
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm mt-0.5 truncate">
                  {headerMatch.subtitle}
                </p>
              </div>
            )}
          </div>
          {/* Right: Date */}
          <div className="min-w-fit flex-shrink-0 text-right">
            <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <main className="flex-1 px-6 pt-2 pb-6 w-full mx-auto max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
