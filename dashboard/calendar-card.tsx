import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Event } from "@shared/schema";
import { Link } from "wouter";
import { formatTime } from "@/lib/utils";
import { Plus, Video, MapPin, Calendar, MoreVertical, Brain } from "lucide-react";

type CalendarCardProps = {
  events: Event[];
};

export default function CalendarCard({ events }: CalendarCardProps) {
  // Get current date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Filter to show upcoming events (today and future)
  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getTime() >= Date.now() - (12 * 60 * 60 * 1000); // Include events from 12 hours ago to handle ongoing events
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5); // Show up to 5 upcoming events
  
  // Helper to format date in a user-friendly way
  const formatEventDate = (dateStr: Date | string) => {
    const date = new Date(dateStr);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    
    const isToday = eventDate.getTime() === today.getTime();
    const isTomorrow = eventDate.getTime() === today.getTime() + 86400000;
    
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    // For dates within the next 7 days, show day name
    if (eventDate.getTime() < today.getTime() + 7 * 86400000) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get event border color
  const getEventBorderColor = (index: number) => {
    const colors = ["border-green-500", "border-purple-500", "border-blue-500", "border-red-500"];
    return colors[index % colors.length];
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-border flex justify-between items-center">
        <CardTitle>Upcoming Meetings</CardTitle>
        <Link href="/calendar">
          <Button variant="link" className="text-sm p-0 h-auto">View calendar</Button>
        </Link>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h4 className="text-lg font-semibold">
            {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h4>
          <p className="text-sm text-muted-foreground">
            {today.toLocaleDateString('en-US', { weekday: 'long' })}
          </p>
        </div>
        
        <div className="space-y-4">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event: Event, index: number) => (
              <div key={event.id} className={`flex items-start border-l-4 ${getEventBorderColor(index)} pl-4 py-2`}>
                <div className="w-16">
                  <p className="text-sm font-medium">{formatEventDate(event.startTime)}</p>
                </div>
                <div className="ml-4 flex-1">
                  <h5 className="text-sm font-semibold">{event.title}</h5>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
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
                    <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                      <div className="flex items-start">
                        <Brain className="h-4 w-4 text-purple-500 mr-1" />
                        <div>
                          <p className="text-xs font-medium text-purple-800 dark:text-purple-300">AI Meeting Prep</p>
                          <p className="text-xs text-purple-700 dark:text-purple-200">{event.aiNotes}</p>
                          <Link href="/calendar">
                            <a className="text-xs font-medium text-primary hover:underline">View details</a>
                          </Link>
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
            ))
          ) : (
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="mt-2 text-sm text-muted-foreground">No upcoming meetings scheduled</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <div className="px-6 py-4 border-t border-border">
        <Link href="/calendar">
          <Button variant="link" className="flex items-center text-primary p-0 h-auto">
            <Plus className="h-4 w-4 mr-1" />
            Schedule meeting
          </Button>
        </Link>
      </div>
    </Card>
  );
}
