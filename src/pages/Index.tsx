
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  // Get RAG status color
  const getRagStatusColor = (ragStatus: string) => {
    switch (ragStatus) {
      case 'Green':
        return 'bg-green-100 text-green-800';
      case 'Amber':
        return 'bg-yellow-100 text-yellow-800';
      case 'Red':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'Not Started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get capabilities for each milestone and sort by milestone date
  const milestonesWithCapabilities = data.milestones
    .map(milestone => {
      const capabilities = data.capabilities.filter(cap => cap.milestone === milestone.name);
      return { milestone, capabilities };
    })
    .filter(item => item.capabilities.length > 0)
    .sort((a, b) => new Date(a.milestone.date).getTime() - new Date(b.milestone.date).getTime());

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
          {milestonesWithCapabilities.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {milestonesWithCapabilities.map(({ milestone, capabilities }) => {
                const milestoneStatus = getMilestoneStatus(new Date(milestone.date));
                const StatusIcon = milestoneStatus.icon;
                
                return (
                  <div key={milestone.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Milestone Header */}
                    <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
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
                    
                    {/* Capabilities List */}
                    <div className="divide-y divide-gray-100">
                      {capabilities.map((capability) => (
                        <div key={capability.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {capability.name}
                              </h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getRagStatusColor(capability.ragStatus)}`}
                              >
                                RAG: {capability.ragStatus}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getStatusColor(capability.status)}`}
                              >
                                {capability.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-500">
                <Calendar className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-base sm:text-lg font-medium mb-2">No milestones with capabilities</h3>
                <p className="text-xs sm:text-sm">
                  Create milestones and assign capabilities to track your project progress
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
