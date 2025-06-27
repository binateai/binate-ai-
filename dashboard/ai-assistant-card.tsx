import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mail, FileText, MessageSquareText, Clock, Brain, SendHorizontal } from "lucide-react";

export default function AiAssistantCard() {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // This would call the AI service endpoint
      // const response = await apiRequest("POST", "/api/ai/query", { query });
      
      toast({
        title: "AI Assistant",
        description: "I'm processing your request: " + query,
      });
      
      // Clear the input
      setQuery("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const features = [
    { icon: <Mail className="text-blue-500" />, label: "Draft Email Replies" },
    { icon: <FileText className="text-green-500" />, label: "Generate Invoice" },
    { icon: <MessageSquareText className="text-purple-500" />, label: "Meeting Notes" },
    { icon: <Clock className="text-amber-500" />, label: "Schedule Meeting" },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-border flex justify-between items-center">
        <CardTitle>AI Assistant</CardTitle>
        <Button variant="link" className="text-sm p-0 h-auto">Settings</Button>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="flex items-start mb-6">
          <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-full">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-4">
            <h4 className="text-md font-medium">Your Personal AI</h4>
            <p className="text-sm text-muted-foreground">Here's how I can help you today:</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <Button
              key={index}
              variant="outline"
              className="p-4 h-auto flex flex-col items-center justify-center text-center"
            >
              <div className="mb-2 h-10 w-10 flex items-center justify-center">
                {feature.icon}
              </div>
              <span className="text-sm font-medium">{feature.label}</span>
            </Button>
          ))}
        </div>
        
        <div className="mt-6">
          <form onSubmit={handleSubmit} className="relative">
            <Input
              placeholder="Ask me anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-10 rounded-full"
              disabled={isProcessing}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
              disabled={isProcessing || !query.trim()}
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
