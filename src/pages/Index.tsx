
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Calendar, Map, BarChart3, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";

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

  // Get milestone status based on date
  const getMilestoneStatus = (date: Date) => {
    const now = new Date();
    const warningThreshold = addDays(date, -7); // 7 days before target
    
    if (isBefore(now, warningThreshold)) {
      return { status: 'on-track', icon: Clock, color: 'text-green-600', bgColor: 'bg-green-100' };
    } else if (isBefore(now, date)) {
      return { status: 'warning', icon: AlertCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    } else {
      return { status: 'overdue', icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-100' };
    }
  };

  // Sort milestones by date
  const sortedMilestones = [...data.milestones].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

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

      {/* Project Timeline */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Project Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {sortedMilestones.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {sortedMilestones.map((milestone) => {
                const milestoneStatus = getMilestoneStatus(new Date(milestone.date));
                const StatusIcon = milestoneStatus.icon;
                
                return (
                  <div key={milestone.id} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-full ${milestoneStatus.bgColor} flex-shrink-0`}>
                      <StatusIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${milestoneStatus.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                            {milestone.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Milestone deadline
                          </p>
                        </div>
                        <div className="flex flex-col sm:items-end gap-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            {format(new Date(milestone.date), "MMM dd, yyyy")}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            milestoneStatus.status === 'on-track' 
                              ? 'bg-green-100 text-green-800' 
                              : milestoneStatus.status === 'warning'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {milestoneStatus.status === 'on-track' ? 'On Track' : 
                             milestoneStatus.status === 'warning' ? 'Due Soon' : 'Overdue'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-500">
                <Calendar className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-base sm:text-lg font-medium mb-2">No milestones yet</h3>
                <p className="text-xs sm:text-sm">
                  Create milestones to track your project progress
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
