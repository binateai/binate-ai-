import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function EmailCard() {
  // Mock emails for demonstration
  // In a real application, these would come from an API
  const [emails] = useState([
    {
      id: 1,
      sender: "Tom Cook",
      senderEmail: "tom@example.com",
      subject: "Project update: New design requirements",
      preview: "Hi Sarah, I wanted to discuss the new design requirements for the client project. We need to update the color scheme and typography to match their brand guidelines...",
      time: "10:32 AM",
      tags: ["Work", "Important"],
      hasAiSummary: false,
    },
    {
      id: 2,
      sender: "Emily Davis",
      senderEmail: "emily@example.com",
      subject: "Invoice payment confirmation",
      preview: "Hello Sarah, This email confirms that we've received your payment for invoice #INV-2023-42. Thank you for your business! Let me know if you need anything else...",
      time: "Yesterday, 4:45 PM",
      tags: ["Finance"],
      hasAiSummary: false,
    },
    {
      id: 3,
      sender: "Michael Johnson",
      senderEmail: "michael@example.com",
      subject: "Meeting agenda for next week",
      preview: "Hi team, I'm sharing the agenda for our meeting next Tuesday at 10 AM. We'll be discussing Q2 results, the marketing strategy moving forward, and the timeline for our new product launch.",
      time: "Yesterday, 2:15 PM",
      tags: ["Meeting", "Important"],
      hasAiSummary: true,
      aiSummary: "Michael shared the agenda for next Tuesday's meeting (10 AM). Key topics: Q2 results, marketing strategy, and new product launch timeline. He requested your presentation on customer feedback.",
    },
  ]);

  const getTagColor = (tag: string) => {
    const tagColors: Record<string, string> = {
      Work: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
      Important: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
      Finance: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
      Meeting: "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
    };
    
    return tagColors[tag] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-border flex justify-between items-center">
        <CardTitle>Recent Emails</CardTitle>
        <Link href="/emails">
          <Button variant="link" className="text-sm p-0 h-auto">View all</Button>
        </Link>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {emails.map((email) => (
            <div key={email.id} className="p-6 hover:bg-accent/50 transition duration-150">
              <div className="flex items-start">
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${email.sender}`} alt={email.sender} />
                  <AvatarFallback>{email.sender.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">
                      {email.sender}
                    </p>
                    <p className="text-xs text-muted-foreground">{email.time}</p>
                  </div>
                  <p className="text-sm font-medium truncate">
                    {email.subject}
                  </p>
                  
                  {email.hasAiSummary ? (
                    <div className="mt-1 p-3 rounded-md bg-accent/50 border border-border">
                      <p className="text-xs font-medium mb-1">AI Summary:</p>
                      <p className="text-xs text-muted-foreground">{email.aiSummary}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {email.preview}
                    </p>
                  )}
                  
                  <div className="mt-2 flex flex-wrap gap-1">
                    {email.tags.map((tag) => (
                      <Badge key={tag} className={getTagColor(tag)}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex flex-col">
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Sparkles className="h-5 w-5" />
                  </Button>
                  <div className="text-xs text-muted-foreground mt-1 text-center">AI reply</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
