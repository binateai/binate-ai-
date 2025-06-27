import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getGreeting, formatDate } from "@/lib/utils";
import { User } from "@shared/schema";
import { useState } from "react";
import { Info, Brain } from "lucide-react";

type WelcomeSectionProps = {
  user: User | null;
};

export default function WelcomeSection({ user }: WelcomeSectionProps) {
  const [showAlert, setShowAlert] = useState(true);
  
  const greeting = getGreeting();
  const today = formatDate(new Date());
  
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {greeting}, {user?.fullName || user?.username || "there"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{today}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center">
            <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-full mr-4">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Your AI Assistant</p>
              <p className="text-sm text-green-500">Active & Ready</p>
            </div>
          </div>
        </div>
        
        {showAlert && (
          <div className="mt-6 border-t border-border pt-4">
            <Alert className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">AI Assistant Update</AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-200">
                <p>I've learned your email response patterns. Would you like me to start drafting replies to common inquiries?</p>
                <div className="mt-4 flex space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 dark:text-blue-200 dark:border-blue-700"
                    onClick={() => setShowAlert(false)}
                  >
                    Enable
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 dark:text-blue-200 dark:border-blue-700"
                    onClick={() => setShowAlert(false)}
                  >
                    Review settings
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
