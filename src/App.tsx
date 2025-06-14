
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "./contexts/DataContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import CapabilityManagement from "./pages/CapabilityManagement";
import MilestoneManagement from "./pages/MilestoneManagement";
import RoadmapManagement from "./pages/RoadmapManagement";
import RoadmapView from "./pages/RoadmapView";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DataProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="/capabilities" element={<CapabilityManagement />} />
              <Route path="/milestones" element={<MilestoneManagement />} />
              <Route path="/roadmap-management" element={<RoadmapManagement />} />
              <Route path="/roadmap-view" element={<RoadmapView />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
