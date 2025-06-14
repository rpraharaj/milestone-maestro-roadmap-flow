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
  const headerMatch =
    pageHeaders[
      Object.keys(pageHeaders).find((r) => r === location.pathname) || ""
    ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Sidebar Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Enhanced Sidebar for mobile */}
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
            className="lg:hidden h-10 w-10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
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
                    "group flex items-center px-3 py-3 text-base font-medium rounded-md transition-colors touch-manipulation",
                    "lg:px-2 lg:py-2 lg:text-sm",
                    location.pathname === item.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    sidebarCollapsed && "justify-center lg:py-2"
                  )}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-6 w-6 transition-all lg:h-5 lg:w-5",
                      location.pathname === item.href
                        ? "text-gray-500"
                        : "text-gray-400 group-hover:text-gray-500",
                      sidebarCollapsed ? "mr-0" : "mr-3 lg:mr-3"
                    )}
                  />
                  {!sidebarCollapsed && item.name}
                </Link>
              );
            })}
          </div>
        </nav>
        {/* Enhanced collapse button for mobile */}
        <div className="mt-auto pb-4 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="rounded-full border h-10 w-10 lg:h-8 lg:w-8"
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
        {/* Enhanced Header for mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-h-16 px-4 bg-white border-b border-gray-200 lg:px-6 py-3 lg:py-2">
          <div className="flex items-center min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden mr-3 h-10 w-10 p-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            {headerMatch && (
              <div className="flex flex-col min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight truncate lg:text-xl">
                  {headerMatch.title}
                </h1>
                <p className="text-gray-600 text-sm mt-0.5 truncate lg:text-xs">
                  {headerMatch.subtitle}
                </p>
              </div>
            )}
          </div>
          <div className="min-w-fit flex-shrink-0 text-right">
            <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <main className="flex-1 px-4 pt-2 pb-6 w-full mx-auto max-w-7xl lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
