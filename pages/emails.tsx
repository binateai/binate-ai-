import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Mail, Inbox, Send, Archive, Trash, Star, Tag, RefreshCw, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Email } from "@shared/schema";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Emails() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emailAnalysis, setEmailAnalysis] = useState<any | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [newEmail, setNewEmail] = useState({
    to: "",
    subject: "",
    message: ""
  });
  const { toast } = useToast();
  
  // Fetch emails from the API
  const { 
    data: emails = [], 
    isLoading, 
    isError, 
    refetch,
    isFetching
  } = useQuery<Email[]>({ 
    queryKey: ['/api/emails'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/emails?unreadOnly=false');
      return response.json();
    }
  });
  
  // Fetch new emails from Gmail
  const fetchNewEmailsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/emails?fetch=true');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      toast({
        title: "Emails refreshed",
        description: "Your inbox has been updated with the latest emails",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to refresh emails",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Analyze email
  const analyzeEmailMutation = useMutation({
    mutationFn: async (emailIdOrMessageId: number | string) => {
      const response = await apiRequest('POST', `/api/emails/${emailIdOrMessageId}/analyze`);
      return response.json();
    },
    onSuccess: (data) => {
      setEmailAnalysis(data);
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Auto-process emails
  const autoProcessMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/emails/auto-process');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      toast({
        title: "Emails processed",
        description: `Processed ${data.processed} emails, created ${data.tasksCreated} tasks, and replied to ${data.replied} messages.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Auto-processing failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Format email date for display
  const formatEmailDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday, " + format(date, "h:mm a");
    } else if (new Date().getFullYear() === date.getFullYear()) {
      return format(date, "MMM d");
    } else {
      return format(date, "MM/dd/yyyy");
    }
  };
  
  // Extract sender name from email
  const getSenderName = (fromString: string) => {
    // Try to extract name from format "Name <email@example.com>"
    const nameMatch = fromString.match(/(.*?)\s*<.*>/);
    if (nameMatch && nameMatch[1].trim()) {
      return nameMatch[1].trim();
    }
    
    // Otherwise, just use the email address or the full string if no email found
    const emailMatch = fromString.match(/<(.*)>/) || fromString.match(/([^\s]+@[^\s]+)/);
    return emailMatch ? emailMatch[1] : fromString;
  };
  
  // Count unread emails
  const unreadCount = emails.filter(email => !email.isRead).length;
  
  // Filter emails based on search query
  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(query) ||
      email.from?.toLowerCase().includes(query) ||
      email.body?.toLowerCase().includes(query)
    );
  });

  // Mark an email as read
  const markEmailAsReadMutation = useMutation({
    mutationFn: async (emailIdOrMessageId: number | string) => {
      const response = await apiRequest('POST', `/api/emails/${emailIdOrMessageId}/mark-read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to mark as read",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle email selection and marking as read
  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setEmailAnalysis(null);
    
    // If email is unread, mark it as read
    if (email.isRead === false) {
      markEmailAsReadMutation.mutate(email.id);
    }
    
    // Analyze email with Claude
    analyzeEmailMutation.mutate(email.id);
  };

  // Generate an AI reply for an email
  const generateReplyMutation = useMutation({
    mutationFn: async (emailIdOrMessageId: number | string) => {
      const response = await apiRequest('POST', `/api/emails/${emailIdOrMessageId}/analyze`);
      return response.json();
    },
    onSuccess: (data) => {
      setEmailAnalysis({
        ...emailAnalysis,
        suggestedReply: data.suggestedReply,
      });
      
      toast({
        title: "Reply generated",
        description: "An AI-generated reply has been created for this email",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate reply",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Send a reply to an email
  const sendReplyMutation = useMutation({
    mutationFn: async ({ emailId, content }: { emailId: number | string, content: string }) => {
      const response = await apiRequest('POST', `/api/emails/${emailId}/reply`, { content });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully",
      });
      setSelectedEmail(null);
      setEmailAnalysis(null);
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
    },
    onError: (error: any) => {
      // Check if the error is related to Google account not being connected
      if (error.message && error.message.includes('Google account not connected')) {
        toast({
          title: "Google account not connected",
          description: "Please connect your Google account in Settings before replying to emails.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to send reply",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    }
  });
  
  // Send a new email
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: { to: string, subject: string, message: string }) => {
      const response = await apiRequest('POST', '/api/emails/send', emailData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully",
      });
      setShowComposeModal(false);
      setNewEmail({
        to: "",
        subject: "",
        message: ""
      });
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
    },
    onError: (error: any) => {
      // Check if the error is related to Google account not being connected
      if (error.message && error.message.includes('Google account not connected')) {
        toast({
          title: "Google account not connected",
          description: "Please connect your Google account in Settings before sending emails.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to send email",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    }
  });
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Google Connection Status Banner */}
        <div className="bg-destructive/20 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div>
              <h3 className="font-medium text-sm">Google account not connected</h3>
              <p className="text-sm">Please connect your Google account in Settings before sending emails.</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={() => window.location.href = '/settings'}>
            Go to Settings
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Email Management</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => autoProcessMutation.mutate()}
              disabled={autoProcessMutation.isPending}
            >
              {autoProcessMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3L4.5 9L4.5 15L12 21L19.5 15V9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              Auto-Process
            </Button>
            <Button 
              variant="outline" 
              onClick={() => fetchNewEmailsMutation.mutate()}
              disabled={fetchNewEmailsMutation.isPending}
            >
              {fetchNewEmailsMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button onClick={() => setShowComposeModal(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Compose
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search emails..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                <Button variant="ghost" className="w-full justify-start px-4">
                  <Inbox className="mr-2 h-4 w-4" />
                  Inbox
                  <Badge className="ml-auto">{unreadCount}</Badge>
                </Button>
                <Button variant="ghost" className="w-full justify-start px-4">
                  <Star className="mr-2 h-4 w-4" />
                  Starred
                </Button>
                <Button variant="ghost" className="w-full justify-start px-4">
                  <Send className="mr-2 h-4 w-4" />
                  Sent
                </Button>
                <Button variant="ghost" className="w-full justify-start px-4">
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
                <Button variant="ghost" className="w-full justify-start px-4">
                  <Trash className="mr-2 h-4 w-4" />
                  Trash
                </Button>
                
                <div className="pt-4 pb-2 px-4 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
                </div>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start px-4"
                  onClick={() => autoProcessMutation.mutate()}
                  disabled={autoProcessMutation.isPending}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 3L4.5 9L4.5 15L12 21L19.5 15V9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Auto-Process Inbox
                </Button>
              </nav>
            </CardContent>
          </Card>
          
          {/* Email list & view */}
          <Card className="lg:col-span-3">
            <Tabs defaultValue="inbox">
              <div className="border-b px-6 py-2 flex justify-between items-center">
                <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-5">
                  <TabsTrigger value="inbox">Inbox</TabsTrigger>
                  <TabsTrigger value="drafts">Drafts</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                  <TabsTrigger value="junk" className="hidden md:block">Junk</TabsTrigger>
                  <TabsTrigger value="trash" className="hidden md:block">Trash</TabsTrigger>
                </TabsList>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => fetchNewEmailsMutation.mutate()}
                  disabled={fetchNewEmailsMutation.isPending}
                >
                  {fetchNewEmailsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>
              
              <TabsContent value="inbox" className="m-0">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading emails...</p>
                  </div>
                ) : isError ? (
                  <div className="p-8 text-center">
                    <p className="text-destructive">Failed to load emails</p>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => refetch()}
                    >
                      Try again
                    </Button>
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">No emails found</p>
                    {searchQuery && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Clear your search or fetch new emails
                      </p>
                    )}
                  </div>
                ) : selectedEmail ? (
                  <div className="divide-y divide-border">
                    {/* Email detail view */}
                    <div className="p-6">
                      <div className="flex justify-between mb-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedEmail(null);
                            setEmailAnalysis(null);
                          }}
                        >
                          Back to inbox
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={analyzeEmailMutation.isPending}
                            onClick={() => analyzeEmailMutation.mutate(selectedEmail.id)}
                          >
                            {analyzeEmailMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3L4.5 9L4.5 15L12 21L19.5 15V9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                            Analyze
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={generateReplyMutation.isPending}
                            onClick={() => generateReplyMutation.mutate(selectedEmail.id)}
                          >
                            {generateReplyMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 13L17 13L13 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M17 13L13 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M21 8V8C21 12.4183 17.4183 16 13 16H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                            Generate Reply
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3">{selectedEmail.subject}</h3>
                        <div className="flex items-center mb-4">
                          <Avatar className="h-10 w-10 mr-4">
                            <AvatarFallback>
                              {getSenderName(selectedEmail.from).substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{getSenderName(selectedEmail.from)}</p>
                            <p className="text-xs text-muted-foreground">{selectedEmail.from}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatEmailDate(selectedEmail.date)}
                              {selectedEmail.to && ` to ${selectedEmail.to}`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Email body */}
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert" 
                          dangerouslySetInnerHTML={{ __html: selectedEmail.body || '' }}
                        />
                      </div>
                      
                      {/* AI Analysis */}
                      {emailAnalysis && (
                        <div className="mt-6 border rounded-lg p-4 bg-accent/10">
                          <h4 className="text-sm font-semibold mb-2">AI Analysis</h4>
                          
                          {emailAnalysis.intent && (
                            <div className="mb-3">
                              <p className="text-xs font-medium">Intent:</p>
                              <Badge className="mt-1">
                                {emailAnalysis.intent.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          )}
                          
                          {emailAnalysis.summary && (
                            <div className="mb-3">
                              <p className="text-xs font-medium">Summary:</p>
                              <p className="text-sm mt-1">{emailAnalysis.summary}</p>
                            </div>
                          )}
                          
                          {emailAnalysis.extractedData && (
                            <div className="mb-3">
                              <p className="text-xs font-medium">Extracted Data:</p>
                              <pre className="text-xs bg-accent/30 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(emailAnalysis.extractedData, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          {emailAnalysis.suggestedReply && (
                            <div className="mt-4">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-xs font-medium">Suggested Reply:</p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled={sendReplyMutation.isPending}
                                  onClick={() => sendReplyMutation.mutate({
                                    emailId: selectedEmail.id,
                                    content: emailAnalysis.suggestedReply
                                  })}
                                >
                                  {sendReplyMutation.isPending ? (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  ) : null}
                                  Send Reply
                                </Button>
                              </div>
                              <div className="bg-background rounded-md border p-3 text-sm">
                                {emailAnalysis.suggestedReply}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {filteredEmails.map((email) => {
                        // Extract sender name and format date
                        const senderName = getSenderName(email.from);
                        const formattedDate = formatEmailDate(email.date);
                        
                        return (
                          <div 
                            key={email.id} 
                            className={`p-4 hover:bg-accent/50 transition duration-150 cursor-pointer ${!email.isRead ? 'bg-accent/20' : ''}`}
                            onClick={() => handleEmailClick(email)}
                          >
                            <div className="flex items-start">
                              <Avatar className="h-10 w-10 mr-4">
                                <AvatarFallback>{senderName.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                  <p className={`text-sm ${!email.isRead ? 'font-medium' : ''} text-foreground`}>
                                    {senderName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{formattedDate}</p>
                                </div>
                                <p className={`text-sm ${!email.isRead ? 'font-medium' : ''} text-foreground truncate`}>
                                  {email.subject}
                                </p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {email.body?.replace(/<[^>]*>/g, '').substring(0, 120) + '...'}
                                </p>
                                {email.labels && email.labels.length > 0 && (
                                  <div className="mt-2 flex flex-wrap">
                                    {email.labels.map((label) => (
                                      <Badge key={label} className="mr-2 mb-1" variant="outline">
                                        {label}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4 flex-shrink-0 flex flex-col">
                                {!email.isRead && (
                                  <div className="h-2 w-2 rounded-full bg-primary mb-2" />
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-muted-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEmailClick(email);
                                    generateReplyMutation.mutate(email.id);
                                  }}
                                >
                                  <span className="sr-only">AI reply</span>
                                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 3L4.5 9L4.5 15L12 21L19.5 15V9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M12 12L4.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M12 12L19.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </Button>
                                {isFetching ? null : (
                                  <div className="text-xs text-muted-foreground mt-1">AI reply</div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </TabsContent>
              
              <TabsContent value="drafts" className="m-0">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-medium">No drafts</h3>
                  <p className="text-sm text-muted-foreground mt-2">You have no saved drafts.</p>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="sent" className="m-0">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-medium">Sent emails</h3>
                  <p className="text-sm text-muted-foreground mt-2">Your sent emails will appear here.</p>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="junk" className="m-0">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-medium">Junk folder</h3>
                  <p className="text-sm text-muted-foreground mt-2">Junk emails will appear here.</p>
                </CardContent>
              </TabsContent>
              
              <TabsContent value="trash" className="m-0">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-medium">Trash folder</h3>
                  <p className="text-sm text-muted-foreground mt-2">Deleted emails will appear here.</p>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
      
      {/* Email Compose Modal */}
      <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
            <DialogDescription>
              Create a new email to send
            </DialogDescription>
          </DialogHeader>
          
          {/* Google Connection Warning */}
          <div className="bg-destructive/20 border border-destructive rounded-md p-3 text-destructive mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-sm">
                <p><strong>Google account not connected</strong></p>
                <p>Email sending is unavailable until you connect your Google account in Settings.</p>
              </div>
            </div>
          </div>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="to" className="text-right">
                To
              </Label>
              <Input 
                id="to" 
                placeholder="recipient@example.com" 
                className="col-span-3" 
                value={newEmail.to}
                onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input 
                id="subject" 
                placeholder="Email subject" 
                className="col-span-3" 
                value={newEmail.subject}
                onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <div className="col-span-3">
                <Textarea 
                  id="message" 
                  placeholder="Write your message here..." 
                  className="w-full min-h-[200px]" 
                  value={newEmail.message}
                  onChange={(e) => setNewEmail({ ...newEmail, message: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowComposeModal(false)}>
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={() => sendEmailMutation.mutate(newEmail)}
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </Layout>
  );
}
