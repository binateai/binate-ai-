import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function OAuthStatus() {
  const [status, setStatus] = useState<{
    loading: boolean;
    baseUrl: string | null;
    callbackUrl: string | null;
    clientId: string | null;
    error: string | null;
  }>({
    loading: true,
    baseUrl: null,
    callbackUrl: null,
    clientId: null,
    error: null
  });

  useEffect(() => {
    async function checkOAuthStatus() {
      try {
        const response = await fetch('/api/auth/google/diagnostic');
        if (!response.ok) {
          setStatus({
            loading: false,
            baseUrl: null,
            callbackUrl: null,
            clientId: null,
            error: `Failed to get OAuth status: ${response.status} ${response.statusText}`
          });
          return;
        }
        
        const data = await response.json();
        setStatus({
          loading: false,
          baseUrl: data.baseUrl,
          callbackUrl: data.callbackUrl,
          clientId: data.clientId,
          error: null
        });
      } catch (error) {
        setStatus({
          loading: false,
          baseUrl: null,
          callbackUrl: null,
          clientId: null,
          error: `Error checking OAuth status: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }
    
    checkOAuthStatus();
  }, []);

  const handleTestAuth = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">OAuth Configuration Status</h1>
      
      {status.loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : status.error ? (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{status.error}</AlertDescription>
        </Alert>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              OAuth Configuration
            </CardTitle>
            <CardDescription>
              Current OAuth configuration for Google authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Base URL:</span>
                <div>
                  <Badge variant={status.baseUrl?.includes('binateai.com') ? 'default' : 'secondary'} 
                         className={status.baseUrl?.includes('binateai.com') ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}>
                    {status.baseUrl}
                  </Badge>
                  {status.baseUrl?.includes('binateai.com') ? (
                    <span className="ml-2 text-green-600 text-sm">✓ Production domain</span>
                  ) : (
                    <span className="ml-2 text-amber-600 text-sm">⚠ Not production domain</span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Callback URL:</span>
                <div>
                  <Badge variant={status.callbackUrl?.includes('binateai.com') ? 'default' : 'secondary'}
                         className={status.callbackUrl?.includes('binateai.com') ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}>
                    {status.callbackUrl}
                  </Badge>
                  {status.callbackUrl?.includes('binateai.com') ? (
                    <span className="ml-2 text-green-600 text-sm">✓ Production callback</span>
                  ) : (
                    <span className="ml-2 text-amber-600 text-sm">⚠ Not production callback</span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="font-medium">Client ID:</span>
                <Badge variant="outline">
                  {status.clientId?.substring(0, 10)}...{status.clientId?.substring(status.clientId.length - 10)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Test Google OAuth
          </CardTitle>
          <CardDescription>
            Click the button below to test the Google OAuth authentication flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleTestAuth} className="w-full">
            Test Google Authentication
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            This will redirect you to Google's authentication page. After logging in, you should be redirected back to this application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}