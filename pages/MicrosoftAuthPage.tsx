import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

export default function MicrosoftAuthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle Microsoft manual authentication
  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/microsoft/manual-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: "Your Microsoft account has been connected successfully!",
        });
        navigate("/app/settings/email");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Microsoft authentication error:", error);
      toast({
        title: "Authentication Failed",
        description: (error as Error).message || "Failed to authenticate with Microsoft. Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Microsoft OAuth without popups
  const handleOAuthAuth = async () => {
    setLoading(true);
    
    try {
      // Use a direct approach to Microsoft authentication
      console.log("Starting Microsoft authentication process");
      
      // Prepare the OAuth URL with all required parameters
      const clientId = '3e9d9152-c120-4a5c-9bc4-8c6aaca4a3e9';
      const redirectUri = `${window.location.origin}/api/auth/microsoft/callback`;
      const scopes = 'offline_access User.Read Mail.Read Mail.ReadWrite Mail.Send Calendars.Read Calendars.ReadWrite';
      
      const authUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' +
        `?client_id=${encodeURIComponent(clientId)}` + 
        '&response_type=code' +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        '&response_mode=query' +
        `&scope=${encodeURIComponent(scopes)}` +
        `&state=${Date.now()}`;  // Using timestamp as state to prevent CSRF
      
      // Redirect the user to Microsoft's authorization page
      window.location.href = authUrl;
      console.log("Redirecting to Microsoft auth URL:", authUrl);
      
    } catch (error) {
      console.error("Microsoft OAuth error:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Microsoft. Please try again later.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/app/settings/email")}
              className="mb-2 -ml-2 -mt-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <div className="flex items-center mb-2">
            <div className="mr-2 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle>Connect Microsoft Account</CardTitle>
          </div>
          <CardDescription>
            Connect your Microsoft account to use with Binate AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Button 
                className="w-full" 
                onClick={handleOAuthAuth}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Sign in with Microsoft
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with credentials
                </span>
              </div>
            </div>
            
            <form onSubmit={handleManualAuth}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    placeholder="m.example@outlook.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect Account
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center text-xs text-muted-foreground">
          <p>Your credentials are securely transmitted and never stored.</p>
          <p>We only store authorization tokens for email integration.</p>
        </CardFooter>
      </Card>
    </div>
  );
}