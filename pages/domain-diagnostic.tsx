import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

export default function DomainDiagnosticPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/google/debug');
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        const data = await response.json();
        setConfig(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    }
    
    fetchConfig();
  }, []);
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Domain Configuration Diagnostic</CardTitle>
            <CardDescription>
              Loading configuration details...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load configuration: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const requestInfo = config?.request || {};
  const configInfo = config?.config || {};
  const envInfo = config?.env || {};
  
  // Check if we have a custom domain - safely access environment variables
  // Note: In a browser context, we need to use import.meta.env instead of process.env
  const hasCustomDomain = configInfo?.customDomain || false;
  const customDomain = configInfo?.customDomain || '';
  
  // Check if callback URLs match
  const callbackMatches = configInfo.googleCallbackUrl === requestInfo.dynamicCallbackUrl;
  
  const openGoogleAuth = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const data = await response.json();
      
      // Open in a new window instead of an iframe
      window.open(data.url, 'googleauth', 'width=800,height=600');
    } catch (err) {
      console.error('Failed to get Google auth URL:', err);
    }
  };
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Domain Configuration Diagnostic</CardTitle>
          <CardDescription>
            View the current domain settings and OAuth configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Request Information</h3>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
              <pre className="text-sm">{JSON.stringify(requestInfo, null, 2)}</pre>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Server Configuration</h3>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
              <pre className="text-sm">{JSON.stringify(configInfo, null, 2)}</pre>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Environment Variables</h3>
            <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
              <pre className="text-sm">{JSON.stringify(envInfo, null, 2)}</pre>
            </div>
          </div>
          
          <div className="mt-4 space-y-4">
            <Alert variant={hasCustomDomain ? "default" : "destructive"}>
              {hasCustomDomain ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>Custom Domain</AlertTitle>
              <AlertDescription>
                {hasCustomDomain 
                  ? `Custom domain is set to: ${customDomain}`
                  : "No custom domain is configured. Set CUSTOM_DOMAIN in environment variables."}
              </AlertDescription>
            </Alert>
            
            <Alert variant={callbackMatches ? "default" : "destructive"}>
              {callbackMatches ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>OAuth Callback URL</AlertTitle>
              <AlertDescription>
                {callbackMatches 
                  ? "OAuth callback URLs match correctly."
                  : "OAuth callback URLs do not match! This will cause authentication failures."}
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="default"
              onClick={openGoogleAuth}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Test Google OAuth Connection
            </Button>
            
            <a 
              href="/google-connect-simple.html" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Open Standalone Connection Page
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}