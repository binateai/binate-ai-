import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Task } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarClock, 
  CheckCircle2, 
  Clock, 
  Plus, 
  AlertTriangle, 
  CheckCircle,
  Circle 
} from "lucide-react";

export default function Tasks() {
  const { data: tasks, isLoading, isError } = useQuery({
    queryKey: ["/api/tasks"],
    staleTime: 5000, // Refresh data every 5 seconds
  });
  
  // Log tasks when they change
  useEffect(() => {
    if (tasks) {
      console.log("Tasks loaded successfully:", tasks);
    }
  }, [tasks]);
  
  const { toast } = useToast();
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    estimatedTime: 30,
    assignedTo: "me",
  });
  
  const createTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      return apiRequest("POST", "/api/tasks", task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
        description: "Your task has been successfully created.",
      });
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        estimatedTime: 30,
        assignedTo: "me",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });
  
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Task> }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });
  
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "Your task has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for AI time estimation
  const timeEstimationMutation = useMutation({
    mutationFn: async (taskDetails: { title: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/ai/estimate-task-time", taskDetails);
      return response.json();
    },
    onSuccess: (data) => {
      setNewTask(prev => ({
        ...prev,
        estimatedTime: data.estimatedTime
      }));
      
      toast({
        title: "Time Estimated",
        description: `Estimated time: ${data.estimatedTime} minutes (${data.confidence.toFixed(2)} confidence)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to estimate time",
        variant: "destructive",
      });
    },
  });
  
  const handleCreateTask = () => {
    createTaskMutation.mutate({
      ...newTask,
      // Just pass the string directly, the schema will handle the conversion
      dueDate: newTask.dueDate || undefined,
    });
  };
  
  // Handler for AI time estimation
  const handleEstimateTime = () => {
    // Check if we have a title at minimum
    if (!newTask.title) {
      toast({
        title: "Missing information",
        description: "Please enter a task title to estimate time",
        variant: "destructive"
      });
      return;
    }
    
    // Call the time estimation API
    timeEstimationMutation.mutate({
      title: newTask.title,
      description: newTask.description
    });
  };
  
  const handleToggleComplete = (task: Task) => {
    console.log("Toggling task completion:", task.id, "current state:", task.completed);
    updateTaskMutation.mutate(
      {
        id: task.id,
        updates: { completed: !task.completed },
      },
      {
        onSuccess: () => {
          console.log("Task completion toggled successfully");
          toast({
            title: task.completed ? "Task reopened" : "Task completed",
            description: task.completed ? "Task has been moved back to pending" : "Task has been marked as complete",
          });
        },
        onError: (error: any) => {
          console.error("Error toggling task completion:", error);
        }
      }
    );
  };
  
  const priorityStyles = {
    high: "text-red-500 bg-red-100 dark:bg-red-900 dark:bg-opacity-20",
    medium: "text-amber-500 bg-amber-100 dark:bg-amber-900 dark:bg-opacity-20",
    low: "text-green-500 bg-green-100 dark:bg-green-900 dark:bg-opacity-20",
  };
  
  const priorityIcons = {
    high: <AlertTriangle className="h-4 w-4 mr-1" />,
    medium: <Clock className="h-4 w-4 mr-1" />,
    low: <CheckCircle className="h-4 w-4 mr-1" />,
  };
  
  // Group tasks by status
  const taskArray = Array.isArray(tasks) ? tasks : [];
  const pendingTasks = taskArray.filter((task: Task) => !task.completed);
  const completedTasks = taskArray.filter((task: Task) => task.completed);
  
  // Helper function to get priority safely
  const getPriority = (task: Task) => {
    return (task.priority || "medium") as keyof typeof priorityStyles;
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Tasks & Follow-ups</h1>
          <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Task Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>New Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Estimated Time (min)</Label>
                <div className="flex gap-2">
                  <Input
                    id="estimatedTime"
                    type="number"
                    min="5"
                    className="flex-1"
                    value={newTask.estimatedTime}
                    onChange={(e) => setNewTask({ ...newTask, estimatedTime: parseInt(e.target.value) || 30 })}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEstimateTime}
                    disabled={timeEstimationMutation.isPending || !newTask.title}
                    title="AI will estimate the time needed based on your task details"
                  >
                    {timeEstimationMutation.isPending ? 
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-1"></div> : 
                      <Clock className="h-4 w-4 mr-1" />
                    }
                    Auto-estimate
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select
                  value={newTask.assignedTo}
                  onValueChange={(value) => setNewTask({ ...newTask, assignedTo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">Me</SelectItem>
                    <SelectItem value="binate_ai">Binate AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </CardContent>
          </Card>
          
          {/* Task List */}
          <Card className="lg:col-span-2">
            <Tabs defaultValue="pending">
              <CardHeader className="flex flex-row items-center justify-between p-6">
                <CardTitle>My Tasks</CardTitle>
                <TabsList>
                  <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-0">
                <TabsContent value="pending" className="m-0">
                  {isLoading ? (
                    <div className="text-center p-6">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading tasks...</p>
                    </div>
                  ) : isError ? (
                    <div className="text-center p-6 text-red-500">
                      <h3 className="mt-4 text-lg font-medium">Error loading tasks</h3>
                      <p className="mt-2 text-sm">
                        There was an error loading your tasks. Please try refreshing the page.
                      </p>
                      <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] })}>
                        Retry
                      </Button>
                    </div>
                  ) : pendingTasks.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {pendingTasks.map((task: Task) => (
                        <li key={task.id} className="p-4">
                          <div className="flex items-center">
                            <Checkbox
                              id={`task-${task.id}`}
                              checked={Boolean(task.completed)}
                              onCheckedChange={() => handleToggleComplete(task)}
                              className="h-5 w-5"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center">
                                <p className="text-sm font-medium">{task.title}</p>
                                {task.aiGenerated && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-secondary/20">
                                    AI generated
                                  </Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                              )}
                              <div className="mt-1 flex items-center gap-3">
                                {task.dueDate && (
                                  <div className="flex items-center">
                                    <CalendarClock className="text-muted-foreground h-3.5 w-3.5 mr-1" />
                                    <p className="text-xs text-muted-foreground">
                                      Due {formatDate(task.dueDate)}
                                    </p>
                                  </div>
                                )}
                                {task.estimatedTime && (
                                  <div className="flex items-center">
                                    <Clock className="text-muted-foreground h-3.5 w-3.5 mr-1" />
                                    <p className="text-xs text-muted-foreground">
                                      {task.estimatedTime} min
                                    </p>
                                  </div>
                                )}
                                {task.assignedTo && (
                                  <div className="flex items-center">
                                    <Badge variant="outline" className="text-xs">
                                      {task.assignedTo === "me" ? "Assigned to me" : "Assigned to Binate AI"}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                              <Badge className={priorityStyles[getPriority(task)]}>
                                <div className="flex items-center">
                                  {priorityIcons[getPriority(task)]}
                                  <span>{getPriority(task).charAt(0).toUpperCase() + getPriority(task).slice(1)}</span>
                                </div>
                              </Badge>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center p-6">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                      <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        You have no pending tasks. Create a new task to get started.
                      </p>
                      <Button className="mt-4" onClick={() => document.getElementById("title")?.focus()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Task
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="m-0">
                  {isLoading ? (
                    <div className="text-center p-6">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                      <p className="mt-2 text-sm text-muted-foreground">Loading tasks...</p>
                    </div>
                  ) : completedTasks.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {completedTasks.map((task: Task) => (
                        <li key={task.id} className="p-4">
                          <div className="flex items-center">
                            <Checkbox
                              id={`task-${task.id}`}
                              checked={Boolean(task.completed)}
                              onCheckedChange={() => handleToggleComplete(task)}
                              className="h-5 w-5"
                            />
                            <div className="ml-3 flex-1">
                              <p className="text-sm line-through text-muted-foreground">{task.title}</p>
                              {task.description && (
                                <p className="text-sm line-through text-muted-foreground mt-1">{task.description}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTaskMutation.mutate(task.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              Delete
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center p-6">
                      <Circle className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                      <h3 className="mt-4 text-lg font-medium">No completed tasks</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        You haven't completed any tasks yet.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </Layout>
  );
}