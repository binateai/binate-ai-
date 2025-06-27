import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Info, AlertTriangle, Lock, Unlock, ExternalLink, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLocation, Link } from 'wouter';

export default function GoogleTestPage() {
  const [authUrl, setAuthUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<{ connected: boolean; email?: string }>({ connected: false });
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const successParam = urlParams.get('success');
  const errorParam = urlParams.get('error');

  // Show toast if there's a success or error param in the URL
  useEffect(() => {
    if (successParam === 'google_connected') {
      toast({
        title: "Success!",
        description: "Google account successfully connected",
        variant: "default"
      });
    } else if (errorParam) {
      toast({
        title: "Connection Error",
        description: decodeURIComponent(errorParam),
        variant: "destructive"
      });
    }
  }, [successParam, errorParam, toast]);

  // Check if user is logged in
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (res.ok) {
          const userData = await res.json();
          setIsLoggedIn(true);
          setUser(userData);
          
          // Check for connected Google service
          checkConnectedServices(userData.id);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        setIsLoggedIn(false);
        console.error('Error checking login status:', err);
      }
    };
    
    checkLogin();
  }, []);
  
  // Check if Google is already connected
  const checkConnectedServices = async (userId: number) => {
    try {
      const response = await fetch('/api/connected-services', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const services = await response.json();
        const googleService = services.find((s: any) => s.service === 'google');
        
        if (googleService && googleService.connected) {
          setServiceStatus({
            connected: true,
            email: googleService.username
          });
        }
      }
    } catch (err) {
      console.error('Error checking connected services:', err);
    }
  };

  // Get Google auth URL
  const fetchGoogleAuthUrl = async () => {
    try {
      setError('');
      setIsLoading(true);
      
      const response = await fetch('/api/auth/google', {
        credentials: 'include'
      });
      const data = await response.json();
      
      setAuthUrl(data.authUrl);
      console.log('Auth URL received:', data.authUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to get Google auth URL');
      console.error('Error getting Google auth URL:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle direct connection
  const handleDirectConnect = () => {
    // Debug logs
    console.log('Browser origin:', window.location.origin);
    console.log('Expected callback URL:', window.location.origin + '/api/auth/google/callback');
    
    // Construct OAuth URL directly
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];
    
    const clientId = '851055912816-73k28um9ttjabeofalneqofb4i2l7pf9.apps.googleusercontent.com';
    const redirectUri = window.location.origin + '/api/auth/google/callback';
    
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      scope: scopes.join(' ')
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;
    console.log('Generated auth URL:', authUrl);
    
    // Open auth URL in a new window
    window.open(authUrl, '_self');
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Simple navigation for direct access */}
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg mb-4">
          <div className="flex justify-center space-x-6">
            <Link href="/google-test" className="text-blue-700 dark:text-blue-300 hover:underline font-medium">
              Google Test Page
            </Link>
            <Link href="/settings" className="text-blue-700 dark:text-blue-300 hover:underline font-medium">
              Settings
            </Link>
            <Link href="/auth" className="text-blue-700 dark:text-blue-300 hover:underline font-medium">
              Auth Page
            </Link>
            <Link href="/" className="text-blue-700 dark:text-blue-300 hover:underline font-medium">
              Dashboard
            </Link>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Google OAuth Connection Test</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
        
        {(successParam || errorParam) && (
          <Alert variant={successParam ? "default" : "destructive"} className="mb-4">
            {successParam ? (
              <div className="flex items-center">
                <Badge className="bg-green-500 mr-2">Success</Badge>
                <AlertDescription>Google account successfully connected!</AlertDescription>
              </div>
            ) : (
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertDescription>{decodeURIComponent(errorParam || '')}</AlertDescription>
              </div>
            )}
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className={`h-5 w-5 mr-2 ${isLoggedIn ? 'text-green-500' : 'text-red-500'}`} />
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoggedIn ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    Authenticated
                  </Badge>
                  <span className="ml-2">Logged in as <span className="font-semibold">{user?.username}</span></span>
                </div>
                {user?.email && (
                  <div className="text-sm text-muted-foreground">
                    Email: {user.email}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center">
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                    Not Authenticated
                  </Badge>
                </div>
                <Button onClick={() => navigate('/auth')} className="w-full sm:w-auto">
                  <LogIn className="h-4 w-4 mr-2" />
                  Log In First
                </Button>
                <p className="text-sm text-muted-foreground">
                  Note: You don't need to be logged in to test the connection, but it won't save your credentials.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {serviceStatus.connected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Badge className="bg-green-500 mr-2">Connected</Badge>
                Google Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Your Google account <span className="font-semibold">{serviceStatus.email}</span> is connected.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You can still test the connection methods below to reconnect if needed.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Method 1: API Request</CardTitle>
              <CardDescription>
                Uses the frontend api request client to get the auth URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={fetchGoogleAuthUrl}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Google Auth URL
              </Button>
              
              {authUrl && (
                <div className="space-y-2">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto">
                    {authUrl}
                  </div>
                  <Button variant="default" className="w-full" asChild>
                    <a href={authUrl}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Google Account
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Method 2: Direct Connection</CardTitle>
              <CardDescription>
                Constructs the auth URL directly in the browser
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleDirectConnect}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect with Direct URL
              </Button>
              <p className="text-xs text-muted-foreground">
                This bypasses our API endpoint and constructs the auth URL directly in the browser.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 bg-slate-50 dark:bg-slate-900 p-4 rounded-md font-mono text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <span className="text-slate-500">Origin:</span> 
                  <span className="ml-2">{window.location.origin}</span>
                </div>
                <div>
                  <span className="text-slate-500">Path:</span>
                  <span className="ml-2">{window.location.pathname}</span>
                </div>
                <div>
                  <span className="text-slate-500">Callback URL:</span>
                  <span className="ml-2">{window.location.origin}/api/auth/google/callback</span>
                </div>
                <div>
                  <span className="text-slate-500">App URL:</span>
                  <span className="ml-2">{window.location.href}</span>
                </div>
                <div>
                  <span className="text-slate-500">Google Client ID:</span>
                  <span className="ml-2">851055912816-73k28um9ttja...</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}