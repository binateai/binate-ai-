import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, addDays, subDays, isAfter, isBefore, isEqual } from "date-fns";
import { Bell, Calendar, Mail, Info, Check, X, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Follow-up types
const FOLLOW_UP_TYPES: Array<{
  id: "pre-due" | "due-date" | "post-due";
  label: string;
  days: number;
  description: string;
}> = [
  { id: "pre-due", label: "Pre-Due Reminder", days: -1, description: "Sent 1 day before the due date" },
  { id: "due-date", label: "Due Date Reminder", days: 0, description: "Sent on the invoice due date" },
  { id: "post-due", label: "Overdue Reminder", days: 3, description: "Sent 3 days after the due date" },
];

export default function AutomatedFollowUps() {
  const { toast } = useToast();
  const [enabledFollowUps, setEnabledFollowUps] = useState({
    "pre-due": true,
    "due-date": true,
    "post-due": true,
  });
  const [followUpTemplates, setFollowUpTemplates] = useState({
    "pre-due": "Hello {{client}},\n\nThis is a friendly reminder that invoice #{{invoice_number}} for {{amount}} is due tomorrow. Please let us know if you have any questions or need additional information.\n\nBest regards,\n{{user_name}}",
    "due-date": "Hello {{client}},\n\nJust a reminder that invoice #{{invoice_number}} for {{amount}} is due today. Please process the payment at your earliest convenience.\n\nThank you,\n{{user_name}}",
    "post-due": "Hello {{client}},\n\nI wanted to follow up regarding invoice #{{invoice_number}} for {{amount}} which was due on {{due_date}} and is now 3 days overdue. Please let us know when we can expect payment.\n\nBest regards,\n{{user_name}}",
  });
  
  // Load user settings
  const { data: userSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/user/settings"],
  });
  
  // Load upcoming follow-ups
  const { data: upcomingFollowUps, isLoading: isLoadingFollowUps } = useQuery({
    queryKey: ["/api/invoices/upcoming-follow-ups"],
  });
  
  // Load follow-up history
  const { data: followUpHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/invoices/follow-up-history"],
  });
  
  // Save follow-up settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return apiRequest("POST", "/api/user/settings/follow-ups", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({
        title: "Settings saved",
        description: "Your follow-up settings have been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    }
  });
  
  // Toggle follow-up type
  const toggleFollowUpType = (type: "pre-due" | "due-date" | "post-due") => {
    setEnabledFollowUps(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };
  
  // Update template text
  const updateTemplate = (type: "pre-due" | "due-date" | "post-due", text: string) => {
    setFollowUpTemplates(prev => ({
      ...prev,
      [type]: text,
    }));
  };
  
  // Save settings
  const saveSettings = () => {
    saveSettingsMutation.mutate({
      enabledFollowUps,
      followUpTemplates,
    });
  };
  
  // Calculate status badge for upcoming follow-ups
  const getStatusBadge = (daysUntil: number) => {
    if (daysUntil === 0) {
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          Today
        </Badge>
      );
    } else if (daysUntil === 1) {
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          Tomorrow
        </Badge>
      );
    } else if (daysUntil <= 3) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Soon
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          In {daysUntil} days
        </Badge>
      );
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Automated Follow-Ups</CardTitle>
        <CardDescription>
          Set up automated reminders for invoice due dates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Reminders</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              {FOLLOW_UP_TYPES.map((type) => (
                <div key={type.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                        <Label htmlFor={`${type.id}-switch`} className="font-medium">
                          {type.label}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    <Switch
                      id={`${type.id}-switch`}
                      checked={enabledFollowUps[type.id as keyof typeof enabledFollowUps]}
                      onCheckedChange={() => toggleFollowUpType(type.id as "pre-due" | "due-date" | "post-due")}
                    />
                  </div>
                  
                  {enabledFollowUps[type.id as keyof typeof enabledFollowUps] && (
                    <div className="pl-6 border-l-2 border-muted space-y-2">
                      <Label htmlFor={`${type.id}-template`} className="text-sm">
                        Email Template
                      </Label>
                      <Textarea
                        id={`${type.id}-template`}
                        placeholder="Enter email template..."
                        rows={6}
                        value={followUpTemplates[type.id as keyof typeof followUpTemplates]}
                        onChange={(e) => updateTemplate(type.id as "pre-due" | "due-date" | "post-due", e.target.value)}
                        className="font-mono text-sm"
                      />
                      <div className="flex items-start space-x-2 p-2 bg-muted/50 rounded text-xs">
                        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">
                          Available variables: <code>{"{{client}}"}</code>, <code>{"{{invoice_number}}"}</code>, <code>{"{{amount}}"}</code>, <code>{"{{due_date}}"}</code>, <code>{"{{user_name}}"}</code>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={saveSettings}
                disabled={saveSettingsMutation.isPending}
                className="w-full sm:w-auto"
              >
                {saveSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </div>
          </TabsContent>
          
          {/* Upcoming Tab */}
          <TabsContent value="upcoming">
            {isLoadingFollowUps ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Loading upcoming reminders...</p>
              </div>
            ) : upcomingFollowUps && upcomingFollowUps.length > 0 ? (
              <div className="space-y-4">
                {/* This would normally use real data from the API */}
                <div className="grid gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="space-y-1">
                        <div className="font-medium">Acme Inc.</div>
                        <div className="text-sm text-muted-foreground">Invoice #INV-2024-00{i+1}</div>
                        <div className="text-sm">{formatCurrency(1500 + i * 350)}</div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex justify-end items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(addDays(new Date(), i + 1), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div>
                          {getStatusBadge(i + 1)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {i === 0 ? 'Pre-Due Reminder' : (i === 1 ? 'Due Date Reminder' : 'Overdue Reminder')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Send All Now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-2 font-medium">No upcoming reminders</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  All invoices are either paid or don't have any reminders scheduled.
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history">
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Loading follow-up history...</p>
              </div>
            ) : followUpHistory && followUpHistory.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {/* This would normally use real data from the API */}
                {[...Array(5)].map((_, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center">
                          <div className="mr-4">
                            {i % 3 === 0 ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <Mail className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="font-medium">Invoice #INV-2024-00{9-i}</div>
                            <div className="text-sm text-muted-foreground">Company {String.fromCharCode(65 + i)}</div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(subDays(new Date(), i + 1), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-9 border-l-2 border-muted space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Type:</span>
                          <span className="text-sm">
                            {i % 3 === 0 ? 'Pre-Due Reminder' : (i % 3 === 1 ? 'Due Date Reminder' : 'Overdue Reminder')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Status:</span>
                          <Badge variant={i % 3 === 0 ? "default" : "outline"}>
                            {i % 3 === 0 ? 'Opened' : 'Sent'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Recipient:</span>
                          <span className="text-sm">client{i+1}@example.com</span>
                        </div>
                        <div className="mt-4">
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4 mr-2" />
                            Send Again
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-2 font-medium">No follow-up history</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No reminders have been sent yet.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t bg-muted/50 flex items-start space-x-2 text-sm text-muted-foreground p-4">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          Automated follow-ups are sent according to your schedule. Pre-due reminders are sent one day before the due date, due date reminders are sent on the due date, and overdue reminders are sent three days after the due date.
        </p>
      </CardFooter>
    </Card>
  );
}