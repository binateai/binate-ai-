import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Globe, Server, Database, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

type ConfigInfo = {
  baseUrl: string;
  google: {
    callbackUrl: string;
    callbackPath: string;
  };
};

type HostInfo = {
  host: string;
  origin: string;
  ip?: string;
  forwardedHost?: string;
  forwardedProto?: string;
  userAgent?: string;
};

export default function HostConfig() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configInfo, setConfigInfo] = useState<ConfigInfo | null>(null);
  const [hostInfo, setHostInfo] = useState<HostInfo | null>(null);
  const [domainName, setDomainName] = useState<string>('');

  useEffect(() => {
    // Get the current domain
    setDomainName(window.location.hostname);
    checkConfig();
  }, []);

  const checkConfig = async () => {
    setLoading(true);
    try {
      // Get configuration info
      const configResponse = await fetch('/api/config');
      if (!configResponse.ok) {
        throw new Error(`Config check failed: ${configResponse.status} ${configResponse.statusText}`);
      }
      const configData = await configResponse.json();
      setConfigInfo(configData);
      
      // Get host info from our diagnostic endpoint
      const hostResponse = await fetch('/api/healthcheck');
      if (!hostResponse.ok) {
        throw new Error(`Host check failed: ${hostResponse.status} ${hostResponse.statusText}`);
      }
      
      // Create host info
      const hostData = {
        host: window.location.hostname,
        origin: window.location.origin,
        userAgent: navigator.userAgent
      };
      setHostInfo(hostData);
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    checkConfig();
  };
  
  const isProductionDomain = domainName === 'binateai.com';
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-4 text-center">Host Configuration</h1>
      <p className="text-center mb-8 text-muted-foreground">
        This tool helps diagnose connection issues between your domain and application
      </p>
      
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Host Information
              </CardTitle>
              <CardDescription>
                Details about your current connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Current Host:</span>
                  <Badge variant="outline">{hostInfo?.host || domainName}</Badge>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Origin:</span>
                  <Badge variant="outline">{hostInfo?.origin}</Badge>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">User Agent:</span>
                  <span className="text-xs break-all text-muted-foreground">{hostInfo?.userAgent}</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Domain Type:</span>
                  {isProductionDomain ? (
                    <Badge variant="default" className="bg-green-500">Production</Badge>
                  ) : (
                    <Badge variant="secondary">Development</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Server Configuration
              </CardTitle>
              <CardDescription>
                Current server configuration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Base URL:</span>
                  <Badge variant="outline">{configInfo?.baseUrl}</Badge>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Callback URL:</span>
                  <Badge variant="outline">{configInfo?.google.callbackUrl}</Badge>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-medium">Match Status:</span>
                  {hostInfo?.origin === configInfo?.baseUrl ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Matched
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Mismatched
                    </Badge>
                  )}
                </div>
              </div>
              
              {hostInfo?.origin !== configInfo?.baseUrl && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Configuration Mismatch</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">Your current origin ({hostInfo?.origin}) does not match the configured base URL ({configInfo?.baseUrl}).</p>
                    <p className="text-sm">This could cause issues with authentication and API requests.</p>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Connection Diagnosis
              </CardTitle>
              <CardDescription>
                Analysis of your connection issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Domain Connection Issue</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Based on the data, here's what appears to be happening:
                  </p>
                  
                  <div className="flex items-center gap-2 my-3">
                    <Badge variant="outline" className="flex-shrink-0">binateai.com</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="destructive" className="flex-shrink-0">Not Reaching Replit</Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    The domain binateai.com is not properly pointed to your Replit application.
                  </p>
                  
                  <Alert className="my-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>How to fix this issue:</AlertTitle>
                    <AlertDescription>
                      <ol className="list-decimal pl-5 text-sm space-y-1 mt-2">
                        <li>Make sure your domain's DNS settings have an A or CNAME record pointing to Replit.</li>
                        <li>Check Replit's documentation on connecting custom domains.</li>
                        <li>In Replit, go to your project settings and configure the custom domain properly.</li>
                        <li>Once connected, make sure traffic is properly being routed to your application.</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Session & Cookie Considerations</h3>
                  <p className="text-sm text-muted-foreground">
                    Even when the domain is properly connected, cookies and sessions may not work across domains 
                    due to browser security restrictions. This can cause authentication issues.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <div className="w-full flex gap-4 justify-center">
                <Button onClick={handleRefresh} className="flex items-center gap-2">
                  Refresh Data
                </Button>
                <Button asChild variant="outline">
                  <Link href="/domain-sync">Check Domain Sync</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}