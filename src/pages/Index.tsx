
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Calendar, Map, BarChart3 } from "lucide-react";

const Index = () => {
  const { data } = useData();

  const stats = [
    {
      title: "Total Capabilities",
      value: data.capabilities.length,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Milestones",
      value: data.milestones.length,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Roadmap Plans",
      value: data.roadmapPlans.filter(plan => plan.isActive).length,
      icon: Map,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Completed Capabilities",
      value: data.capabilities.filter(cap => cap.status === 'Completed').length,
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                      {stat.title}
                    </p>
                    <p className="text-lg sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-full ${stat.bgColor} flex-shrink-0 ml-2`}>
                    <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Index;
