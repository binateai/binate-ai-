import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Task } from "@shared/schema";
import { Pencil, Plus, Trash2, Check, X, CalendarClock, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeadTasksProps {
  leadId: number;
}

export default function LeadTasks({ leadId }: LeadTasksProps) {
  const { toast } = useToast();
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    assignedTo: "me",
    estimatedTime: 30,
  });

  // Fetch tasks related to this lead
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/leads", leadId, "tasks"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/leads/${leadId}/tasks`);
      return await response.json();
    },
  });

  // Create a new task
  const createTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      const response = await apiRequest("POST", "/api/tasks", {
        ...task,
        leadId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "tasks"] });
      setShowTaskDialog(false);
      setNewTask({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        assignedTo: "me",
        estimatedTime: 30,
      });
      toast({
        title: "Task created",
        description: "The task has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update an existing task
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: number; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "tasks"] });
      setShowTaskDialog(false);
      setTaskToEdit(null);
      toast({
        title: "Task updated",
        description: "The task has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete a task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "tasks"] });
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting task",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // AI time estimation
  const timeEstimationMutation = useMutation({
    mutationFn: async (taskDetails: { title: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/ai/estimate-task-time", taskDetails);
      return await response.json();
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
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to estimate time",
        variant: "destructive",
      });
    },
  });

  // Toggle task completion status
  const toggleTaskCompletionMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: number; completed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, { completed });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "tasks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    createTaskMutation.mutate({
      title: newTask.title,
      description: newTask.description || "",
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null,
      priority: newTask.priority,
      assignedTo: newTask.assignedTo,
      estimatedTime: newTask.estimatedTime,
      completed: false,
    });
  };

  const handleUpdateTask = () => {
    if (!taskToEdit) return;
    updateTaskMutation.mutate({
      taskId: taskToEdit.id,
      updates: {
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : null,
        priority: newTask.priority,
        assignedTo: newTask.assignedTo,
        estimatedTime: newTask.estimatedTime,
      },
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

  const openEditTaskDialog = (task: Task) => {
    setTaskToEdit(task);
    setNewTask({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      priority: task.priority || "medium",
      assignedTo: task.assignedTo || "me",
      estimatedTime: task.estimatedTime || 30,
    });
    setShowTaskDialog(true);
  };

  const openCreateTaskDialog = () => {
    setTaskToEdit(null);
    setNewTask({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      assignedTo: "me",
      estimatedTime: 30,
    });
    setShowTaskDialog(true);
  };

  function getPriorityBadge(priority: string | null) {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="default">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Tasks</CardTitle>
        <Button onClick={openCreateTaskDialog} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No tasks associated with this lead yet.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border rounded-md p-3 flex items-start gap-3 bg-card"
              >
                <div className="pt-0.5">
                  <Checkbox
                    checked={task.completed || false}
                    onCheckedChange={(checked) =>
                      toggleTaskCompletionMutation.mutate({
                        taskId: task.id,
                        completed: checked as boolean,
                      })
                    }
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </h4>
                    {getPriorityBadge(task.priority)}
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {task.dueDate && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <CalendarClock className="h-3 w-3 mr-1" />
                        {format(new Date(task.dueDate), "MMM d, yyyy")}
                      </div>
                    )}
                    
                    {task.estimatedTime && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {task.estimatedTime} min
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs">
                    <Badge variant="outline" className="text-xs">
                      Assigned to: {task.assignedTo === "binate_ai" ? "Binate AI" : "Me"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditTaskDialog(task)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Task Dialog */}
        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{taskToEdit ? "Edit Task" : "Create Task"}</DialogTitle>
              <DialogDescription>
                {taskToEdit
                  ? "Update the details of this task."
                  : "Add a new task for this lead."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Task description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, priority: value })
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select
                    value={newTask.assignedTo}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, assignedTo: value })
                    }
                  >
                    <SelectTrigger id="assignedTo">
                      <SelectValue placeholder="Select who will handle this task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="me">Me</SelectItem>
                      <SelectItem value="binate_ai">Binate AI</SelectItem>
                    </SelectContent>
                  </Select>
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
                      onChange={(e) =>
                        setNewTask({ ...newTask, estimatedTime: parseInt(e.target.value) || 30 })
                      }
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
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={taskToEdit ? handleUpdateTask : handleCreateTask}
                disabled={!newTask.title}
              >
                {taskToEdit ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}