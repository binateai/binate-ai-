import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "@shared/schema";
import { Link } from "wouter";
import { Plus, CalendarCheck2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

type TaskCardProps = {
  tasks: Task[];
};

export default function TaskCard({ tasks }: TaskCardProps) {
  const pendingTasks = tasks.filter(task => !task.completed).slice(0, 4);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Task> }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const handleToggleComplete = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: { completed: !task.completed },
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    };
    
    return colors[priority] || colors.medium;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-border flex justify-between items-center">
        <CardTitle>Tasks & Follow-ups</CardTitle>
        <Link href="/tasks">
          <Button variant="link" className="text-sm p-0 h-auto">View all</Button>
        </Link>
      </CardHeader>
      
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {pendingTasks.map((task) => (
            <li key={task.id} className="p-4">
              <div className="flex items-center">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => handleToggleComplete(task)}
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.aiGenerated && (
                      <Badge variant="outline" className="ml-2 text-xs bg-primary-50 dark:bg-primary-900 text-primary-800 dark:text-primary-300">
                        AI generated
                      </Badge>
                    )}
                  </div>
                  {task.dueDate && (
                    <div className="mt-1 flex items-center">
                      <CalendarCheck2 className="text-muted-foreground h-3.5 w-3.5 mr-1" />
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(task.dueDate).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </Badge>
                </div>
              </div>
            </li>
          ))}
          
          {pendingTasks.length === 0 && (
            <li className="p-6 text-center">
              <p className="text-muted-foreground">No pending tasks</p>
              <Link href="/tasks">
                <Button variant="outline" size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add new task
                </Button>
              </Link>
            </li>
          )}
        </ul>
        
        <div className="px-6 py-4 border-t border-border">
          <Link href="/tasks">
            <Button variant="link" className="flex items-center text-primary p-0 h-auto">
              <Plus className="h-4 w-4 mr-1" />
              Add new task
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
