import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, FileText, Mail, Shield, CheckCircle, AlertCircle } from "lucide-react";

interface ActivityLog {
  id: number;
  userId: number;
  date: string;
  taskType: string;
  description: string;
  details: any;
  source: string;
  cost: string;
  status: string;
  createdAt: string;
}

export default function ActivitySummary() {
  const { data: activities, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/activity-log'],
  });

  const today = new Date().toISOString().split('T')[0];
  const todayActivities = activities?.filter(activity => activity.date === today) || [];

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'expense_created': return <DollarSign className="h-4 w-4" />;
      case 'email_processing': return <Mail className="h-4 w-4" />;
      case 'system_protection': return <Shield className="h-4 w-4" />;
      case 'invoice_handled': return <FileText className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const totalCostToday = todayActivities.reduce((sum, activity) => {
    const cost = activity.cost?.replace('€', '').replace(',', '');
    return sum + (parseFloat(cost) || 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Daily Activity Summary</h1>
          <p className="text-gray-600">What Binate AI accomplished today</p>
        </div>
      </div>

      {/* Today's Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayActivities.length}</div>
            <p className="text-xs text-muted-foreground">Actions taken today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalCostToday.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total spent today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Protected</div>
            <p className="text-xs text-muted-foreground">AI processing disabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Activities ({today})
          </CardTitle>
          <CardDescription>
            Detailed log of what Binate AI accomplished for you today
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activities recorded for today yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getTaskIcon(activity.taskType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{activity.description}</h3>
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(activity.status)} text-white`}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Type:</strong> {activity.taskType.replace('_', ' ')}</p>
                      <p><strong>Source:</strong> {activity.source}</p>
                      {activity.cost && activity.cost !== '€0.00' && (
                        <p><strong>Cost:</strong> {activity.cost}</p>
                      )}
                      {activity.details && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <strong>Details:</strong> {JSON.stringify(activity.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Alert */}
      {totalCostToday > 20 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              High API Usage Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              Today's API costs (€{totalCostToday.toFixed(2)}) are higher than usual. 
              AI processing has been disabled to protect your credits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}