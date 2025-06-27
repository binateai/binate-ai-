import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Database, Server } from 'lucide-react';
import { Link } from 'wouter';

type DatabaseStatus = {
  connected: boolean;
  dbTime: string;
  responseTimeMs: number;
  platform: string;
  host: string;
  userCount?: number;
};

export default function DbStatus() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [domainName, setDomainName] = useState<string>('');

  useEffect(() => {
    // Get the current domain
    setDomainName(window.location.hostname);
    
    async function checkDbStatus() {
      try {
        const response = await fetch('/api/db/status');
        if (!response.ok) {
          throw new Error(`Database status check failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setDbStatus(data.database);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }
    
    checkDbStatus();
  }, []);
  
  const isProductionDomain = domainName === 'binateai.com';

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Database Status</h1>
      
      {!isProductionDomain && (
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Testing Domain</AlertTitle>
          <AlertDescription>
            You are on a test domain ({domainName}). This is connecting to the development database, 
            not the production database used by binateai.com.
          </AlertDescription>
        </Alert>
      )}
      
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {dbStatus?.connected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Database Connection
            </CardTitle>
            <CardDescription>
              Current PostgreSQL database connection status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={dbStatus?.connected ? "success" : "destructive"}>
                  {dbStatus?.connected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium">Response Time:</span>
                <span>{dbStatus?.responseTimeMs}ms</span>
              </div>
              
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium">Database Time:</span>
                <span>{dbStatus?.dbTime}</span>
              </div>
              
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium">Platform:</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Server className="h-3 w-3" />
                  {dbStatus?.platform}
                </Badge>
              </div>
              
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium">Host Domain:</span>
                <Badge variant="outline">{dbStatus?.host}</Badge>
              </div>
              
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-medium">User Count:</span>
                <Badge variant="secondary">{dbStatus?.userCount ?? 'Unknown'}</Badge>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t flex flex-col gap-4">
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-semibold mb-2">Debugging Notes</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  If you're seeing login failures on binateai.com, but can log in on the Replit preview,
                  it's likely because:
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>The production server has a different database than your development environment</li>
                  <li>Test user accounts created in development don't exist in production</li>
                  <li>Database migrations might not have been applied to production</li>
                </ul>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button asChild variant="outline">
                  <Link href="/oauth-status">Check OAuth Status</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth">Go to Login Page</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}