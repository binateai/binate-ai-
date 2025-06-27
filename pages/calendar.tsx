import Layout from "@/components/layout/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@shared/schema";
import { formatDate, formatTime, formatDateForAPI } from "@/lib/utils";
import { Calendar as CalendarIcon, Clock, MapPin, Video, MoreVertical, Plus, AlertCircle, RefreshCw, Sparkles, Search, Check, X, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function CalendarPage() {
  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ["/api/events"],
  });
  
  // Get Google account connection status
  const { data: connectedServices, isLoading: isLoadingServices } = useQuery({
    queryKey: ["/api/connected-services"],
  });
  
  // Check if Google is connected
  const isGoogleConnected = Array.isArray(connectedServices) && connectedServices.some(
    (service: any) => service.service === "google" && service.connected
  );
  
  const { toast } = useToast();
  
  // State for detected meetings before confirming
  const [detectedMeetings, setDetectedMeetings] = useState<any[]>([]);
  const [showDetectedDialog, setShowDetectedDialog] = useState(false);
  const [selectedMeetingTab, setSelectedMeetingTab] = useState("all");
  const [selectedMeetings, setSelectedMeetings] = useState<Record<number, boolean>>({});
  
  // Handle meeting confirmation
  const confirmMeetingsMutation = useMutation({
    mutationFn: async (meetingIds: number[]) => {
      const response = await apiRequest("POST", "/api/calendar/confirm-meetings", { meetingIds });
      return await response.json();
    },
    onSuccess: () => {
      // Close dialog and clear state
      setShowDetectedDialog(false);
      setDetectedMeetings([]);
      setSelectedMeetings({});
      
      // Refetch events
      refetch();
      
      toast({
        title: "Meetings confirmed",
        description: "The selected meetings have been added to your calendar.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to confirm meetings",
        description: error.message || "There was an error adding meetings to your calendar.",
        variant: "destructive",
      });
    }
  });
  
  // Toggle meeting selection
  const toggleMeetingSelection = (meetingId: number) => {
    setSelectedMeetings(prev => ({
      ...prev,
      [meetingId]: !prev[meetingId]
    }));
  };
  
  // Select or deselect all meetings
  const toggleAllMeetings = (select: boolean) => {
    const newSelections: Record<number, boolean> = {};
    
    detectedMeetings.forEach(meeting => {
      newSelections[meeting.id] = select;
    });
    
    setSelectedMeetings(newSelections);
  };
  
  // Handle confirmation of selected meetings
  const handleConfirmMeetings = () => {
    const selectedIds = Object.entries(selectedMeetings)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => parseInt(id));
    
    if (selectedIds.length === 0) {
      toast({
        title: "No meetings selected",
        description: "Please select at least one meeting to confirm.",
        variant: "destructive",
      });
      return;
    }
    
    confirmMeetingsMutation.mutate(selectedIds);
  };
  
  // Meeting detection step 1: Scan emails and detect potential meetings
  const scanMeetingsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/calendar/auto-detect");
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.eventsDetected > 0 && data.eventsCreated && data.eventsCreated.length > 0) {
        // Store the detected meetings
        setDetectedMeetings(data.eventsCreated);
        
        // Initialize selection state - auto-select high confidence meetings
        const initialSelections: Record<number, boolean> = {};
        data.eventsCreated.forEach((meeting: any) => {
          // Auto-select meetings with confidence score ≥ 80%
          initialSelections[meeting.id] = meeting.aiConfidence ? meeting.aiConfidence >= 80 : false;
        });
        setSelectedMeetings(initialSelections);
        
        // Show confirmation dialog
        setShowDetectedDialog(true);
        
        toast({
          title: "Meetings detected",
          description: `Found ${data.eventsDetected} potential meetings in your emails. Please review them.`,
        });
      } else {
        toast({
          title: "No meetings found",
          description: "No potential meetings were found in your recent emails.",
        });
      }
      
      // Always refetch to update the calendar
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Meeting detection failed",
        description: error.message || "There was an error scanning your emails for meetings.",
        variant: "destructive",
      });
    }
  });
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    meetingUrl: "",
    startTime: "",
    endTime: "",
    attendees: "",
  });
  
  // Log events for debugging
  useEffect(() => {
    if (events) {
      console.log("Calendar events loaded:", events);
    }
  }, [events]);

  const handleCreateEvent = async () => {
    try {
      // Validate required fields
      if (!newEvent.title) {
        throw new Error("Event title is required");
      }
      
      if (!newEvent.startTime) {
        throw new Error("Start time is required");
      }
      
      if (!newEvent.endTime) {
        throw new Error("End time is required");
      }
      
      // Validate date input fields
      console.log("Raw date inputs:", { 
        startTime: newEvent.startTime, 
        endTime: newEvent.endTime 
      });
      
      // Validate and parse date strings
      let startDate, endDate;
      try {
        startDate = new Date(newEvent.startTime);
        endDate = new Date(newEvent.endTime);
        
        console.log("Parsed dates:", { 
          startDate: startDate, 
          endDate: endDate, 
          startValid: !isNaN(startDate.getTime()),
          endValid: !isNaN(endDate.getTime())
        });
        
        // Validate dates are valid
        if (isNaN(startDate.getTime())) {
          throw new Error("Invalid start time format");
        }
        
        if (isNaN(endDate.getTime())) {
          throw new Error("Invalid end time format");
        }
        
        // Validate start time is before end time
        if (startDate >= endDate) {
          throw new Error("End time must be after start time");
        }
      } catch (error) {
        console.error("Date parsing error:", error);
        throw new Error("Failed to parse date fields: " + error.message);
      }
      
      const attendeesArray = newEvent.attendees
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);
      
      // Convert date strings to ISO format compatible with the server
      // For datetime-local inputs, we get strings like "2025-04-28T15:25"
      // We need to explicitly format these for server compatibility
      let startTimeStr, endTimeStr;
      
      try {
        // Proper ISO format for the server
        startTimeStr = startDate.toISOString();
        endTimeStr = endDate.toISOString();
      } catch (error: any) {
        console.error("Failed to convert dates to ISO strings:", error.message || error);
        // Fallback to sending the original string values
        startTimeStr = newEvent.startTime;
        endTimeStr = newEvent.endTime;
      }
      
      // Create event data with string dates
      const eventData = {
        title: newEvent.title,
        description: newEvent.description || "",
        location: newEvent.location || "",
        meetingUrl: newEvent.meetingUrl || "",
        // Use string dates
        startTime: startTimeStr,
        endTime: endTimeStr,
        attendees: attendeesArray || [],
        temporary: false,
      };
      
      // Log for debugging
      console.log("Sending event data:", eventData);
      
      await apiRequest("POST", "/api/events", eventData);
      
      // Force refetch events to update UI immediately
      await refetch();
      
      // Different message based on Google connection
      if (isGoogleConnected) {
        toast({
          title: "Event created",
          description: "Your event has been scheduled and synced with Google Calendar.",
        });
      } else {
        toast({
          title: "Event created",
          description: "Your event has been saved locally. Connect Google Calendar to enable meeting invites and syncing.",
        });
      }
      
      setOpen(false);
      setNewEvent({
        title: "",
        description: "",
        location: "",
        meetingUrl: "",
        startTime: "",
        endTime: "",
        attendees: "",
      });
    } catch (error: any) {
      // Show more descriptive error message
      const errorMessage = error.message || "Failed to create event";
      
      // Check if it's a Google-related error
      const isGoogleError = errorMessage.toLowerCase().includes("google") || 
                           errorMessage.toLowerCase().includes("calendar");
      
      toast({
        title: isGoogleError ? "Google Calendar Error" : "Error Creating Event",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  // Filter events by selected date
  const eventsArray = Array.isArray(events) ? events : [];
  const filteredEvents = eventsArray.filter((event: Event) => {
    if (!date) return false;
    if (!event.startTime) return false;
    
    const eventDate = new Date(event.startTime);
    const selectedDate = new Date(date);
    
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
  });
  
  return (
    <Layout>
      <div className="space-y-6">
        {!isGoogleConnected && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Google account not connected</AlertTitle>
            <AlertDescription>
              Your Google Calendar isn't connected. Local calendar features will work, but calendar sync and meeting invites require a Google account connection.
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/settings"}>
                  Go to Settings
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => refetch()} 
              title="Refresh calendar"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="outline"
              onClick={() => scanMeetingsMutation.mutate()}
              disabled={scanMeetingsMutation.isPending || !isGoogleConnected}
              title="Scan emails for potential meetings"
              className="text-xs"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {scanMeetingsMutation.isPending ? "Scanning..." : "Auto-Detect Meetings"}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>New Meeting</DialogTitle>
                  <DialogDescription>
                    Schedule a new meeting or event. Fill out the details below.
                  </DialogDescription>
                </DialogHeader>
                
                {/* Google Connection Warning */}
                {!isGoogleConnected && (
                  <div className="bg-destructive/20 border border-destructive rounded-md p-3 text-destructive mb-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <div className="text-sm">
                        <p><strong>Google account not connected</strong></p>
                        <p>Events will be saved locally, but meeting invites and calendar sync require a Google account connection.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="title"
                      placeholder="Meeting title"
                      className="col-span-3"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Meeting description"
                      className="col-span-3"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location" className="text-right">
                      Location
                    </Label>
                    <Input
                      id="location"
                      placeholder="Physical location (optional)"
                      className="col-span-3"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="meetingUrl" className="text-right">
                      Meeting URL
                    </Label>
                    <Input
                      id="meetingUrl"
                      placeholder="Video conference link (optional)"
                      className="col-span-3"
                      value={newEvent.meetingUrl}
                      onChange={(e) => setNewEvent({ ...newEvent, meetingUrl: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="startTime" className="text-right">
                      Start Time
                    </Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      className="col-span-3"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="endTime" className="text-right">
                      End Time
                    </Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      className="col-span-3"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="attendees" className="text-right">
                      Attendees
                    </Label>
                    <Input
                      id="attendees"
                      placeholder="Email addresses (comma separated)"
                      className="col-span-3"
                      value={newEvent.attendees}
                      onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateEvent}>Create Meeting</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Component */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                components={{
                  DayContent: (props) => {
                    // Check if this day has an event by comparing date (without time)
                    const hasEvent = eventsArray.some(event => {
                      const eventDate = new Date(event.startTime);
                      
                      return (
                        eventDate.getDate() === props.date.getDate() &&
                        eventDate.getMonth() === props.date.getMonth() &&
                        eventDate.getFullYear() === props.date.getFullYear()
                      );
                    });
                    
                    // Return styled day content
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className={`flex items-center justify-center ${hasEvent ? 'bg-blue-500 text-white font-bold' : ''}`} 
                             style={{width: '35px', height: '35px', borderRadius: '50%'}}>
                          {props.date.getDate()}
                        </div>
                        {hasEvent && <div className="absolute bottom-1 w-2 h-2 rounded-full bg-blue-500"></div>}
                      </div>
                    );
                  }
                }}
              />
            </CardContent>
          </Card>
          
          {/* Events for Selected Date */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Events for {date ? formatDate(date) : "Today"}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center p-6">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading events...</p>
                </div>
              ) : filteredEvents && filteredEvents.length > 0 ? (
                <div className="space-y-4">
                  {filteredEvents.map((event: Event) => (
                    <div key={event.id} className="flex items-start border-l-4 border-primary pl-4 py-2">
                      <div className="w-16">
                        <p className="text-sm font-medium">{formatTime(event.startTime)}</p>
                      </div>
                      <div className="ml-4 flex-1">
                        <h5 className="text-sm font-semibold">{event.title}</h5>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </p>
                        {event.description && (
                          <p className="text-sm mt-1">{event.description}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {event.location && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.meetingUrl && (
                            <div className="flex items-center text-xs text-primary">
                              <Video className="h-3 w-3 mr-1" />
                              <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                Join Meeting
                              </a>
                            </div>
                          )}
                        </div>
                        
                        {event.aiNotes && (
                          <div className="mt-2 p-2 bg-secondary/20 rounded border border-border">
                            <div className="flex items-start">
                              <svg className="h-4 w-4 text-primary mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3L4.5 9L4.5 15L12 21L19.5 15V9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 12L4.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 12L19.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <div>
                                <p className="text-xs font-medium">AI Meeting Prep</p>
                                <p className="text-xs text-muted-foreground">{event.aiNotes}</p>
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                  View details
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="ml-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                  <h3 className="mt-4 text-lg font-medium">No events scheduled</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No events scheduled for {date ? formatDate(date) : "today"}.
                  </p>
                  <Button className="mt-4" onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Meeting
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Detected Meetings Dialog */}
        <Dialog open={showDetectedDialog} onOpenChange={setShowDetectedDialog}>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                Detected Meetings
              </DialogTitle>
              <DialogDescription>
                We found the following potential meetings in your emails. Review and confirm the meetings you'd like to add to your calendar.
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-100 mr-2"></div>
                    <span>≥80% confidence: Highly likely meetings</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-100 mr-2"></div>
                    <span>50-79% confidence: Possible meetings</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-100 mr-2"></div>
                    <span>&lt;50% confidence: Low certainty</span>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            {/* Meeting Selection Controls */}
            <div className="flex items-center justify-between my-2 pb-2 border-b">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toggleAllMeetings(true)}
                  className="text-xs"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toggleAllMeetings(false)}
                  className="text-xs"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Deselect All
                </Button>
              </div>
              
              <Tabs defaultValue="all" onValueChange={setSelectedMeetingTab}>
                <TabsList className="grid grid-cols-3 w-[300px]">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="future">Upcoming</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Meeting List */}
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-3">
                {detectedMeetings.length === 0 ? (
                  <div className="text-center py-8">
                    <Info className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">No meetings detected</p>
                  </div>
                ) : (
                  detectedMeetings
                    .filter(meeting => {
                      const meetingDate = new Date(meeting.startTime);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      if (selectedMeetingTab === "all") return true;
                      if (selectedMeetingTab === "today") {
                        return meetingDate.toDateString() === today.toDateString();
                      }
                      if (selectedMeetingTab === "future") {
                        return meetingDate > today && meetingDate.toDateString() !== today.toDateString();
                      }
                      return true;
                    })
                    .map(meeting => (
                      <div 
                        key={meeting.id} 
                        className={`border rounded-lg p-3 flex items-start relative overflow-hidden ${
                          selectedMeetings[meeting.id] ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                        onClick={() => toggleMeetingSelection(meeting.id)}
                      >
                        {/* Confidence level indicator */}
                        {meeting.aiConfidence && (
                          <div className={`absolute top-0 left-0 w-1 h-full 
                            ${meeting.aiConfidence >= 80 ? 'bg-green-400' : 
                              meeting.aiConfidence >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}>
                          </div>
                        )}
                        <div className="flex items-center h-full pr-3 pl-2">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            selectedMeetings[meeting.id] ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}>
                            {selectedMeetings[meeting.id] && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h4 className="text-sm font-medium line-clamp-1">{meeting.title}</h4>
                            <div className="flex space-x-1">
                              {meeting.emailId && (
                                <Badge variant="outline" className="text-xs">From Email</Badge>
                              )}
                              {meeting.aiConfidence && (
                                <>
                                  {meeting.aiConfidence >= 80 && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                                      {meeting.aiConfidence}% Confidence
                                    </Badge>
                                  )}
                                  {meeting.aiConfidence >= 50 && meeting.aiConfidence < 80 && (
                                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                      {meeting.aiConfidence}% Confidence
                                    </Badge>
                                  )}
                                  {meeting.aiConfidence < 50 && (
                                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 hover:bg-red-200">
                                      {meeting.aiConfidence}% Confidence
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-1 text-xs flex flex-wrap gap-y-1 gap-x-3 text-muted-foreground">
                            <div className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              <span>{formatDate(new Date(meeting.startTime))}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>
                                {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                              </span>
                            </div>
                            {meeting.location && (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{meeting.location}</span>
                              </div>
                            )}
                            {meeting.attendees && meeting.attendees.length > 0 && (
                              <div className="w-full mt-1">
                                <span>With: {Array.isArray(meeting.attendees) ? meeting.attendees.join(', ') : meeting.attendees}</span>
                              </div>
                            )}
                          </div>
                          
                          {(meeting.description || meeting.contextNotes) && (
                            <div className="mt-2 text-xs text-muted-foreground border-t pt-1">
                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="details" className="border-0">
                                  <AccordionTrigger className="p-0 text-xs font-normal hover:no-underline">
                                    View Meeting Details
                                  </AccordionTrigger>
                                  <AccordionContent className="text-xs pt-2 pb-0">
                                    {meeting.description && (
                                      <div className="mb-2">
                                        <strong>Description:</strong> {meeting.description}
                                      </div>
                                    )}
                                    {meeting.contextNotes && (
                                      <div className="mb-2">
                                        <strong>AI Analysis:</strong> {meeting.contextNotes}
                                      </div>
                                    )}
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
            
            <DialogFooter className="border-t pt-4 mt-4">
              <div className="flex items-center text-xs text-muted-foreground mr-auto">
                <Info className="h-3.5 w-3.5 mr-1" />
                <span>Selected {Object.values(selectedMeetings).filter(Boolean).length} of {detectedMeetings.length} meetings</span>
              </div>
              <Button variant="outline" onClick={() => setShowDetectedDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmMeetings}
                disabled={confirmMeetingsMutation.isPending || Object.values(selectedMeetings).filter(Boolean).length === 0}
              >
                {confirmMeetingsMutation.isPending ? "Adding..." : "Add to Calendar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}